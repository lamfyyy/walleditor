import type { Project, Issue } from './types';
import { pixelSize } from './devices';
import { evalLayer } from './anim';
import { parseXml, XNode, child, childrenOf } from './xml';

/** Линейная выборка CAKeyframeAnimation так, как это делает CoreAnimation (calculationMode=linear, keyTimes). */
function sampleCaml(a: XNode, u: number): number {
  const vals = childrenOf(child(a, 'values')!, 'real').map((r) => Number(r.attrs.value));
  const kt = child(a, 'keyTimes');
  const times = kt ? childrenOf(kt, 'real').map((r) => Number(r.attrs.value)) : vals.map((_, i) => i / Math.max(1, vals.length - 1));
  if (u <= times[0]) return vals[0];
  for (let i = 0; i < times.length - 1; i++) if (u <= times[i + 1]) return vals[i] + ((u - times[i]) / (times[i + 1] - times[i] || 1)) * (vals[i + 1] - vals[i]);
  return vals[vals.length - 1];
}

/** Фаза 0..1 по атрибутам анимации в CAML (duration, autoreverses, repeatCount). */
function camlPhase(a: XNode, t: number): number {
  const d = Number(a.attrs.duration) || 1, rev = a.attrs.autoreverses === '1', inf = a.attrs.repeatCount === 'inf';
  if (!inf && t >= d * (rev ? 2 : 1)) return rev ? 0 : 1;
  if (rev) { const m = (t % (2 * d)) / d; return m <= 1 ? m : 2 - m; }
  return (t % d) / d;
}

/**
 * Сверка предпросмотра с экспортированным main.caml: для каждого видимого слоя сравнивает позицию, поворот,
 * масштаб и прозрачность, которые нарисует редактор, с тем, что выдаст CoreAnimation по записанному CAML.
 * Проверяет внутреннюю согласованность двух реализаций; корректность чтения PosterBoard на устройстве не доказывает.
 */
export function checkPreviewConsistency(p: Project, camlText: string, samples = 13): Issue[] {
  const { h: H } = pixelSize(p.profile);
  const issues: Issue[] = [];
  const root = parseXml(camlText);
  const byId = new Map<string, XNode>();
  const walk = (n: XNode) => { if (n.attrs.nuggetId) byId.set(n.attrs.nuggetId, n); n.children.forEach(walk); };
  walk(root);
  for (const l of p.layers) {
    if (!l.visible || l.kind === 'video') continue;
    const node = byId.get(l.id);
    if (!node) { issues.push({ level: 'error', code: 'LAYER_NOT_IN_CAML', message: `Слой «${l.name}» не попал в main.caml.`, layerId: l.id }); continue; }
    const anims = child(node, 'animations') ? childrenOf(child(node, 'animations')!, 'animation') : [];
    const byKey = new Map(anims.map((a) => [a.attrs.keyPath, a] as const));
    const dur = l.animation.enabled ? Math.max(0.01, l.animation.duration) : 1;
    const cx = l.x + l.w / 2, cy = l.y + l.h / 2;
    const [px, py] = node.attrs.position.split(' ').map(Number);
    let worst = 0; let what = '';
    for (let i = 0; i < samples; i++) {
      const t = (i / (samples - 1)) * dur * (l.animation.autoreverse ? 2 : 1) * 1.5;
      const e = evalLayer(l, t);
      const get = (kp: string, fallback: number) => { const a = byKey.get(kp); return a ? sampleCaml(a, camlPhase(a, t)) : fallback; };
      const exp = {
        'position.x': cx + e.dx, 'position.y': H - (cy + e.dy),
        'transform.rotation.z': (-(l.rotation + e.rotation) * Math.PI) / 180,
        'transform.scale': l.scale * e.scale, 'opacity': l.opacity * e.opacity
      };
      const got = {
        'position.x': get('position.x', px), 'position.y': get('position.y', py),
        'transform.rotation.z': get('transform.rotation.z', 0),
        'transform.scale': get('transform.scale', l.scale), 'opacity': get('opacity', Number(node.attrs.opacity ?? 1))
      };
      for (const k of Object.keys(exp) as (keyof typeof exp)[]) {
        const tol = k === 'position.x' || k === 'position.y' ? 0.5 : 1e-3; // px для позиции, 1e-3 для угла/масштаба/прозрачности
        const d = Math.abs(exp[k] - got[k]);
        if (d > tol && d > worst) { worst = d; what = `${k}: предпросмотр ${exp[k].toFixed(3)} ≠ CAML ${got[k].toFixed(3)} при t=${t.toFixed(2)} с`; }
      }
    }
    if (worst > 0) issues.push({ level: 'error', code: 'PREVIEW_MISMATCH', message: `Слой «${l.name}»: предпросмотр расходится с экспортом (${what}).`, layerId: l.id, setting: 'animation' });
  }
  return issues;
}

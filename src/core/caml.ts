import type { Layer, Project, AnimTrack } from './types';
import { pixelSize } from './devices';
import { esc } from './xml';
import { phase } from './anim';

const n = (x: number) => (Math.round(x * 1000) / 1000).toString();

export function hexToRgb(hex: string): [number, number, number] {
  const h = (hex || '#000000').replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return [parseInt(v.slice(0, 2), 16) / 255, parseInt(v.slice(2, 4), 16) / 255, parseInt(v.slice(4, 6), 16) / 255];
}
const rgbStr = (hex: string) => hexToRgb(hex).map((c) => n(c)).join(' ');

export interface LayerAssets {
  /** Имя файла в assets/ для статичного слоя (image/background). */
  file?: string;
  /** Для видео-слоя: имена кадров и длительность цикла. */
  frames?: string[];
  frameDuration?: number;
}

const CA_PROP: Record<string, string> = {
  x: 'position.x', y: 'position.y', rotation: 'transform.rotation.z', scale: 'transform.scale', opacity: 'opacity'
};

/** Преобразование значения трека (координаты холста сверху-вниз) в значение CoreAnimation (снизу-вверх). */
function caValue(l: Layer, tr: AnimTrack, v: number, H: number): number {
  const cx = l.x + l.w / 2, cy = l.y + l.h / 2;
  switch (tr.prop) {
    case 'x': return cx + v;
    case 'y': return H - (cy + v);
    case 'rotation': return (-(l.rotation + v) * Math.PI) / 180;
    case 'opacity': return v * l.opacity; // анимация заменяет модельное значение, поэтому статическая прозрачность умножается здесь
    default: return v;
  }
}

function animXml(l: Layer, H: number): string {
  const a = l.animation;
  const out: string[] = [];
  const d = Math.max(0.01, a.duration);
  const common = (kp: string, dur: number) =>
    `type="CAKeyframeAnimation" calculationMode="linear" keyPath="${kp}" beginTime="1e-100" duration="${n(dur)}" removedOnCompletion="0" repeatCount="${a.loop ? 'inf' : '1'}" repeatDuration="0" speed="1" timeOffset="0" autoreverses="${a.autoreverse ? 1 : 0}" fillMode="forwards"`;
  if (a.enabled) {
    for (const tr of a.tracks) {
      if (tr.keys.length < 2) continue;
      const vals = tr.keys.map((k) => `<real value="${n(caValue(l, tr, tr.prop === 'scale' ? k.v * l.scale : k.v, H))}"/>`).join('');
      const times = tr.keys.map((k) => `<real value="${n(k.t)}"/>`).join('');
      out.push(`<animation ${common(CA_PROP[tr.prop], d)}><keyTimes>${times}</keyTimes><values>${vals}</values></animation>`);
    }
  }
  // статический поворот/масштаб без трека — заглушка-анимация (см. verification: static-rotation)
  const hasRot = a.enabled && a.tracks.some((t) => t.prop === 'rotation');
  if (l.rotation && !hasRot) {
    const v = n((-l.rotation * Math.PI) / 180);
    out.push(`<animation type="CAKeyframeAnimation" calculationMode="linear" keyPath="transform.rotation.z" beginTime="1e-100" duration="1" removedOnCompletion="0" repeatCount="inf" speed="1" fillMode="forwards"><values><real value="${v}"/><real value="${v}"/></values></animation>`);
  }
  return out.join('');
}

function layerXml(l: Layer, W: number, H: number, assets: LayerAssets | undefined, idx: number): string {
  const w = l.w * l.scale, h = l.h * l.scale;
  const cx = l.x + l.w / 2, cy = l.y + l.h / 2;
  const base = `allowsEdgeAntialiasing="1" allowsGroupOpacity="1" bounds="0 0 ${n(w)} ${n(h)}" contentsFormat="RGBA8" cornerCurve="circular" name="${esc(l.name || 'Layer' + idx)}" nuggetId="${esc(l.id)}" opacity="${n(l.opacity)}" position="${n(cx)} ${n(H - cy)}"`;
  const anims = animXml(l, H);
  const wrap = (inner: string) => (anims ? `${inner}<animations>${anims}</animations>` : inner);

  if (l.kind === 'text') {
    return `<CATextLayer ${base} string="${esc(l.text ?? '')}" fontSize="${n((l.fontSize ?? 48) * l.scale)}" foregroundColor="${rgbStr(l.color ?? '#ffffff')}" alignmentMode="center" wrapped="1">${wrap('')}</CATextLayer>`;
  }
  if (l.kind === 'shape') {
    const r = l.shape === 'ellipse' ? Math.min(w, h) / 2 : l.shape === 'roundRect' ? (l.cornerRadius ?? 24) : 0;
    return `<CALayer ${base} backgroundColor="${rgbStr(l.fill ?? '#ffffff')}" cornerRadius="${n(r)}">${wrap('')}</CALayer>`;
  }
  if (l.kind === 'video' && assets?.frames?.length) {
    const dur = assets.frameDuration ?? l.animation.duration;
    const vals = assets.frames.map((f) => `<CGImage src="assets/${esc(f)}"/>`).join('\n');
    const kf = `<animation type="CAKeyframeAnimation" calculationMode="linear" keyPath="contents" beginTime="1e-100" duration="${n(dur)}" removedOnCompletion="0" repeatCount="inf" repeatDuration="0" speed="1" timeOffset="0" autoreverses="${l.animation.autoreverse ? 1 : 0}"><values>\n${vals}\n</values></animation>`;
    return `<CALayer ${base}><contents type="CGImage" src="assets/${esc(assets.frames[0])}"/><animations>${kf}${anims}</animations></CALayer>`;
  }
  const src = assets?.file ? `<contents type="CGImage" src="assets/${esc(assets.file)}"/>` : '';
  return `<CALayer ${base}>${src}${wrap('')}</CALayer>`;
}

const STATES = `<states>
<LKState name="Locked"><elements/></LKState>
<LKState name="Unlock"><elements/></LKState>
<LKState name="Sleep"><elements/></LKState>
</states>
<stateTransitions>
${['*|Unlock', 'Unlock|*', '*|Locked', 'Locked|*', '*|Sleep', 'Sleep|*'].map((s) => { const [a, b] = s.split('|'); return `<LKStateTransition fromState="${a}" toState="${b}"><elements/></LKStateTransition>`; }).join('\n')}
</stateTransitions>`;

/** main.caml: каркас _FLOATING → Chip сверен с VideoHandler.swift (Pocket Poster). */
export function buildMainCaml(p: Project, assets: Record<string, LayerAssets>): string {
  const { w: W, h: H } = pixelSize(p.profile);
  const body = p.layers
    .filter((l) => l.visible)
    .map((l, i) => layerXml(l, W, H, assets[l.id], i))
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<caml xmlns="http://www.apple.com/CoreAnimation/1.0">
<CALayer allowsEdgeAntialiasing="1" allowsGroupOpacity="1" bounds="0 0 ${W} ${H}" contentsFormat="RGBA8" cornerCurve="circular" hidden="0" name="_FLOATING" position="${W / 2} ${H / 2}">
<sublayers>
<CATransformLayer allowsEdgeAntialiasing="1" allowsGroupOpacity="1" allowsHitTesting="1" bounds="0 0 ${W} ${H}" contentsFormat="RGBA8" cornerCurve="circular" name="Chip" position="${W / 2} ${H / 2}">
<sublayers>
${body}
</sublayers>
</CATransformLayer>
</sublayers>
${STATES}
</CALayer>
</caml>
`;
}

/** index.xml (plist) — ключи сверены с VideoHandler.swift. */
export function buildIndexXml(W: number, H: number): string {
  const b = (k: string, v: boolean) => `<key>${k}</key>\n<${v}/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
<key>assetManifest</key>
<string>assetManifest.caml</string>
<key>documentHeight</key>
<real>${H}</real>
<key>documentResizesToView</key>
<true/>
<key>documentWidth</key>
<real>${W}</real>
${b('dynamicGuidesEnabled', true)}
${b('geometryFlipped', false)}
${b('guidesEnabled', true)}
${b('interactiveMouseEventsEnabled', true)}
${b('interactiveShowsCursor', true)}
${b('interactiveTouchEventsEnabled', false)}
<key>loopEnd</key>
<real>0.0</real>
<key>loopStart</key>
<real>0.0</real>
${b('loopingEnabled', false)}
${b('multitouchDisablesMouse', false)}
${b('multitouchEnabled', false)}
${b('presentationMouseEventsEnabled', true)}
${b('presentationShowsCursor', true)}
${b('presentationTouchEventsEnabled', false)}
<key>rootDocument</key>
<string>main.caml</string>
${b('savesWindowFrame', false)}
${b('scalesToFitInPlayer', true)}
${b('showsTouches', true)}
${b('snappingEnabled', true)}
<key>timelineMarkers</key>
<string>[(null)]</string>
<key>touchesColor</key>
<string>1 1 0 0.8</string>
${b('unitsInPixelsInPlayer', true)}
</dict>
</plist>
`;
}

export { phase };

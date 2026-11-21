import type { Layer, CanvasProfile } from './types';

export interface Guide { axis: 'x' | 'y'; pos: number; kind: 'center' | 'edge' | 'safe' | 'layer' }

/** Магнитное выравнивание: центр/края холста, безопасные зоны, края и центры других слоёв. */
export function snapMove(x: number, y: number, w: number, h: number, W: number, H: number, profile: CanvasProfile, others: Layer[], threshold: number): { x: number; y: number; guides: Guide[] } {
  const guides: Guide[] = [];
  const st = profile.safeTop * profile.scale, sb = H - profile.safeBottom * profile.scale;
  const xs: [number, Guide['kind']][] = [[0, 'edge'], [W / 2, 'center'], [W, 'edge']];
  const ys: [number, Guide['kind']][] = [[0, 'edge'], [H / 2, 'center'], [H, 'edge'], [st, 'safe'], [sb, 'safe']];
  for (const o of others) { xs.push([o.x, 'layer'], [o.x + o.w / 2, 'layer'], [o.x + o.w, 'layer']); ys.push([o.y, 'layer'], [o.y + o.h / 2, 'layer'], [o.y + o.h, 'layer']); }
  const fit = (start: number, size: number, targets: [number, Guide['kind']][], axis: 'x' | 'y') => {
    let best: { d: number; shift: number; t: [number, Guide['kind']] } | null = null;
    for (const off of [0, size / 2, size]) for (const t of targets) {
      const d = Math.abs(start + off - t[0]);
      if (d <= threshold && (!best || d < best.d)) best = { d, shift: t[0] - off - start, t };
    }
    if (best) { guides.push({ axis, pos: best.t[0], kind: best.t[1] }); return start + best.shift; }
    return start;
  };
  return { x: fit(x, w, xs, 'x'), y: fit(y, h, ys, 'y'), guides };
}

import type { Layer, AnimTrack, LayerAnimation } from './types';

/** Линейная интерполяция по ключам. Одна и та же функция питает предпросмотр. */
export function sampleTrack(track: AnimTrack, u: number): number {
  const k = track.keys;
  if (!k.length) return 0;
  if (u <= k[0].t) return k[0].v;
  if (u >= k[k.length - 1].t) return k[k.length - 1].v;
  for (let i = 0; i < k.length - 1; i++) {
    if (u >= k[i].t && u <= k[i + 1].t) {
      const span = k[i + 1].t - k[i].t || 1;
      return k[i].v + ((u - k[i].t) / span) * (k[i + 1].v - k[i].v);
    }
  }
  return k[k.length - 1].v;
}

/** Нормализованная фаза 0..1 в момент t (сек) с учётом loop/autoreverse. */
export function phase(a: LayerAnimation, t: number): number {
  const d = Math.max(0.01, a.duration);
  if (!a.loop && t >= d * (a.autoreverse ? 2 : 1)) return a.autoreverse ? 0 : 1;
  if (a.autoreverse) {
    const m = (t % (2 * d)) / d;
    return m <= 1 ? m : 2 - m;
  }
  return (t % d) / d;
}

export interface Pose { dx: number; dy: number; rotation: number; scale: number; opacity: number }

export function evalLayer(l: Layer, t: number): Pose {
  const pose: Pose = { dx: 0, dy: 0, rotation: 0, scale: 1, opacity: 1 };
  const a = l.animation;
  if (!a.enabled) return pose;
  const u = phase(a, t);
  for (const tr of a.tracks) {
    const v = sampleTrack(tr, u);
    if (tr.prop === 'x') pose.dx = v;
    else if (tr.prop === 'y') pose.dy = v;
    else if (tr.prop === 'rotation') pose.rotation = v;
    else if (tr.prop === 'scale') pose.scale = v;
    else if (tr.prop === 'opacity') pose.opacity = v;
  }
  return pose;
}

/** Плавное «плавание»: удобный пресет — стыки цикла совпадают (первый ключ = последний). */
export function floatPreset(amplitude: number, duration = 5): LayerAnimation {
  const sin = (n: number, f: (x: number) => number) => Array.from({ length: n + 1 }, (_, i) => ({ t: i / n, v: f((i / n) * Math.PI * 2) }));
  return {
    enabled: true, duration, loop: true, autoreverse: false,
    tracks: [
      { prop: 'y', keys: sin(8, (x) => Math.sin(x) * amplitude) },
      { prop: 'x', keys: sin(8, (x) => Math.sin(x * 2) * amplitude * 0.25) },
      { prop: 'rotation', keys: sin(8, (x) => Math.sin(x + 1) * 2.2) }
    ]
  };
}

/** Проверка бесшовности: расхождение значений на стыке цикла по каждому треку. */
export function loopSeamError(a: LayerAnimation): { prop: string; diff: number }[] {
  if (a.autoreverse) return [];
  return a.tracks
    .map((t) => ({ prop: t.prop, diff: Math.abs(t.keys[0].v - t.keys[t.keys.length - 1].v) }))
    .filter((x) => x.diff > 1e-6);
}

import type { AnimProp } from './types';
const mk = (duration: number, tracks: AnimTrack[], extra: Partial<LayerAnimation> = {}): LayerAnimation => ({ enabled: true, duration, loop: true, autoreverse: false, tracks, ...extra });
const wave = (n: number, f: (x: number) => number) => Array.from({ length: n + 1 }, (_, i) => ({ t: i / n, v: f((i / n) * Math.PI * 2) }));

export type PresetId = 'float' | 'sway' | 'spin' | 'pulse' | 'fade' | 'drift';
export const PRESETS: { id: PresetId; label: string; make: (amp: number) => LayerAnimation }[] = [
  { id: 'float', label: 'Плавание', make: (a) => floatPreset(a, 5) },
  { id: 'sway', label: 'Покачивание', make: () => mk(4, [{ prop: 'rotation', keys: wave(8, (x) => Math.sin(x) * 6) }]) },
  { id: 'spin', label: 'Вращение', make: () => mk(10, [{ prop: 'rotation', keys: [{ t: 0, v: 0 }, { t: 1, v: 360 }] }]) },
  { id: 'pulse', label: 'Пульс', make: () => mk(3, [{ prop: 'scale', keys: wave(8, (x) => 1 + Math.sin(x) * 0.06) }]) },
  { id: 'fade', label: 'Появление/исчезновение', make: () => mk(4, [{ prop: 'opacity', keys: [{ t: 0, v: 0 }, { t: 1, v: 1 }] }], { autoreverse: true }) },
  { id: 'drift', label: 'Дрейф', make: (a) => mk(8, [{ prop: 'x', keys: wave(8, (x) => Math.sin(x) * a) }, { prop: 'y', keys: wave(8, (x) => Math.cos(x) * a * 0.6) }]) }
];

export const PROP_LABEL: Record<AnimProp, string> = { x: 'X', y: 'Y', rotation: 'Поворот', scale: 'Масштаб', opacity: 'Прозрачность' };
export const PROP_RANGE: Record<AnimProp, [number, number]> = { x: [-600, 600], y: [-600, 600], rotation: [-360, 360], scale: [0.1, 3], opacity: [0, 1] };

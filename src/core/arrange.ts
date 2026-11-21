import type { Layer, LayerAnimation, CanvasProfile } from './types';
import { loopSeamError } from './anim';

export type AlignMode = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom' | 'safeTop' | 'safeBottom';
export type FitMode = 'contain' | 'cover' | 'stretch';

const vis = (l: Layer) => ({ w: l.w * l.scale, h: l.h * l.scale });

/** Выравнивание по видимой рамке слоя (с учётом масштаба) относительно холста или безопасных зон. */
export function alignLayer(l: Layer, W: number, H: number, mode: AlignMode, profile?: CanvasProfile): Pick<Layer, 'x' | 'y'> {
  const { w, h } = vis(l);
  const offX = (l.w - w) / 2, offY = (l.h - h) / 2; // x + offX = видимый левый край
  const st = profile ? profile.safeTop * profile.scale : 0, sb = profile ? profile.safeBottom * profile.scale : 0;
  switch (mode) {
    case 'left': return { x: -offX, y: l.y };
    case 'right': return { x: W - w - offX, y: l.y };
    case 'hcenter': return { x: (W - w) / 2 - offX, y: l.y };
    case 'top': return { x: l.x, y: -offY };
    case 'bottom': return { x: l.x, y: H - h - offY };
    case 'vcenter': return { x: l.x, y: (H - h) / 2 - offY };
    case 'safeTop': return { x: l.x, y: st - offY };
    case 'safeBottom': return { x: l.x, y: H - sb - h - offY };
  }
}

/** Вписать слой в холст, сохранив пропорции видимой области (с учётом обрезки). contain — целиком, cover — с заполнением, stretch — растянуть. */
export function fitLayer(l: Layer, W: number, H: number, mode: FitMode): Pick<Layer, 'x' | 'y' | 'w' | 'h' | 'scale'> {
  if (mode === 'stretch') return { x: 0, y: 0, w: W, h: H, scale: 1 };
  const ar = l.crop && l.assetW && l.assetH ? (l.crop.w * l.assetW) / (l.crop.h * l.assetH) : l.w / l.h;
  const k = mode === 'contain' ? Math.min(W / ar, H) : Math.max(W / ar, H);
  const h = k, w = k * ar;
  return { x: (W - w) / 2, y: (H - h) / 2, w, h, scale: 1 };
}

/** Автоисправление стыка цикла: последний ключ каждого трека приравнивается к первому. */
export function makeSeamless(a: LayerAnimation): LayerAnimation {
  if (a.autoreverse) return a;
  return { ...a, tracks: a.tracks.map((t) => ({ ...t, keys: t.keys.map((k, i) => (i === t.keys.length - 1 ? { ...k, v: t.keys[0].v } : k)) })) };
}
export const hasSeam = (a: LayerAnimation) => !a.autoreverse && loopSeamError(a).length > 0;

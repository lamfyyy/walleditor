import type { CanvasProfile } from './types';

// Размеры в pt и scale. Safe area — приблизительные значения для предпросмотра,
// на экспорт они не влияют. Сверяйте с Apple HIG для вашей модели.
const p = (id: string, name: string, w: number, h: number, scale: number, top: number, bottom: number): CanvasProfile =>
  ({ id, name, pointsW: w, pointsH: h, scale, safeTop: top, safeBottom: bottom });

export const DEVICE_PROFILES: CanvasProfile[] = [
  p('iphone-16', 'iPhone 16', 393, 852, 3, 59, 34),
  p('iphone-16-plus', 'iPhone 16 Plus', 430, 932, 3, 59, 34),
  p('iphone-16-pro', 'iPhone 16 Pro', 402, 874, 3, 62, 34),
  p('iphone-16-pro-max', 'iPhone 16 Pro Max', 440, 956, 3, 62, 34),
  p('iphone-16e', 'iPhone 16e', 390, 844, 3, 47, 34),
  p('iphone-17', 'iPhone 17', 402, 874, 3, 62, 34),
  p('iphone-air', 'iPhone Air', 420, 912, 3, 62, 34),
  p('iphone-17-pro', 'iPhone 17 Pro', 402, 874, 3, 62, 34),
  p('iphone-17-pro-max', 'iPhone 17 Pro Max', 440, 956, 3, 62, 34)
];

export const DEFAULT_PROFILE = DEVICE_PROFILES[0];

/** Размер холста в пикселях (то, что уходит в CAML). */
export const pixelSize = (c: CanvasProfile) => ({ w: Math.round(c.pointsW * c.scale), h: Math.round(c.pointsH * c.scale) });

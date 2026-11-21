import type { Project, Layer } from './types';
import { uid, emptyAnimation } from './types';
import { DEFAULT_PROFILE, pixelSize } from './devices';
import { floatPreset } from './anim';

export const DEMO_ID = 'demo-project';
// Исходные размеры ассетов (проверяются tools/verify_assets.py)
export const ASSET_INFO = {
  background: { w: 736, h: 1308 },
  asset1: { w: 1435, h: 1769 },
  // прозрачные поля asset2: bbox (31,55,601,736) — слой обрезается неразрушающе, исходный файл не меняется
  asset2: { w: 736, h: 736, bbox: [31, 55, 601, 736] as const }
};

export function makeDemoProject(profile = DEFAULT_PROFILE): Project {
  const { w: W, h: H } = pixelSize(profile);
  const bg = ASSET_INFO.background;
  const coverW = (H * bg.w) / bg.h; // ширина при масштабировании по высоте
  const cropW = W / coverW;
  const base = { visible: true, locked: false, scale: 1, rotation: 0, opacity: 1, animation: emptyAnimation() };

  const background: Layer = { ...base, id: uid(), name: 'Фон', kind: 'background', x: 0, y: 0, w: W, h: H, asset: 'bundled:background', assetW: bg.w, assetH: bg.h, crop: { x: (1 - cropW) / 2, y: 0, w: cropW, h: 1 } };

  const a1 = ASSET_INFO.asset1;
  const w1 = Math.round(W * 0.92), h1 = Math.round((w1 * a1.h) / a1.w);
  const girl: Layer = { ...base, id: uid(), name: 'Девочка (полёт)', kind: 'image', x: Math.round((W - w1) / 2), y: Math.round(H * 0.12), w: w1, h: h1, asset: 'bundled:asset1', assetW: a1.w, assetH: a1.h, animation: floatPreset(36, 6) };

  const a2 = ASSET_INFO.asset2; const [bx0, by0, bx1, by1] = a2.bbox;
  const cw = bx1 - bx0, ch = by1 - by0;
  const w2 = Math.round(W * 0.46), h2 = Math.round((w2 * ch) / cw);
  const bust: Layer = { ...base, id: uid(), name: 'Девочка (по пояс)', kind: 'image', x: 0, y: H - h2, w: w2, h: h2, asset: 'bundled:asset2', assetW: a2.w, assetH: a2.h, crop: { x: bx0 / a2.w, y: by0 / a2.h, w: cw / a2.w, h: ch / a2.h } };

  const now = Date.now();
  return {
    id: DEMO_ID, name: 'Демо', createdAt: now, updatedAt: now, isDemo: true, profile,
    layers: [background, girl, bust],
    settings: { grid: false, guides: true, snap: true, gridStep: 50 },
    export: { fps: 15, resolutionScale: 1, jpegQuality: 0.7 }
  };
}

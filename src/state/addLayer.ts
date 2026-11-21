import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import type { Layer, ShapeKind } from '../core/types';
import { uid, emptyAnimation } from '../core/types';
import { pixelSize } from '../core/devices';
import { useStore } from './store';
import { assetsDir, ensureProjectDirs } from './storage';

const base = () => ({ id: uid(), visible: true, locked: false, scale: 1, rotation: 0, opacity: 1, animation: emptyAnimation() });

export async function pickAndAdd(kind: 'image' | 'video' | 'background'): Promise<void> {
  const st = useStore.getState(); const p = st.hist?.present; if (!p) return;
  const { w: W, h: H } = pixelSize(p.profile);
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: kind === 'video' ? ['videos'] : ['images'], allowsMultipleSelection: false, quality: 1, ...(kind === 'video' ? { videoExportPreset: ImagePicker.VideoExportPreset.Passthrough } : {}) } as any);
  if (r.canceled) return;
  const a = r.assets[0];
  ensureProjectDirs(p.id);
  const ext = (a.fileName?.split('.').pop() ?? (kind === 'video' ? 'mp4' : 'png')).toLowerCase();
  const name = `${uid().slice(0, 8)}.${ext}`;
  new File(a.uri).copy(new File(assetsDir(p.id), name));
  const aw = a.width || 1000, ah = a.height || 1000;
  let l: Layer;
  if (kind === 'background') {
    const cover = Math.max(W / aw, H / ah); const cw = W / (aw * cover), ch = H / (ah * cover);
    l = { ...base(), name: 'Фон', kind: 'background', x: 0, y: 0, w: W, h: H, asset: 'assets/' + name, assetW: aw, assetH: ah, crop: { x: (1 - cw) / 2, y: (1 - ch) / 2, w: cw, h: ch } };
  } else if (kind === 'video') {
    const dur = (a.duration ?? 0) / 1000;
    l = { ...base(), name: 'Видео', kind: 'video', x: 0, y: 0, w: W, h: Math.round((W * ah) / aw), asset: 'assets/' + name, assetW: aw, assetH: ah, videoDuration: dur, videoTrim: { start: 0, end: Math.min(12, dur) } };
  } else {
    const w = Math.round(Math.min(W * 0.8, aw)); const h = Math.round((w * ah) / aw);
    l = { ...base(), name: 'Изображение', kind: 'image', x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w, h, asset: 'assets/' + name, assetW: aw, assetH: ah };
  }
  st.addLayer(l);
}

export function addText() {
  const st = useStore.getState(); const p = st.hist?.present; if (!p) return;
  const { w: W, h: H } = pixelSize(p.profile);
  st.addLayer({ ...base(), name: 'Текст', kind: 'text', x: W * 0.1, y: H * 0.4, w: W * 0.8, h: 200, text: 'walleditor', fontSize: 120, color: '#FFFFFF' });
}
export function addShape(shape: ShapeKind) {
  const st = useStore.getState(); const p = st.hist?.present; if (!p) return;
  const { w: W, h: H } = pixelSize(p.profile);
  st.addLayer({ ...base(), name: shape === 'ellipse' ? 'Круг' : shape === 'rect' ? 'Прямоугольник' : 'Скруглённый', kind: 'shape', shape, x: W * 0.25, y: H * 0.4, w: W * 0.5, h: W * 0.5, fill: '#FFFFFF', cornerRadius: 80 });
}

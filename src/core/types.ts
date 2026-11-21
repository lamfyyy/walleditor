// Модель данных walleditor. Всё сериализуется в JSON (AsyncStorage) без потерь.

export type LayerKind = 'background' | 'image' | 'video' | 'text' | 'shape';
export type ShapeKind = 'rect' | 'roundRect' | 'ellipse';
export type AnimProp = 'x' | 'y' | 'rotation' | 'scale' | 'opacity';

export interface Keyframe {
  t: number; // 0..1 доля длительности цикла
  v: number; // значение (x/y — смещение в px холста; rotation — градусы; scale — множитель; opacity 0..1)
}

export interface AnimTrack {
  prop: AnimProp;
  keys: Keyframe[]; // отсортированы по t, минимум 2
}

export interface LayerAnimation {
  enabled: boolean;
  duration: number; // секунды цикла (0.5..12)
  loop: boolean; // repeatCount = inf
  autoreverse: boolean;
  tracks: AnimTrack[];
}

export interface Crop { x: number; y: number; w: number; h: number } // в долях исходного изображения 0..1

export interface Layer {
  id: string;
  name: string;
  kind: LayerKind;
  visible: boolean;
  locked: boolean;
  // геометрия в px холста (левый верхний угол слоя), до масштаба/поворота
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  rotation: number; // градусы
  opacity: number; // 0..1
  crop?: Crop;
  // источник
  asset?: string; // относительный путь внутри папки проекта (assets/xxx.png) или bundled:<ключ>
  assetW?: number;
  assetH?: number;
  videoTrim?: { start: number; end: number }; // секунды
  videoDuration?: number;
  // текст
  text?: string;
  fontSize?: number;
  color?: string; // #RRGGBB
  // фигура
  shape?: ShapeKind;
  fill?: string;
  cornerRadius?: number;
  animation: LayerAnimation;
}

export interface CanvasProfile {
  id: string;
  name: string;
  pointsW: number;
  pointsH: number;
  scale: number; // 2 | 3
  safeTop: number; // pt
  safeBottom: number; // pt
  custom?: boolean;
}

export interface ExportSettings {
  fps: number; // для видео-кадров
  resolutionScale: number; // 0.25..1
  jpegQuality: number; // 0.3..0.9
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  isDemo?: boolean;
  profile: CanvasProfile;
  layers: Layer[]; // порядок снизу вверх
  settings: { grid: boolean; guides: boolean; snap: boolean; gridStep: number };
  export: ExportSettings;
  source?: { importedFrom?: string; warnings?: string[] };
}

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
  isDemo?: boolean;
  hasVideo: boolean;
  hasAnimation: boolean;
  layerCount: number;
}

export type IssueLevel = 'error' | 'warning' | 'info';
export interface Issue {
  level: IssueLevel;
  code: string;
  message: string;
  layerId?: string; // открыть проблемный слой
  setting?: 'export' | 'canvas' | 'animation';
}

export const emptyAnimation = (): LayerAnimation => ({
  enabled: false, duration: 4, loop: true, autoreverse: false, tracks: []
});

export const uid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

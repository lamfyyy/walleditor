export type ThemeName = "white" | "oled" | "kawarp";
export type LayerKind = "background" | "image";
export type AssetKey = "background" | "asset1" | "asset2";

export type LayerAnimation = {
  enabled: boolean;
  amplitude: number;
  speed: number;
  phase: number;
};

export type Layer = {
  id: string;
  name: string;
  kind: LayerKind;
  asset: AssetKey;
  visible: boolean;
  locked: boolean;
  opacity: number;
  scale: number;
  x: number;
  y: number;
  rotation: number;
  animation: LayerAnimation;
};

export type KawarpSettings = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  intensity: number;
  speed: number;
  zoom: number;
  pan: number;
  animateColors: boolean;
  animateTexture: boolean;
};

export type Project = {
  schemaVersion: 2;
  id: string;
  name: string;
  theme: ThemeName;
  canvas: { width: number; height: number; device: string };
  duration: number;
  looping: boolean;
  createdAt: string;
  modifiedAt: string;
  layers: Layer[];
  kawarp: KawarpSettings;
  exportedAt?: string;
};

export const DEMO_PROJECT_ID = "demo-kawarp";
export const DEFAULT_CANVAS = { width: 736, height: 1308, device: "iPhone 16" };
export const DEFAULT_KAWARP: KawarpSettings = {
  primaryColor: "#FF4FA3",
  secondaryColor: "#5C4BFF",
  accentColor: "#FF4FA3",
  intensity: 0.22,
  speed: 0.7,
  zoom: 0.08,
  pan: 18,
  animateColors: true,
  animateTexture: true,
};

const now = () => new Date().toISOString();
export const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function createLayer(asset: AssetKey, name?: string): Layer {
  const isBackground = asset === "background";
  return {
    id: makeId("layer"),
    name: name ?? (asset === "asset1" ? "Floating girl" : asset === "asset2" ? "Corner portrait" : "Topographic background"),
    kind: isBackground ? "background" : "image",
    asset,
    visible: true,
    locked: isBackground,
    opacity: 1,
    scale: isBackground ? 1 : asset === "asset1" ? 0.31 : 0.52,
    x: isBackground ? 0 : asset === "asset1" ? 0.17 : -0.02,
    y: isBackground ? 0 : asset === "asset1" ? 0.2 : 0.68,
    rotation: 0,
    animation: {
      enabled: asset === "asset1",
      amplitude: asset === "asset1" ? 7 : 3,
      speed: asset === "asset1" ? 0.8 : 0.45,
      phase: 0,
    },
  };
}

export function createBlankProject(name = "Новый draft", theme: ThemeName = "kawarp"): Project {
  const timestamp = now();
  return {
    schemaVersion: 2,
    id: makeId("project"),
    name,
    theme,
    canvas: { ...DEFAULT_CANVAS },
    duration: 6,
    looping: true,
    createdAt: timestamp,
    modifiedAt: timestamp,
    layers: [createLayer("background")],
    kawarp: { ...DEFAULT_KAWARP },
  };
}

export function createDemoProject(): Project {
  const project = createBlankProject("Kawarp dream / demo", "kawarp");
  return {
    ...project,
    id: DEMO_PROJECT_ID,
    layers: [
      { ...createLayer("background"), id: "layer-background" },
      { ...createLayer("asset1"), id: "layer-asset1", name: "Floating girl" },
      { ...createLayer("asset2"), id: "layer-asset2", name: "Corner portrait" },
    ],
  };
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}
function asString(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value : fallback; }
function asNumber(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function asBoolean(value: unknown, fallback: boolean) { return typeof value === "boolean" ? value : fallback; }
function asTheme(value: unknown): ThemeName { return value === "white" || value === "oled" || value === "kawarp" ? value : "kawarp"; }
function asAsset(value: unknown): AssetKey { return value === "background" || value === "asset1" || value === "asset2" ? value : "asset1"; }

export function normalizeProject(value: unknown, fallbackName = "Imported project"): Project {
  const source = asObject(value);
  const canvasSource = asObject(source.canvas);
  const kawarpSource = asObject(source.kawarp);
  const timestamp = now();
  const rawLayers = Array.isArray(source.layers) ? source.layers : [];
  const layers = rawLayers.map((value, index) => {
    const raw = asObject(value);
    const asset = asAsset(raw.asset);
    const defaults = createLayer(asset);
    const animationSource = asObject(raw.animation);
    return {
      ...defaults,
      id: asString(raw.id, makeId(`layer${index}`)),
      name: asString(raw.name, defaults.name),
      kind: asset === "background" ? "background" : "image",
      asset,
      visible: asBoolean(raw.visible, defaults.visible),
      locked: asBoolean(raw.locked, defaults.locked),
      opacity: clamp(asNumber(raw.opacity, defaults.opacity), 0, 1),
      scale: clamp(asNumber(raw.scale, defaults.scale), 0.05, 3),
      x: clamp(asNumber(raw.x, defaults.x), -1, 1),
      y: clamp(asNumber(raw.y, defaults.y), -1, 1),
      rotation: clamp(asNumber(raw.rotation, defaults.rotation), -180, 180),
      animation: {
        enabled: asBoolean(animationSource.enabled, asBoolean(raw.animated, defaults.animation.enabled)),
        amplitude: clamp(asNumber(animationSource.amplitude, defaults.animation.amplitude), 0, 40),
        speed: clamp(asNumber(animationSource.speed, defaults.animation.speed), 0.1, 3),
        phase: asNumber(animationSource.phase, defaults.animation.phase),
      },
    } satisfies Layer;
  });
  if (!layers.some((layer) => layer.asset === "background")) layers.unshift(createLayer("background"));
  return {
    schemaVersion: 2,
    id: asString(source.id, makeId("project")),
    name: asString(source.name, fallbackName),
    theme: asTheme(source.theme),
    canvas: {
      width: asNumber(canvasSource.width, DEFAULT_CANVAS.width),
      height: asNumber(canvasSource.height, DEFAULT_CANVAS.height),
      device: asString(canvasSource.device, DEFAULT_CANVAS.device),
    },
    duration: clamp(asNumber(source.duration, 6), 1, 30),
    looping: asBoolean(source.looping, true),
    createdAt: asString(source.createdAt, timestamp),
    modifiedAt: asString(source.modifiedAt, timestamp),
    layers,
    kawarp: {
      primaryColor: asString(kawarpSource.primaryColor, DEFAULT_KAWARP.primaryColor),
      secondaryColor: asString(kawarpSource.secondaryColor, DEFAULT_KAWARP.secondaryColor),
      accentColor: asString(kawarpSource.accentColor, DEFAULT_KAWARP.accentColor),
      intensity: clamp(asNumber(kawarpSource.intensity, DEFAULT_KAWARP.intensity), 0, 0.8),
      speed: clamp(asNumber(kawarpSource.speed, DEFAULT_KAWARP.speed), 0.1, 3),
      zoom: clamp(asNumber(kawarpSource.zoom, DEFAULT_KAWARP.zoom), 0, 0.35),
      pan: clamp(asNumber(kawarpSource.pan, DEFAULT_KAWARP.pan), 0, 80),
      animateColors: asBoolean(kawarpSource.animateColors, DEFAULT_KAWARP.animateColors),
      animateTexture: asBoolean(kawarpSource.animateTexture, DEFAULT_KAWARP.animateTexture),
    },
    exportedAt: typeof source.exportedAt === "string" ? source.exportedAt : undefined,
  };
}

export function duplicateProject(project: Project): Project {
  const timestamp = now();
  return {
    ...project,
    id: makeId("project"),
    name: `${project.name} copy`,
    createdAt: timestamp,
    modifiedAt: timestamp,
    exportedAt: undefined,
    layers: project.layers.map((layer) => ({ ...layer, id: makeId("layer"), animation: { ...layer.animation } })),
    kawarp: { ...project.kawarp },
  };
}

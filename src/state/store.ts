import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Project, Layer, ProjectMeta, LayerAnimation, ExportSettings } from '../core/types';
import { uid, emptyAnimation } from '../core/types';
import { initHistory, commit, undo as hUndo, redo as hRedo, History } from '../core/history';
import { makeDemoProject, DEMO_ID } from '../core/demo';
import { DEFAULT_PROFILE, pixelSize } from '../core/devices';
import type { CanvasProfile } from '../core/types';
import { listProjects, loadProject, saveProject, deleteProject, duplicateProject, K_SETTINGS, ensureProjectDirs } from './storage';
import { THEMES, ThemeId, DEFAULT_KAWARP, KawarpSettings } from '../theme/themes';
import { detectLang, Lang } from '../i18n';

interface Settings { theme: ThemeId; lang: 'auto' | Lang; kawarp: KawarpSettings; lastProfile: CanvasProfile; customProfiles: CanvasProfile[] }
const DEFAULT_SETTINGS: Settings = { theme: 'white', lang: 'auto', kawarp: DEFAULT_KAWARP, lastProfile: DEFAULT_PROFILE, customProfiles: [] };

interface State {
  ready: boolean; library: ProjectMeta[]; settings: Settings;
  hist: History | null; selection: string | null; dirty: boolean; savedAt: number | null;
  clipAnim: LayerAnimation | null;
  init(): Promise<void>;
  refresh(): Promise<void>;
  setSettings(p: Partial<Settings>): void;
  lang(): Lang;
  open(id: string): Promise<boolean>;
  openProjectObject(p: Project): Promise<void>;
  close(): Promise<void>;
  create(name: string, profile?: CanvasProfile): Promise<Project>;
  duplicate(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  resetDemo(): Promise<void>;
  save(): Promise<void>;
  mutate(label: string, fn: (p: Project) => Project): void;
  patchLayer(id: string, label: string, patch: Partial<Layer>): void;
  addLayer(l: Layer): void;
  removeLayer(id: string): void;
  duplicateLayer(id: string): void;
  moveLayer(id: string, dir: 1 | -1): void;
  select(id: string | null): void;
  undo(): void; redo(): void;
  copyAnim(id: string): void; pasteAnim(id: string): void;
  setExport(e: Partial<ExportSettings>): void;
  setProfile(pr: CanvasProfile): void;
  preview(id: string, patch: Partial<Layer>): void;
  endPreview(label: string): void;
}

let tBase: Project | null = null;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<State>((set, get) => ({
  ready: false, library: [], settings: DEFAULT_SETTINGS, hist: null, selection: null, dirty: false, savedAt: null, clipAnim: null,

  async init() {
    const raw = await AsyncStorage.getItem(K_SETTINGS);
    const settings = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    if (!THEMES[settings.theme as ThemeId]) settings.theme = 'white';
    let lib = await listProjects();
    if (!lib.find((m) => m.id === DEMO_ID) && !(await AsyncStorage.getItem('we:demo-seeded'))) {
      ensureProjectDirs(DEMO_ID);
      await saveProject(makeDemoProject(settings.lastProfile));
      await AsyncStorage.setItem('we:demo-seeded', '1');
      lib = await listProjects();
    }
    set({ settings, library: lib, ready: true });
  },
  async refresh() { set({ library: await listProjects() }); },
  setSettings(p) {
    const settings = { ...get().settings, ...p };
    set({ settings });
    AsyncStorage.setItem(K_SETTINGS, JSON.stringify(settings));
  },
  lang() { const l = get().settings.lang; return l === 'auto' ? detectLang() : l; },

  async open(id) {
    const p = await loadProject(id); if (!p) return false;
    set({ hist: initHistory(p), selection: p.layers[p.layers.length - 1]?.id ?? null, dirty: false, savedAt: p.updatedAt });
    return true;
  },
  async openProjectObject(p) { ensureProjectDirs(p.id); await saveProject(p); await get().refresh(); set({ hist: initHistory(p), selection: null, dirty: false, savedAt: Date.now() }); },
  async close() { if (get().dirty) await get().save(); set({ hist: null, selection: null }); await get().refresh(); },
  async create(name, profile) {
    const pr = profile ?? get().settings.lastProfile;
    const p: Project = { id: uid(), name, createdAt: Date.now(), updatedAt: Date.now(), profile: pr, layers: [], settings: { grid: false, guides: true, snap: true, gridStep: 50 }, export: { fps: 15, resolutionScale: 1, jpegQuality: 0.7 } };
    ensureProjectDirs(p.id); await saveProject(p); await get().refresh(); return p;
  },
  async duplicate(id) { await duplicateProject(id); await get().refresh(); },
  async remove(id) { await deleteProject(id); await get().refresh(); },
  async resetDemo() { const d = makeDemoProject(get().settings.lastProfile); d.id = uid(); d.isDemo = true; d.name = 'Демо'; ensureProjectDirs(d.id); await saveProject(d); await get().refresh(); },

  async save() {
    const h = get().hist; if (!h) return;
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    await saveProject(h.present);
    set({ dirty: false, savedAt: Date.now() });
  },
  mutate(label, fn) {
    const h = get().hist; if (!h) return;
    set({ hist: commit(h, fn(h.present), label), dirty: true });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { get().save(); }, 700); // автосохранение
  },
  patchLayer(id, label, patch) { get().mutate(label, (p) => ({ ...p, layers: p.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })); },
  addLayer(l) { get().mutate('Добавить слой', (p) => ({ ...p, layers: [...p.layers, l] })); set({ selection: l.id }); },
  removeLayer(id) { get().mutate('Удалить слой', (p) => ({ ...p, layers: p.layers.filter((l) => l.id !== id) })); if (get().selection === id) set({ selection: null }); },
  duplicateLayer(id) {
    const src = get().hist?.present.layers.find((l) => l.id === id); if (!src) return;
    const copy = { ...src, id: uid(), name: src.name + ' 2', x: src.x + 30, y: src.y + 30 };
    get().addLayer(copy);
  },
  moveLayer(id, dir) {
    get().mutate('Порядок слоёв', (p) => {
      const i = p.layers.findIndex((l) => l.id === id); const j = i + dir;
      if (i < 0 || j < 0 || j >= p.layers.length) return p;
      const ls = [...p.layers]; [ls[i], ls[j]] = [ls[j], ls[i]]; return { ...p, layers: ls };
    });
  },
  select(id) { set({ selection: id }); },
  preview(id, patch) {
    const h = get().hist; if (!h) return;
    if (!tBase) tBase = h.present;
    set({ hist: { ...h, present: { ...h.present, layers: h.present.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) } } });
  },
  endPreview(label) {
    const h = get().hist; if (!h || !tBase) return;
    const base = tBase; tBase = null;
    set({ hist: commit({ ...h, present: base }, h.present, label), dirty: true });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { get().save(); }, 700);
  },
  undo() { const h = get().hist; if (h) { set({ hist: hUndo(h), dirty: true }); setTimeout(() => get().save(), 700); } },
  redo() { const h = get().hist; if (h) { set({ hist: hRedo(h), dirty: true }); setTimeout(() => get().save(), 700); } },
  copyAnim(id) { const l = get().hist?.present.layers.find((x) => x.id === id); if (l) set({ clipAnim: JSON.parse(JSON.stringify(l.animation)) }); },
  pasteAnim(id) { const a = get().clipAnim; if (a) get().patchLayer(id, 'Вставить анимацию', { animation: JSON.parse(JSON.stringify(a)) }); },
  setExport(e) { get().mutate('Настройки экспорта', (p) => ({ ...p, export: { ...p.export, ...e } })); },
  setProfile(pr) {
    get().mutate('Модель iPhone', (p) => {
      const o = pixelSize(p.profile), n = pixelSize(pr);
      const k = n.w / o.w, ky = n.h / o.h;
      return { ...p, profile: pr, layers: p.layers.map((l) => ({ ...l, x: l.x * k, y: l.y * ky, w: l.w * k, h: l.h * k })) };
    });
    get().setSettings({ lastProfile: pr });
  }
}));

export const newLayerBase = () => ({ id: uid(), visible: true, locked: false, scale: 1, rotation: 0, opacity: 1, animation: emptyAnimation() });

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import type { Project, ProjectMeta } from '../core/types';
import { uid } from '../core/types';

const K_INDEX = 'we:index';
const K_PROJ = (id: string) => `we:project:${id}`;
export const K_SETTINGS = 'we:settings';

export const projectsRoot = () => new Directory(Paths.document, 'projects');
export const projectDir = (id: string) => new Directory(projectsRoot(), id);
export const assetsDir = (id: string) => new Directory(projectDir(id), 'assets');

export function ensureProjectDirs(id: string) {
  const r = projectsRoot(); if (!r.exists) r.create();
  const d = projectDir(id); if (!d.exists) d.create();
  const a = assetsDir(id); if (!a.exists) a.create();
}

export const metaOf = (p: Project): ProjectMeta => ({
  id: p.id, name: p.name, updatedAt: p.updatedAt, createdAt: p.createdAt, isDemo: p.isDemo,
  hasVideo: p.layers.some((l) => l.kind === 'video'),
  hasAnimation: p.layers.some((l) => l.animation.enabled),
  layerCount: p.layers.length
});

export async function listProjects(): Promise<ProjectMeta[]> {
  const raw = await AsyncStorage.getItem(K_INDEX);
  return raw ? (JSON.parse(raw) as ProjectMeta[]) : [];
}
async function writeIndex(list: ProjectMeta[]) { await AsyncStorage.setItem(K_INDEX, JSON.stringify(list)); }

export async function loadProject(id: string): Promise<Project | null> {
  const raw = await AsyncStorage.getItem(K_PROJ(id));
  return raw ? (JSON.parse(raw) as Project) : null;
}

export async function saveProject(p: Project): Promise<void> {
  await AsyncStorage.setItem(K_PROJ(p.id), JSON.stringify(p));
  const list = (await listProjects()).filter((m) => m.id !== p.id);
  list.unshift(metaOf(p));
  list.sort((a, b) => b.updatedAt - a.updatedAt);
  await writeIndex(list);
}

export async function deleteProject(id: string): Promise<void> {
  await AsyncStorage.removeItem(K_PROJ(id));
  await writeIndex((await listProjects()).filter((m) => m.id !== id));
  const d = projectDir(id); if (d.exists) d.delete();
}

/** Дубликат: новая запись + копия файлов проекта. Исходные ассеты не затрагиваются. */
export async function duplicateProject(id: string): Promise<Project | null> {
  const src = await loadProject(id); if (!src) return null;
  const nid = uid();
  ensureProjectDirs(nid);
  const from = assetsDir(id);
  if (from.exists) for (const it of from.list()) if (it instanceof File) it.copy(new File(assetsDir(nid), it.name));
  const copy: Project = { ...src, id: nid, name: src.name + ' (копия)', isDemo: false, createdAt: Date.now(), updatedAt: Date.now(), layers: src.layers.map((l) => ({ ...l, id: uid() })) };
  await saveProject(copy);
  return copy;
}

export const fileUriFor = (projectId: string, rel: string) => new File(projectDir(projectId), rel).uri;

// Эталонные plist из импортированного .tendies (используются при экспорте как база)
export async function saveTemplate(projectId: string, tpl: object) { await AsyncStorage.setItem(`we:tpl:${projectId}`, JSON.stringify(tpl)); }
export async function loadTemplate(projectId: string): Promise<any> { const r = await AsyncStorage.getItem(`we:tpl:${projectId}`); return r ? JSON.parse(r) : {}; }

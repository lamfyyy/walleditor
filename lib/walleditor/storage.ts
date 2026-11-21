import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBlankProject, createDemoProject, normalizeProject, type Project, type ThemeName } from "./model";

const STORAGE_KEY = "walleditor.projects.v2";
let writeQueue: Promise<void> = Promise.resolve();

function queueWrite(projects: Project[]) {
  const normalized = projects.map((project) => normalizeProject(project));
  writeQueue = writeQueue.then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)));
  return writeQueue;
}

export async function loadProjects(): Promise<Project[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const demo = createDemoProject();
    await queueWrite([demo]);
    return [demo];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    const values = Array.isArray(parsed) ? parsed : [];
    const projects = values.map((value, index) => normalizeProject(value, `Project ${index + 1}`));
    if (projects.length > 0) {
      const sorted = projects.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
      await queueWrite(sorted);
      return sorted;
    }
  } catch {
    // Repair the store below with a fresh demo.
  }
  const demo = createDemoProject();
  await queueWrite([demo]);
  return [demo];
}

export function saveProjects(projects: Project[]) {
  return queueWrite(projects);
}

export function createProjectInList(projects: Project[], name: string, theme: ThemeName): { project: Project; projects: Project[] } {
  const project = createBlankProject(name.trim() || "Новый draft", theme);
  return { project, projects: [project, ...projects] };
}

export function duplicateProjectInList(projects: Project[], project: Project): { project: Project; projects: Project[] } {
  const copy = normalizeProject({ ...project, id: undefined }, `${project.name} copy`);
  copy.id = `${project.id}-copy-${Date.now()}`;
  copy.name = `${project.name} copy`;
  copy.createdAt = new Date().toISOString();
  copy.modifiedAt = copy.createdAt;
  copy.exportedAt = undefined;
  copy.layers = copy.layers.map((layer) => ({ ...layer, id: `${layer.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` }));
  return { project: copy, projects: [copy, ...projects] };
}

export function deleteProjectFromList(projects: Project[], projectId: string): Project[] {
  const next = projects.filter((project) => project.id !== projectId);
  return next.length > 0 ? next : [createBlankProject("Новый draft")];
}

export function upsertProject(projects: Project[], project: Project): Project[] {
  const next = projects.some((item) => item.id === project.id)
    ? projects.map((item) => item.id === project.id ? project : item)
    : [project, ...projects];
  return next.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

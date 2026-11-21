import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { packProject, unpackProject } from '../core/backup';
import { loadProject, saveProject, assetsDir, ensureProjectDirs } from './storage';
import { useStore } from './store';

/** Резервная копия редактируемого проекта (.walleditor) через Share Sheet. Отдельно от экспорта .tendies. */
export async function shareBackup(projectId: string): Promise<void> {
  const p = await loadProject(projectId); if (!p) throw new Error('Проект не найден');
  const files: Record<string, Uint8Array> = {};
  const dir = assetsDir(projectId);
  if (dir.exists) for (const it of dir.list()) if (it instanceof File) files['assets/' + it.name] = await it.bytes();
  const zip = await packProject(p, files);
  const name = p.name.replace(/[^\p{L}\p{N}_-]+/gu, '_') || 'project';
  const f = new File(Paths.cache, name + '.walleditor');
  if (f.exists) f.delete();
  f.create(); f.write(zip);
  await Sharing.shareAsync(f.uri, { UTI: 'public.data', mimeType: 'application/octet-stream', dialogTitle: name + '.walleditor' });
}

/** Восстановление всегда создаёт НОВЫЙ проект: существующие работы не перезаписываются. */
export async function restoreBackup(uri: string): Promise<{ id: string; warnings: string[] }> {
  const bytes = await new File(uri).bytes();
  const r = await unpackProject(bytes);
  ensureProjectDirs(r.project.id);
  for (const [rel, data] of Object.entries(r.files)) { const f = new File(assetsDir(r.project.id), rel.replace(/^assets\//, '')); f.create(); f.write(data); }
  await saveProject(r.project);
  await useStore.getState().refresh();
  return { id: r.project.id, warnings: r.warnings };
}

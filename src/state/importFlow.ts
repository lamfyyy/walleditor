import { File } from 'expo-file-system';
import { importTendies } from '../core/tendies';
import { imageSize } from '../core/image';
import { makeDemoProject } from '../core/demo';
import { useStore } from './store';
import { assetsDir, ensureProjectDirs, saveTemplate } from './storage';

/** Открывает .tendies как НОВЫЙ проект. Исходный файл не изменяется; результат — отдельный проект и отдельный экспорт. */
export async function importTendiesFromUri(uri: string, name: string): Promise<{ id: string; warnings: string[] }> {
  const bytes = await new File(uri).bytes();
  const base = makeDemoProject(useStore.getState().settings.lastProfile);
  const r = await importTendies(bytes, base, name);
  ensureProjectDirs(r.project.id);
  for (const [rel, data] of Object.entries(r.assetFiles)) {
    const f = new File(assetsDir(r.project.id), rel.replace(/^assets\//, ''));
    f.create(); f.write(data);
    const sz = imageSize(data);
    r.project.layers.forEach((l) => { if (l.asset === rel && sz) { l.assetW = sz.w; l.assetH = sz.h; } });
  }
  await saveTemplate(r.project.id, r.template);
  await useStore.getState().openProjectObject(r.project);
  return { id: r.project.id, warnings: r.warnings };
}

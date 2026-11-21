import JSZip from 'jszip';
import type { Project } from './types';
import { uid } from './types';

// Резервная копия РЕДАКТИРУЕМОГО проекта (.walleditor). Не путать с экспортом .tendies — это разные файлы.
export const BACKUP_MAGIC = 'walleditor-project';
export const BACKUP_VERSION = 1;

export async function packProject(p: Project, files: Record<string, Uint8Array>): Promise<Uint8Array> {
  const z = new JSZip();
  z.file('manifest.json', JSON.stringify({ magic: BACKUP_MAGIC, version: BACKUP_VERSION, name: p.name, createdAt: Date.now() }));
  z.file('project.json', JSON.stringify(p));
  for (const [rel, data] of Object.entries(files)) {
    if (!/^assets\/[^/\\]+$/.test(rel)) continue; // только плоские файлы внутри assets/
    z.file(rel, data, { binary: true });
  }
  return z.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export interface Unpacked { project: Project; files: Record<string, Uint8Array>; warnings: string[] }

export async function unpackProject(data: Uint8Array): Promise<Unpacked> {
  const z = await JSZip.loadAsync(data);
  const man = z.file('manifest.json'), pj = z.file('project.json');
  if (!man || !pj) throw new Error('Это не резервная копия walleditor (нет manifest.json / project.json).');
  const m = JSON.parse(await man.async('string'));
  if (m.magic !== BACKUP_MAGIC) throw new Error('Неизвестный формат файла.');
  if (m.version > BACKUP_VERSION) throw new Error('Копия создана более новой версией walleditor.');
  const raw = JSON.parse(await pj.async('string')) as Project;
  const warnings: string[] = [];
  const files: Record<string, Uint8Array> = {};
  for (const [name, e] of Object.entries(z.files)) {
    if (e.dir || !name.startsWith('assets/')) continue;
    if (!/^assets\/[^/\\]+$/.test(name) || name.includes('..')) { warnings.push(`Пропущен небезопасный путь: ${name}`); continue; }
    files[name] = await e.async('uint8array');
  }
  for (const l of raw.layers) if (l.asset && !l.asset.startsWith('bundled:') && !files[l.asset]) warnings.push(`Нет файла для слоя «${l.name}»: ${l.asset}`);
  // новый идентификатор: восстановление не перезаписывает существующий проект
  const project: Project = { ...raw, id: uid(), name: raw.name + ' (восстановлен)', isDemo: false, updatedAt: Date.now(), layers: raw.layers.map((l) => ({ ...l })) };
  return { project, files, warnings };
}

import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { makeDemoProject } from '../src/core/demo';
import { buildTendies } from '../src/core/tendies';

// Экспорт демо в Node: байты слоёв берутся из исходных PNG без обрезки (обрезка в приложении — через ImageManipulator).
const src = {
  async getImage(l: any) {
    const f = l.asset.replace('bundled:', '');
    return new Uint8Array(readFileSync(`assets/walleditor/${f}.png`));
  }
};
(async () => {
  const r = await buildTendies(makeDemoProject(), src as any);
  mkdirSync('out', { recursive: true });
  writeFileSync('out/demo.tendies', r.zip);
  console.log('ok', r.bytes, 'bytes; issues:', r.issues.map((i) => `${i.level}:${i.code}`).join(', '));
})();

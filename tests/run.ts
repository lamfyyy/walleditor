import { readFileSync } from 'fs';
import JSZip from 'jszip';
import { makeDemoProject } from '../src/core/demo';
import { buildTendies, validateTendies, importTendies, estimateSize } from '../src/core/tendies';
import { parseXml } from '../src/core/xml';
import { readPlist, writePlist } from '../src/core/plist';
import { initHistory, commit, undo, redo } from '../src/core/history';
import { snapMove } from '../src/core/snap';
import { loopSeamError, evalLayer } from '../src/core/anim';
import { pixelSize } from '../src/core/devices';
import { checkPreviewConsistency } from '../src/core/consistency';
import { floatPreset, PRESETS } from '../src/core/anim';
import { alignLayer, fitLayer, makeSeamless, hasSeam } from '../src/core/arrange';
import { packProject, unpackProject } from '../src/core/backup';

let fail = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const src = { async getImage(l: any) { return new Uint8Array(readFileSync(`assets/walleditor/${l.asset.replace('bundled:', '')}.png`)); } };

(async () => {
  const p = makeDemoProject();
  const { w, h } = pixelSize(p.profile);
  ok(w === 1179 && h === 2556, 'iPhone 16 = 1179x2556');
  ok(p.layers.length === 3 && p.layers.every((l) => l.name), 'демо: 3 отдельных именованных слоя');
  const bust = p.layers[2];
  ok(bust.x === 0 && Math.abs(bust.y + bust.h - h) < 1, 'asset2: прижат к левому и нижнему краю');
  ok(loopSeamError(p.layers[1].animation).length === 0, 'float-анимация бесшовна на стыке цикла');
  const e0 = evalLayer(p.layers[1], 0), e1 = evalLayer(p.layers[1], 6);
  ok(Math.abs(e0.dy - e1.dy) < 1e-6, 'предпросмотр: начало = конец цикла');

  const r = await buildTendies(p, src as any);
  const errs = r.issues.filter((i) => i.level === 'error');
  ok(errs.length === 0, 'валидатор: нет ошибок на собственном экспорте ' + JSON.stringify(errs));
  const z = await JSZip.loadAsync(r.zip);
  const names = Object.keys(z.files);
  ok(names.every((n) => !/__MACOSX|\.DS_Store|\/\._/.test(n)), 'нет мусора macOS');
  ok(names.some((n) => n.startsWith('descriptors/')), 'есть descriptors/');
  const caml = await z.file(names.find((n) => n.endsWith('main.caml'))!)!.async('string');
  const root = parseXml(caml);
  ok(root.tag === 'caml', 'main.caml парсится');
  ok(/keyPath="position.y"/.test(caml), 'CAML содержит анимацию position.y');
  const wp = readPlist(await z.file(names.find((n) => n.endsWith('/Wallpaper.plist'))!)!.async('string'));
  const ui = readPlist(await z.file(names.find((n) => n.endsWith('contents.userInfo'))!)!.async('string'));
  const idf = (await z.file(names.find((n) => n.endsWith('descriptor.identifier'))!)!.async('string')).trim();
  ok(String(wp.identifier) === idf && String(ui.wallpaperRepresentingIdentifier) === idf, 'ID согласованы в 3 местах');
  ok(readPlist(writePlist({ a: 1, b: 'x', c: true })).b === 'x', 'plist round-trip');

  // негативные проверки валидатора
  const bad = { ...r.files, '__MACOSX/x': 'x' } as any;
  ok(validateTendies(bad).some((i) => i.code === 'JUNK_ENTRY'), 'валидатор ловит __MACOSX');
  const bad2: any = { ...r.files }; delete bad2[Object.keys(bad2).find((k) => k.endsWith('descriptor.identifier'))!];
  ok(validateTendies(bad2).some((i) => i.code === 'NO_DESC_ID'), 'валидатор ловит отсутствие descriptor.identifier');
  const bad3: any = { ...r.files }; delete bad3[Object.keys(bad3).find((k) => k.endsWith('.png'))!];
  ok(validateTendies(bad3).some((i) => i.code === 'MISSING_RESOURCE'), 'валидатор ловит пропавший ресурс');
  ok(validateTendies({ 'container/x': 'y' } as any).some((i) => i.code === 'CONTAINER_FORMAT'), 'Container отклоняется');

  // импорт
  const imp = await importTendies(r.zip, makeDemoProject(), 'demo.tendies');
  ok(imp.project.layers.length >= 3, 'импорт восстановил слои: ' + imp.project.layers.length);
  ok(imp.template.wallpaperPlist?.identifier !== undefined, 'шаблон plist захвачен');
  ok(imp.warnings.some((x) => /Анимации/.test(x)), 'предупреждение о невосстановленных анимациях');

  // сверка предпросмотра с экспортом на всех пресетах и со статическими свойствами
  for (const pr of PRESETS) {
    const q = makeDemoProject();
    q.layers[1] = { ...q.layers[1], opacity: 0.6, scale: 1.3, rotation: 12, animation: pr.make(40) };
    const rr = await buildTendies(q, src as any);
    const camlText = rr.files[Object.keys(rr.files).find((k) => k.endsWith('main.caml'))!] as string;
    const mm = checkPreviewConsistency(q, camlText);
    ok(mm.length === 0, `предпросмотр = экспорт, пресет «${pr.label}» ` + JSON.stringify(mm.map((m) => m.message)));
  }
  // выравнивание / вписывание
  const L = { ...p.layers[1], x: 100, y: 100, w: 400, h: 300, scale: 0.5 };
  const aL = alignLayer(L, w, h, 'left'); ok(Math.abs(aL.x + (L.w - L.w * L.scale) / 2) < 1e-9, 'align left: видимый край на 0');
  const aB = alignLayer(L, w, h, 'bottom'); ok(Math.abs((aB.y + (L.h - L.h * L.scale) / 2) + L.h * L.scale - h) < 1e-9, 'align bottom: видимый низ = высота холста');
  const aC = alignLayer(L, w, h, 'hcenter'); ok(Math.abs(aC.x + L.w / 2 - w / 2) < 1e-9, 'align hcenter: центр по X');
  const aS = alignLayer(L, w, h, 'safeBottom', p.profile); ok(Math.abs((aS.y + L.h / 2 + L.h * L.scale / 2) - (h - 34 * 3)) < 1e-9, 'align safeBottom');
  const fc = fitLayer(p.layers[0], w, h, 'cover'); ok(fc.w >= w - 1e-6 && fc.h >= h - 1e-6, 'fit cover заполняет холст');
  const fo = fitLayer(p.layers[1], w, h, 'contain'); ok(fo.w <= w + 1e-6 && fo.h <= h + 1e-6 && Math.abs(fo.w / fo.h - p.layers[1].w / p.layers[1].h) < 1e-3, 'fit contain сохраняет пропорции');
  // автоисправление стыка
  const badAnim = { ...p.layers[1].animation, tracks: [{ prop: 'y' as const, keys: [{ t: 0, v: 0 }, { t: 0.5, v: 40 }, { t: 1, v: 25 }] }] };
  ok(hasSeam(badAnim) && !hasSeam(makeSeamless(badAnim)), 'makeSeamless убирает разрыв стыка');
  // резервная копия
  const png = new Uint8Array(readFileSync('assets/walleditor/asset2.png'));
  const pk = await packProject({ ...p, layers: [{ ...p.layers[2], asset: 'assets/a.png' }] }, { 'assets/a.png': png, '../evil.png': png, 'assets/sub/x.png': png } as any);
  const up = await unpackProject(pk);
  ok(up.project.id !== p.id && up.project.layers.length === 1, 'backup: новый id, слои сохранены');
  ok(Object.keys(up.files).join() === 'assets/a.png' && up.files['assets/a.png'].length === png.length, 'backup: ассет байт-в-байт, небезопасные пути отброшены');
  let rejected = false; try { await unpackProject(new Uint8Array([1, 2, 3])); } catch { rejected = true; }
  ok(rejected, 'backup: мусор отклоняется');
  const est = estimateSize(p); ok(est.bytes > 0 && est.seconds === 6, 'оценка размера/длительности');
  const h0 = initHistory(p); const h1 = commit(h0, { ...p, name: 'B' }, 'rename');
  ok(undo(h1).present.name === 'Демо' && redo(undo(h1)).present.name === 'B', 'undo/redo');
  const s = snapMove(5, 700, 100, 100, w, h, p.profile, [], 12);
  ok(s.x === 0 && s.guides.some((g) => g.axis === 'x'), 'snap к краю');
  console.log(fail ? `\n${fail} FAILED` : '\nВсе тесты пройдены');
  process.exit(fail ? 1 : 0);
})();

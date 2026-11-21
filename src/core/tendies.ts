import JSZip from 'jszip';
import type { Project, Layer, Issue } from './types';
import { uid, emptyAnimation } from './types';
import { pixelSize } from './devices';
import { buildMainCaml, buildIndexXml, LayerAssets } from './caml';
import { writePlist, readPlist, PDict } from './plist';
import { parseXml, XNode, childrenOf, child } from './xml';
import { FEATURES } from './verification';
import { checkPreviewConsistency } from './consistency';

export interface AssetSource {
  /** Байты статичного слоя (с уже применённой обрезкой). */
  getImage(layer: Layer): Promise<Uint8Array>;
  /** JPEG-кадры видео-слоя с учётом fps/масштаба/обрезки. */
  getVideoFrames?(layer: Layer, fps: number, scale: number, quality: number, onProgress?: (done: number, total: number) => void): Promise<Uint8Array[]>;
}

export interface ExportTemplate {
  /** Файлы plist из импортированного эталонного .tendies — используются как база вместо минимальных. */
  wallpaperPlist?: PDict;
  userInfo?: PDict;
}

export interface BuildResult {
  files: Record<string, Uint8Array | string>;
  zip: Uint8Array;
  descriptorId: string;
  wallpaperNumber: number;
  issues: Issue[];
  bytes: number;
}

const rid = () => 9999 + Math.floor(Math.random() * 90000);
const enc = (s: string) => new TextEncoder().encode(s);

export async function buildTendies(p: Project, src: AssetSource, tpl: ExportTemplate = {}, onProgress?: (msg: string, done: number, total: number) => void): Promise<BuildResult> {
  const { w: W, h: H } = pixelSize(p.profile);
  const num = rid();
  const descriptorId = uid().toUpperCase();
  const wpFolder = `${num}.Custom-${W}w-${H}h@${p.profile.scale}x~iphone.wallpaper`;
  const ca = `wallpaper.ca`;
  const root = `descriptors/${descriptorId}`;
  const contents = `${root}/versions/1/contents`;
  const caDir = `${contents}/${wpFolder}/${ca}`;
  const files: BuildResult['files'] = {};
  const assets: Record<string, LayerAssets> = {};

  const visible = p.layers.filter((l) => l.visible);
  let step = 0;
  for (const l of visible) {
    onProgress?.(l.name, step++, visible.length);
    if (l.kind === 'image' || l.kind === 'background') {
      if (!l.asset) continue;
      const name = `${l.id.slice(0, 8)}.png`;
      files[`${caDir}/assets/${name}`] = await src.getImage(l);
      assets[l.id] = { file: name };
    } else if (l.kind === 'video') {
      if (!src.getVideoFrames) continue;
      const frames = await src.getVideoFrames(l, p.export.fps, p.export.resolutionScale, p.export.jpegQuality, (d, t) => onProgress?.(`${l.name} ${d}/${t}`, d, t));
      const names = frames.map((_, i) => `${l.id.slice(0, 8)}_${i}.jpg`);
      frames.forEach((f, i) => { files[`${caDir}/assets/${names[i]}`] = f; });
      assets[l.id] = { frames: names, frameDuration: frames.length / p.export.fps };
    }
  }

  files[`${caDir}/main.caml`] = buildMainCaml(p, assets);
  files[`${caDir}/index.xml`] = buildIndexXml(W, H);
  files[`${caDir}/assetManifest.caml`] = `<?xml version="1.0" encoding="UTF-8"?>\n<caml xmlns="http://www.apple.com/CoreAnimation/1.0"><CAAssetManifest/></caml>\n`;
  files[`${contents}/${wpFolder}/Wallpaper.plist`] = writePlist({ ...(tpl.wallpaperPlist ?? {}), identifier: num });
  files[`${contents}/com.apple.posterkit.provider.contents.userInfo`] = writePlist({
    ...(tpl.userInfo ?? {}), wallpaperRepresentingIdentifier: num, wallpaperRepresentingFileName: wpFolder.replace(/\.wallpaper$/, '') + '.wallpaper'
  });
  files[`${root}/com.apple.posterkit.provider.descriptor.identifier`] = String(num);

  const zip = new JSZip();
  for (const [path, data] of Object.entries(files)) zip.file(path, data, { binary: typeof data !== 'string' });
  const out = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const issues = validateTendies(files, p, !!(tpl.wallpaperPlist && tpl.userInfo));
  issues.push(...checkPreviewConsistency(p, files[`${caDir}/main.caml`] as string));
  return { files, zip: out, descriptorId, wallpaperNumber: num, issues, bytes: out.length };
}

const JUNK = /(^|\/)(__MACOSX|\.DS_Store|\._[^/]*)(\/|$)/;

/** Проверка структуры: идентификаторы, пути, plist, CAML, ресурсы. Работает и на собственных, и на импортированных файлах. */
export function validateTendies(files: Record<string, Uint8Array | string>, p?: Project, hasTemplate = false): Issue[] {
  const issues: Issue[] = [];
  const paths = Object.keys(files);
  const add = (level: Issue['level'], code: string, message: string, extra: Partial<Issue> = {}) => issues.push({ level, code, message, ...extra });
  const text = (v: Uint8Array | string) => (typeof v === 'string' ? v : new TextDecoder().decode(v));

  for (const pth of paths) {
    if (JUNK.test(pth)) add('error', 'JUNK_ENTRY', `Служебный файл в архиве: ${pth}`);
    if (pth.startsWith('/') || pth.includes('..') || pth.includes('\\')) add('error', 'BAD_PATH', `Недопустимый путь: ${pth}`);
  }
  const top = new Set(paths.map((x) => x.split('/')[0].toLowerCase()));
  if (top.has('container')) add('error', 'CONTAINER_FORMAT', 'Формат Container не поддерживается экспортом.');
  if (top.has('video-descriptor') || top.has('video-descriptors')) add('error', 'PHOTOS_PROVIDER', 'PhotosPosterProvider не поддерживается экспортом.');
  if (!(top.has('descriptor') || top.has('descriptors'))) add('error', 'NO_DESCRIPTORS', 'Нет папки descriptors/ в корне архива.');

  const descIds = new Set(paths.filter((x) => x.startsWith('descriptors/')).map((x) => x.split('/')[1]).filter(Boolean));
  if (descIds.size === 0) add('error', 'NO_DESCRIPTOR_DIR', 'В descriptors/ нет папки дескриптора.');
  for (const d of descIds) {
    if (!/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(d)) add('warning', 'DESC_NOT_UUID', `Имя дескриптора не UUID: ${d}`);
    const idFile = `descriptors/${d}/com.apple.posterkit.provider.descriptor.identifier`;
    const ui = paths.find((x) => x.startsWith(`descriptors/${d}/`) && x.endsWith('com.apple.posterkit.provider.contents.userInfo'));
    const wp = paths.find((x) => x.startsWith(`descriptors/${d}/`) && x.endsWith('/Wallpaper.plist'));
    const caml = paths.filter((x) => x.startsWith(`descriptors/${d}/`) && x.endsWith('main.caml'));
    if (!(idFile in files)) add('error', 'NO_DESC_ID', 'Нет файла com.apple.posterkit.provider.descriptor.identifier.');
    if (!ui) add('error', 'NO_USERINFO', 'Нет contents.userInfo.');
    if (!wp) add('error', 'NO_WALLPAPER_PLIST', 'Нет Wallpaper.plist.');
    if (!caml.length) add('error', 'NO_CAML', 'Нет main.caml.');
    let idNum: string | undefined;
    if (idFile in files) { idNum = text(files[idFile]).trim(); if (!/^\d+$/.test(idNum)) add('error', 'DESC_ID_FORMAT', 'Идентификатор должен быть числом.'); }
    for (const [pth, key] of [[ui, 'wallpaperRepresentingIdentifier'], [wp, 'identifier']] as const) {
      if (!pth) continue;
      try {
        const pl = readPlist(text(files[pth]));
        if (idNum && String(pl[key]) !== idNum) add('error', 'ID_MISMATCH', `${key} не совпадает с descriptor.identifier.`);
      } catch (e: any) {
        add(e?.message === 'binary-plist' ? 'warning' : 'error', 'PLIST_PARSE', `Не удалось разобрать ${pth.split('/').pop()}: ${e?.message}`);
      }
    }
    for (const c of caml) {
      try {
        const root = parseXml(text(files[c]));
        if (root.tag !== 'caml') throw new Error('корень не <caml>');
        const dir = c.slice(0, c.lastIndexOf('/'));
        const walk = (n: XNode) => {
          for (const k of ['src']) if (n.attrs[k] && (n.tag === 'contents' || n.tag === 'CGImage')) {
            const t = `${dir}/${n.attrs[k]}`;
            if (!(t in files)) add('error', 'MISSING_RESOURCE', `Ресурс не найден: ${n.attrs[k]}`, { layerId: undefined });
          }
          n.children.forEach(walk);
        };
        walk(root);
      } catch (e: any) { add('error', 'CAML_PARSE', `main.caml: ${e?.message}`); }
    }
  }

  if (p) {
    const total = paths.reduce((s, x) => s + (typeof files[x] === 'string' ? (files[x] as string).length : (files[x] as Uint8Array).length), 0);
    if (total > 150 * 1024 * 1024) add('warning', 'SIZE_LARGE', `Большой размер (~${Math.round(total / 1048576)} МБ). Уменьшите разрешение или частоту кадров.`, { setting: 'export' });
    for (const l of p.layers) {
      if (!l.visible) continue;
      if ((l.kind === 'image' || l.kind === 'background' || l.kind === 'video') && !l.asset) add('error', 'NO_ASSET', `У слоя «${l.name}» нет файла.`, { layerId: l.id });
      if (l.kind === 'text' && !l.text) add('warning', 'EMPTY_TEXT', `Пустой текст в слое «${l.name}».`, { layerId: l.id });
      if (l.kind === 'video' && l.videoDuration && (l.videoTrim ? l.videoTrim.end - l.videoTrim.start : l.videoDuration) > 12) add('error', 'VIDEO_LONG', `Видео «${l.name}» длиннее 12 с.`, { layerId: l.id });
      if (l.kind === 'text') add('info', 'TEXT_UNVERIFIED', FEATURES['text-layer'].note, { layerId: l.id });
      if (l.kind === 'shape') add('info', 'SHAPE_UNVERIFIED', FEATURES['shape-layer'].note, { layerId: l.id });
      if (l.animation.enabled && l.animation.tracks.length) add('info', 'ANIM_UNVERIFIED', FEATURES['anim-position-rotation-scale-opacity'].note, { layerId: l.id, setting: 'animation' });
    }
    if (p.layers.filter((l) => l.visible && l.kind === 'video').length > 1) add('warning', 'MANY_VIDEOS', 'Несколько видео-слоёв сильно увеличивают размер.', { setting: 'export' });
    if (!hasTemplate) add('info', 'PLIST_UNVERIFIED', FEATURES['plist-keys'].note, { setting: 'export' });
  }
  return issues;
}

export interface ImportResult {
  project: Project;
  warnings: string[];
  template: ExportTemplate;
  assetFiles: Record<string, Uint8Array>; // относительный путь (assets/xxx) → байты
}

/** Открывает .tendies: восстанавливает поддерживаемые слои, остальное — в предупреждения. Исходный архив не меняется. */
export async function importTendies(data: Uint8Array, base: Project, fileName: string): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(data);
  const files: Record<string, Uint8Array> = {};
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir || JUNK.test(name)) continue;
    files[name] = await entry.async('uint8array');
  }
  const warnings: string[] = [];
  const topDirs = new Set(Object.keys(files).map((x) => x.split('/')[0].toLowerCase()));
  if (topDirs.has('container')) warnings.push('Формат Container не поддерживается — слои не восстановлены.');
  if (topDirs.has('video-descriptor') || topDirs.has('video-descriptors')) warnings.push('PhotosPosterProvider не поддерживается.');
  const camlPath = Object.keys(files).find((x) => /^descriptors?\//i.test(x) && x.endsWith('main.caml'));
  const layers: Layer[] = [];
  const assetFiles: Record<string, Uint8Array> = {};
  const template: ExportTemplate = {};
  if (!camlPath) {
    warnings.push('main.caml не найден — слои не восстановлены.');
  } else {
    const dir = camlPath.slice(0, camlPath.lastIndexOf('/'));
    const root = parseXml(new TextDecoder().decode(files[camlPath]));
    const doc = Object.keys(files).find((x) => x.startsWith(dir + '/index.xml'));
    let { w: W, h: H } = pixelSize(base.profile);
    const rootLayer = child(root, 'CALayer');
    if (rootLayer?.attrs.bounds) { const [, , bw, bh] = rootLayer.attrs.bounds.split(' ').map(Number); if (bw && bh) { W = bw; H = bh; } }
    const flat: XNode[] = [];
    const walk = (n: XNode) => { for (const c of n.children) { if (c.tag === 'sublayers') c.children.forEach((s) => { flat.push(s); walk(s); }); else if (c.tag !== 'animations') walk(c); } };
    if (rootLayer) walk(rootLayer);
    void doc;
    for (const n of flat) {
      if (n.tag === 'CATransformLayer') continue;
      if (n.attrs.name === '_FLOATING' || n.attrs.name === 'Chip') continue;
      const [bx, by, bw, bh] = (n.attrs.bounds ?? '0 0 0 0').split(' ').map(Number);
      const [px, py] = (n.attrs.position ?? '0 0').split(' ').map(Number);
      const contents = childrenOf(n, 'contents')[0];
      const anims = child(n, 'animations');
      const kfContents = anims && childrenOf(anims, 'animation').find((a) => a.attrs.keyPath === 'contents');
      const common = { id: uid(), name: n.attrs.name || 'Layer', visible: n.attrs.hidden !== '1', locked: false, x: px - bw / 2, y: H - py - bh / 2, w: bw, h: bh, scale: 1, rotation: 0, opacity: n.attrs.opacity ? Number(n.attrs.opacity) : 1, animation: emptyAnimation() };
      void bx; void by;
      if (n.tag === 'CATextLayer') {
        layers.push({ ...common, kind: 'text', text: n.attrs.string ?? '', fontSize: Number(n.attrs.fontSize) || 48, color: '#ffffff' });
      } else if (contents?.attrs.src) {
        const rel = `${dir}/${contents.attrs.src}`;
        if (kfContents) {
          warnings.push(`Слой «${common.name}»: видео-кадры восстановлены как первый кадр (покадровая анимация не редактируется).`);
        }
        if (files[rel]) {
          const key = `assets/${uid().slice(0, 8)}_${contents.attrs.src.split('/').pop()}`;
          assetFiles[key] = files[rel];
          layers.push({ ...common, kind: 'image', asset: key });
        } else warnings.push(`Ресурс слоя «${common.name}» не найден: ${contents.attrs.src}`);
      } else if (n.attrs.backgroundColor) {
        const c = n.attrs.backgroundColor.split(' ').map((x) => Math.round(Number(x) * 255));
        const hex = '#' + c.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');
        layers.push({ ...common, kind: 'shape', shape: Number(n.attrs.cornerRadius) > 0 ? 'roundRect' : 'rect', fill: hex, cornerRadius: Number(n.attrs.cornerRadius) || 0 });
      } else {
        warnings.push(`Неподдерживаемый элемент «${common.name}» (${n.tag}) пропущен.`);
      }
      if (anims && childrenOf(anims, 'animation').some((a) => a.attrs.keyPath && a.attrs.keyPath !== 'contents')) warnings.push(`Анимации слоя «${common.name}» не восстановлены — добавьте их заново.`);
    }
    const wp = Object.keys(files).find((x) => x.endsWith('/Wallpaper.plist'));
    const ui = Object.keys(files).find((x) => x.endsWith('com.apple.posterkit.provider.contents.userInfo'));
    try { if (wp) template.wallpaperPlist = readPlist(new TextDecoder().decode(files[wp])); if (ui) template.userInfo = readPlist(new TextDecoder().decode(files[ui])); } catch { warnings.push('Plist-файлы эталона не удалось прочитать (возможно, бинарные).'); }
  }
  const project: Project = { ...base, id: uid(), name: fileName.replace(/\.tendies$/i, ''), createdAt: Date.now(), updatedAt: Date.now(), isDemo: false, layers, source: { importedFrom: fileName, warnings } };
  return { project, warnings, template, assetFiles };
}

export const estimateSize = (p: Project): { bytes: number; seconds: number; frames: number } => {
  const { w, h } = pixelSize(p.profile);
  let bytes = 20_000; let frames = 0; let seconds = 0;
  for (const l of p.layers) {
    if (!l.visible) continue;
    if (l.kind === 'video' && l.videoDuration) {
      const dur = l.videoTrim ? l.videoTrim.end - l.videoTrim.start : l.videoDuration;
      const f = Math.round(dur * p.export.fps); frames += f; seconds = Math.max(seconds, dur);
      bytes += f * w * h * p.export.resolutionScale ** 2 * (0.05 + 0.25 * p.export.jpegQuality) * 0.5;
    } else if (l.kind === 'image' || l.kind === 'background') bytes += (l.assetW ?? 1000) * (l.assetH ?? 1000) * 1.2;
    if (l.animation.enabled) seconds = Math.max(seconds, l.animation.duration);
  }
  return { bytes: Math.round(bytes), seconds, frames };
};

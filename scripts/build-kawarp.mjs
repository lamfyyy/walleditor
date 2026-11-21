// Встраивает @kawarp/core (AGPL-3.0, автор: Better Lyrics) в один IIFE-бандл для WebView, без сети во время работы приложения.
import { createRequire } from 'module';
import { writeFileSync, mkdirSync } from 'fs';
const require = createRequire(import.meta.url);
const out = 'src/generated/kawarpBundle.ts';
mkdirSync('src/generated', { recursive: true });
try {
  const esbuild = await import('esbuild');
  const entry = require.resolve('@kawarp/core');
  const r = await esbuild.build({ entryPoints: [entry], bundle: true, format: 'iife', globalName: 'KawarpLib', minify: true, write: false, platform: 'browser', target: 'safari16' });
  const js = r.outputFiles[0].text;
  writeFileSync(out, `// АВТОГЕНЕРАЦИЯ scripts/build-kawarp.mjs — не править. @kawarp/core, AGPL-3.0.\nexport const KAWARP_BUNDLE: string = ${JSON.stringify(js)};\n`);
  console.log(`kawarp: бандл ${Math.round(js.length / 1024)} КБ`);
} catch (e) {
  console.warn('kawarp: бандл не собран, будет статичный фон:', e.message);
  writeFileSync(out, `export const KAWARP_BUNDLE: string = '';\n`);
}

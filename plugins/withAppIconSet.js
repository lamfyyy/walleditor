// Подменяет сгенерированный Expo AppIcon.appiconset на исходный набор пользователя (light/dark/tinted) без изменений файлов.
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = (config) =>
  withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const src = path.join(cfg.modRequest.projectRoot, 'assets/walleditor/AppIcon.appiconset');
      const name = cfg.modRequest.projectName; // каталог ios/<name>
      const dst = path.join(cfg.modRequest.platformProjectRoot, name, 'Images.xcassets', 'AppIcon.appiconset');
      const contents = JSON.parse(fs.readFileSync(path.join(src, 'Contents.json'), 'utf8'));
      for (const img of contents.images) {
        if (!fs.existsSync(path.join(src, img.filename))) throw new Error(`AppIcon: нет файла ${img.filename}`);
      }
      fs.rmSync(dst, { recursive: true, force: true });
      fs.mkdirSync(dst, { recursive: true });
      for (const f of fs.readdirSync(src)) fs.copyFileSync(path.join(src, f), path.join(dst, f));
      return cfg;
    }
  ]);

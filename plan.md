# walleditor — полный редактор многослойных динамических обоев

## Цель

`walleditor` — локальный iPhone-редактор многослойных динамических обоев с интерфейсом на русском и английском языках. Он должен позволять создавать проекты, добавлять и редактировать слои, видеть живой Lock Screen mockup, настраивать анимацию Kawarp, сохранять проекты на устройстве и экспортировать/импортировать переносимый `.tendies`-пакет. Переданные ассеты используются без изменения исходных файлов.

Приложение не делает автоматический импорт в Pocket Poster. Формат `.tendies` в этой версии — переносимый пакет walleditor с честной пометкой о необходимости ручной проверки PosterBoard/CAML совместимости на устройстве.

## Реализация

- Сохранить Expo Router / React Native / TypeScript / NativeWind starter.
- Использовать глобальную тему `White`, `OLED black` или `Kawarp`, выбранную в Settings и сохранённую в AsyncStorage.
- Применить Liquid Glass через общий `GlassSurface` и translucent/blur tab bar на всех вкладках.
- Хранить проекты с versioned JSON-моделью `Project → Canvas → Layer[] → LayerAnimation[] → KawarpSettings`.
- Поддержать CRUD проектов: новый draft, переименование, дубликат, удаление, выбор активного проекта и автоматическое/ручное сохранение.
- Поддержать работу со слоями: добавить один из переданных ассетов, выбрать, переименовать, скрыть, заблокировать, удалить, поднять/опустить, дублировать, изменить позицию, scale, rotation, opacity и animation.
- Реализовать локальный undo/redo снимками активного проекта.
- Kawarp строится на переданной топографической текстуре `background.png`: texture pan/zoom, два настраиваемых цвета, интенсивность, скорость и цветовой цикл; `asset1.png` и `asset2.png` остаются самостоятельными слоями.
- Реализовать walleditor `.tendies` как JSON-пакет с manifest, проектом и asset keys, экспортом через Files/Share Sheet и импортом через DocumentPicker. Не заявлять, что этот пакет уже подтверждён Pocket Poster без ручной device-проверки.
- Добавить Settings-подразделы Appearance, Storage & Projects, Export & Import, Logs и About.

## Дизайн

Выбран стиль **Kawarp editorial glass**: canvas first, спокойная редакционная типографика, чёрно-белая topographic texture, полупрозрачные стеклянные поверхности и дозированный `#FF4FA3`. Liquid Glass не должен скрывать artwork; tab bar — плавающая стеклянная панель с blur, safe-area и тонким active indicator.

## Структура

```text
app/(tabs)/_layout.tsx              global Liquid Glass tab bar
app/(tabs)/index.tsx                dashboard with live theme and Kawarp hero
app/(tabs)/projects.tsx             project library + full layer editor
app/(tabs)/settings.tsx             Appearance, storage, export/import, logs, about
components/walleditor/GlassSurface.tsx
components/walleditor/KawarpBackground.tsx
components/walleditor/CanvasPreview.tsx
lib/theme-provider.tsx              persisted app-level theme
lib/walleditor/theme.ts              palettes and theme options
lib/walleditor/model.ts              versioned project/layer/Kawarp model
lib/walleditor/storage.ts            validated local CRUD and serialized writes
lib/walleditor/export/tendies.ts     package builder, Files import, Share Sheet export
lib/walleditor/export/validate.ts    export checks and PosterBoard warning boundary
```

## Проверка и handoff

Перед каждым IPA: `pnpm check`, `pnpm lint`, `pnpm test`. GitHub Actions uses `macos-latest`, Expo prebuild, CocoaPods, `xcodebuild` with code signing disabled, then packages `walleditor-unsigned.ipa` for manual signing through SideStore or LiveContainer. This artifact is not claimed as Apple-signed or PosterBoard-validated.

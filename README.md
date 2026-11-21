# walleditor

Личное некоммерческое iPhone-приложение для создания многослойных динамических обоев и экспорта `.tendies`.
Bundle ID `com.yxwwx.walleditor` · Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router · NativeWind · AsyncStorage.
Автор: Даня Янти (yntheee/yxwwx). Анимированный фон: [Kawarp](https://kawarp.vercel.app/) (Better Lyrics, AGPL-3.0).

## Статус — читайте честно
| Что | Состояние |
|---|---|
| Ядро (модель, CAML, plist, сборка/проверка/импорт `.tendies`, undo/redo, snap) | Написано; `npm test` — 38 проверок; строгий `tsc` по ядру чист |
| Экраны/UI React Native | Написаны, **не компилировались и не запускались** (нет сети/Xcode в среде разработки) |
| `npx expo install --fix`, версии пакетов | **Не проверено**: версии в `package.json` выставлены по SDK 57, CI выравнивает их командой `expo install --fix` |
| Unsigned IPA | **Не собран.** Workflow есть (`.github/workflows/ios-unsigned.yml`), фактически не запускался |
| Экспорт в Pocket Poster / Nugget на устройстве | **Не проверен.** См. `docs/DEVICE_TEST.md` и `src/core/verification.ts` |

## Дополнительно реализовано (сверх ТЗ)
- **Сверка предпросмотра с экспортом** (`src/core/consistency.ts`): после сборки CAML парсится и сравнивается с тем, что рисует редактор (позиция, поворот, масштаб, прозрачность на 13 моментах цикла). Нашла и помогла исправить ошибку: анимация прозрачности игнорировала прозрачность слоя. Это проверка согласованности двух реализаций, а не гарантия, что PosterBoard прочитает файл.
- **Выравнивание и вписывание** слоёв (края, центр, safe areas; contain/cover/stretch с учётом обрезки).
- **«Сделать бесшовным»**: автоисправление разрыва на стыке цикла.
- **Резервная копия проекта** `.walleditor` (редактируемый проект, отдельно от `.tendies`); восстановление всегда создаёт новый проект, небезопасные пути отбрасываются.
- **Шаблоны холста** (сохранение/удаление) и ввод HEX-цветов Kawarp.

## Что сверено с источниками
`descriptors/<UUID>/…` и поиск дескрипторов (PosterBoardManager.swift), каркас CAML `_FLOATING → Chip → …`, `index.xml`, покадровая анимация `contents` (VideoHandler.swift), ключи `identifier`, `wallpaperRepresentingIdentifier`, `wallpaperRepresentingFileName`.
**Не подтверждено:** полный набор ключей plist, запись keyPath-анимаций (position/rotation/scale/opacity), CATextLayer, фигуры. Они помечены `unverified` и показываются в экспорте как экспериментальные. Если импортировать известный рабочий `.tendies`, его plist сохраняются как база для экспорта.

## Сборка unsigned IPA (GitHub Actions)
1. Запушьте проект в репозиторий, запустите workflow **iOS unsigned IPA** (Actions → Run workflow).
2. Артефакт `walleditor-unsigned-ipa` → `walleditor-unsigned.ipa`. Apple-аккаунт и подпись не нужны.
3. Подпишите самостоятельно через SideStore / LiveContainer ([docs.sidestore.io](https://docs.sidestore.io/)).
Не считайте IPA готовым, пока job не зелёный и артефакт не проверен (шаг «Inspect IPA» проверяет Bundle ID, arm64, иконку).

## Локальная проверка без iOS
```bash
npm install
python3 tools/verify_assets.py     # исходные ассеты не изменены, иконка валидна
npm test                           # ядро
npm run export:sample && python3 tools/check_tendies.py out/demo.tendies
```

## Ассеты
`assets/walleditor/{background,asset1,asset2}.png` и `AppIcon.appiconset/` используются как есть; хэши — `tools/assets.sha256.json`.
`asset2.png` имеет прозрачное поле слева (31 px): в демо слой обрезается неразрушающе (`crop`), файл не меняется.
`plugins/withAppIconSet.js` копирует ваш `AppIcon.appiconset` в Xcode-проект после `prebuild`; CI делает `diff -r`.

## Лицензия
AGPL-3.0-only (так как встраивается `@kawarp/core`, AGPL-3.0). Добавьте официальный текст лицензии в `LICENSE` перед публикацией. Распространяя IPA, публикуйте и исходники.

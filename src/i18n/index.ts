import { getLocales } from 'expo-localization';

const ru = {
  library: 'Библиотека', search: 'Поиск', all: 'Все', withVideo: 'С видео', animated: 'С анимацией', demo: 'Демо',
  newProject: 'Новый проект', duplicate: 'Дублировать', delete: 'Удалить', rename: 'Переименовать', openTendies: 'Открыть .tendies',
  modified: 'Изменён', layers: 'Слои', add: 'Добавить', image: 'Изображение', video: 'Видео', text: 'Текст', shape: 'Фигура', background: 'Фон',
  save: 'Сохранить', saved: 'Сохранено', undo: 'Отменить', redo: 'Повторить', history: 'История', export: 'Экспорт', settings: 'Настройки',
  inspector: 'Свойства', position: 'Позиция', size: 'Размер', scale: 'Масштаб', rotation: 'Поворот', opacity: 'Прозрачность', reset: 'Сбросить',
  copyAnim: 'Копировать анимацию', pasteAnim: 'Вставить анимацию', animation: 'Анимация', play: 'Играть', pause: 'Пауза', restart: 'Сначала',
  loopStart: 'Начало', loopEnd: 'Конец', duration: 'Длительность', loop: 'Цикл', autoreverse: 'Туда-обратно', floatPreset: 'Плавание',
  grid: 'Сетка', guides: 'Направляющие', snap: 'Магнит', lockscreen: 'Макет Lock Screen', lockscreenNote: 'Визуальный макет: перекрытие часов не проверено на устройстве.',
  theme: 'Тема', themeWhite: 'Белая', themeOled: 'OLED-чёрная', themeKawarp: 'Kawarp', language: 'Язык', auto: 'Авто',
  kawarpColors: 'Цвета фона', brightness: 'Яркость', intensity: 'Интенсивность', glassAlways: 'Liquid Glass всегда включён и не отключается.',
  device: 'Модель iPhone', about: 'О приложении', author: 'Автор', kawarpCredit: 'Анимированный фон: Kawarp (Better Lyrics), лицензия AGPL-3.0.',
  exportTitle: 'Экспорт .tendies', estimate: 'Оценка', fps: 'Частота кадров', resolution: 'Разрешение видео', quality: 'Качество JPEG',
  build: 'Собрать .tendies', share: 'Сохранить / поделиться', validating: 'Проверка…', problems: 'Проверка структуры', noProblems: 'Ошибок структуры не найдено.',
  unverifiedNote: 'Экспериментально: формат ещё не проверен на устройстве.', guide: 'Как импортировать в Pocket Poster',
  guideSteps: ['Нажмите «Собрать .tendies», затем «Сохранить / поделиться» и сохраните файл в Файлы.', 'Откройте Pocket Poster и выберите «Select Tendies».', 'Выберите сохранённый файл .tendies из Файлов.', 'Нажмите «Apply» в Pocket Poster и следуйте его подсказкам.', 'Откройте экран блокировки → «Настроить» и выберите новые обои.'],
  guideNote: 'walleditor не взаимодействует с Pocket Poster: импорт и применение выполняются вами вручную.',
  empty: 'Пока пусто', layerName: 'Название слоя', color: 'Цвет', fontSize: 'Размер шрифта', content: 'Текст', trim: 'Обрезка видео', crop: 'Обрезка',
  lock: 'Блокировка', visible: 'Видимость', up: 'Выше', down: 'Ниже', cancel: 'Отмена', ok: 'ОК', importWarnings: 'Предупреждения импорта', openLayer: 'Открыть слой',
  align: 'Выравнивание', fit: 'Вписать', contain: 'Целиком', cover: 'Заполнить', stretch: 'Растянуть', makeSeamless: 'Сделать бесшовным',
  backup: 'Резервная копия', saveTemplate: 'Сохранить холст как шаблон', templateName: 'Название шаблона', hexColor: 'Цвет (HEX)'
};
const en: typeof ru = {
  library: 'Library', search: 'Search', all: 'All', withVideo: 'With video', animated: 'Animated', demo: 'Demo',
  newProject: 'New project', duplicate: 'Duplicate', delete: 'Delete', rename: 'Rename', openTendies: 'Open .tendies',
  modified: 'Modified', layers: 'Layers', add: 'Add', image: 'Image', video: 'Video', text: 'Text', shape: 'Shape', background: 'Background',
  save: 'Save', saved: 'Saved', undo: 'Undo', redo: 'Redo', history: 'History', export: 'Export', settings: 'Settings',
  inspector: 'Inspector', position: 'Position', size: 'Size', scale: 'Scale', rotation: 'Rotation', opacity: 'Opacity', reset: 'Reset',
  copyAnim: 'Copy animation', pasteAnim: 'Paste animation', animation: 'Animation', play: 'Play', pause: 'Pause', restart: 'Restart',
  loopStart: 'Loop start', loopEnd: 'Loop end', duration: 'Duration', loop: 'Loop', autoreverse: 'Autoreverse', floatPreset: 'Float',
  grid: 'Grid', guides: 'Guides', snap: 'Snap', lockscreen: 'Lock Screen mockup', lockscreenNote: 'Visual mockup only: clock overlap is not verified on device.',
  theme: 'Theme', themeWhite: 'White', themeOled: 'OLED black', themeKawarp: 'Kawarp', language: 'Language', auto: 'Auto',
  kawarpColors: 'Background colors', brightness: 'Brightness', intensity: 'Intensity', glassAlways: 'Liquid Glass is always on and cannot be disabled.',
  device: 'iPhone model', about: 'About', author: 'Author', kawarpCredit: 'Animated background: Kawarp (Better Lyrics), AGPL-3.0.',
  exportTitle: 'Export .tendies', estimate: 'Estimate', fps: 'Frame rate', resolution: 'Video resolution', quality: 'JPEG quality',
  build: 'Build .tendies', share: 'Save / share', validating: 'Validating…', problems: 'Structure check', noProblems: 'No structure errors found.',
  unverifiedNote: 'Experimental: format not yet verified on device.', guide: 'How to import into Pocket Poster',
  guideSteps: ['Tap “Build .tendies”, then “Save / share” and save the file to Files.', 'Open Pocket Poster and choose “Select Tendies”.', 'Pick the saved .tendies file from Files.', 'Tap “Apply” in Pocket Poster and follow its prompts.', 'Open the Lock Screen → Customize and pick the new wallpaper.'],
  guideNote: 'walleditor does not talk to Pocket Poster: you import and apply manually.',
  empty: 'Nothing here yet', layerName: 'Layer name', color: 'Color', fontSize: 'Font size', content: 'Text', trim: 'Video trim', crop: 'Crop',
  lock: 'Lock', visible: 'Visible', up: 'Up', down: 'Down', cancel: 'Cancel', ok: 'OK', importWarnings: 'Import warnings', openLayer: 'Open layer',
  align: 'Align', fit: 'Fit', contain: 'Contain', cover: 'Cover', stretch: 'Stretch', makeSeamless: 'Make seamless',
  backup: 'Backup', saveTemplate: 'Save canvas as template', templateName: 'Template name', hexColor: 'Color (HEX)'
};
export type Lang = 'ru' | 'en';
export type Key = keyof typeof ru;
const dict = { ru, en };
export const detectLang = (): Lang => (getLocales()[0]?.languageCode === 'ru' ? 'ru' : 'en');
export const tr = (lang: Lang, k: Key): string => (dict[lang] as any)[k] ?? k;
export const guideSteps = (lang: Lang): string[] => dict[lang].guideSteps;

// Реестр того, что проверено на устройстве. Пока строка не помечена 'device', экспорт её показывает как экспериментальную.
export type VerifyState = 'source' | 'device' | 'unverified';

export const FEATURES: Record<string, { state: VerifyState; note: string }> = {
  'descriptor-layout': { state: 'source', note: 'Раскладка descriptors/<UUID>/ сверена с PosterBoardManager.swift (Pocket Poster).' },
  'video-contents-keyframes': { state: 'source', note: 'CAKeyframeAnimation keyPath=contents сверена с VideoHandler.swift.' },
  'caml-skeleton': { state: 'source', note: 'Каркас _FLOATING/Chip/states сверен с VideoHandler.swift.' },
  'plist-keys': { state: 'unverified', note: 'Подтверждены только ключи identifier, wallpaperRepresentingIdentifier, wallpaperRepresentingFileName; полный набор ключей нужно сверить с эталонным .tendies.' },
  'anim-position-rotation-scale-opacity': { state: 'unverified', note: 'CAML-запись keyPath-анимаций (position/rotation/scale/opacity) не проверена на устройстве.' },
  'text-layer': { state: 'unverified', note: 'CATextLayer в CAML не проверен на устройстве.' },
  'shape-layer': { state: 'unverified', note: 'Фигуры как CALayer с backgroundColor/cornerRadius не проверены на устройстве.' },
  'static-rotation': { state: 'unverified', note: 'Статический поворот реализован через анимацию-заглушку.' },
  'lockscreen-overlap': { state: 'unverified', note: 'Перекрытие часов — только визуальный макет.' },
  'color-effects': { state: 'unverified', note: 'Цветовые эффекты, particle/emitter и отклик на движение не реализованы до проверки.' },
  'photos-poster-provider': { state: 'unverified', note: 'PhotosPosterProvider не экспортируется.' }
};

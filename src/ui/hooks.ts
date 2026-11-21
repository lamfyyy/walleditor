import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { THEMES } from '../theme/themes';
import { tr, Key } from '../i18n';

export const useTheme = () => THEMES[useStore((s) => s.settings.theme)];
export function useT() {
  const lang = useStore((s) => (s.settings.lang === 'auto' ? undefined : s.settings.lang));
  const l = lang ?? useStore.getState().lang();
  return (k: Key) => tr(l, k);
}

/** Часы предпросмотра: время в секундах, ~30 кадров/с, управляемые play/seek. */
export function useClock() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const tRef = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = Date.now(), acc = 0;
    const tick = () => {
      const now = Date.now(); acc += now - last; last = now;
      if (acc >= 33) { tRef.current += acc / 1000; acc = 0; setT(tRef.current); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  const seek = (v: number) => { tRef.current = v; setT(v); };
  return { t, playing, play: () => setPlaying(true), pause: () => setPlaying(false), seek, restart: () => seek(0) };
}

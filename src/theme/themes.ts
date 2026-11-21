export type ThemeId = 'white' | 'oled' | 'kawarp';
export interface Theme {
  id: ThemeId; name: Record<'ru' | 'en', string>;
  bg: string; text: string; subtext: string; accent: string; glassTint: string; border: string; scheme: 'light' | 'dark'; danger: string;
}
// Ровно три темы. Liquid Glass присутствует во всех и не отключается.
export const THEMES: Record<ThemeId, Theme> = {
  white: { id: 'white', name: { ru: 'Белая', en: 'White' }, bg: '#F2F2F7', text: '#111114', subtext: '#6B6B76', accent: '#0A84FF', glassTint: 'rgba(255,255,255,0.35)', border: 'rgba(0,0,0,0.08)', scheme: 'light', danger: '#FF3B30' },
  oled: { id: 'oled', name: { ru: 'OLED-чёрная', en: 'OLED black' }, bg: '#000000', text: '#F5F5F7', subtext: '#8E8E98', accent: '#64B5FF', glassTint: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.14)', scheme: 'dark', danger: '#FF453A' },
  kawarp: { id: 'kawarp', name: { ru: 'Kawarp', en: 'Kawarp' }, bg: '#1B1730', text: '#FFFFFF', subtext: '#C9C4E0', accent: '#B9A7FF', glassTint: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.20)', scheme: 'dark', danger: '#FF6B6B' }
};
export const DEFAULT_KAWARP = { colors: ['#6C4DFF', '#FF4D9D', '#2EC5FF'], intensity: 1, brightness: 1 };
export type KawarpSettings = typeof DEFAULT_KAWARP;

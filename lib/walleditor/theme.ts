export type AppThemeName = "white" | "oled" | "kawarp";

export type WalleditorPalette = {
  page: string;
  panel: string;
  panelStrong: string;
  card: string;
  cardAlt: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentSoft: string;
  danger: string;
  warning: string;
  glassTint: "light" | "dark";
};

export const APP_THEME_OPTIONS: Array<{ id: AppThemeName; label: string; detail: string }> = [
  { id: "white", label: "White", detail: "Тёплый светлый стеклянный интерфейс" },
  { id: "oled", label: "OLED black", detail: "Чёрный фон и высокий контраст" },
  { id: "kawarp", label: "Kawarp", detail: "Живой фон и розовый акцент" },
];

export const APP_PALETTES: Record<AppThemeName, WalleditorPalette> = {
  white: {
    page: "#F3F0EC",
    panel: "rgba(255,255,255,0.74)",
    panelStrong: "rgba(255,255,255,0.92)",
    card: "#FFFFFF",
    cardAlt: "#EAE5DF",
    text: "#171719",
    muted: "#747078",
    border: "rgba(41,35,44,0.14)",
    accent: "#171719",
    accentSoft: "rgba(23,23,25,0.12)",
    danger: "#C5445D",
    warning: "#A46B08",
    glassTint: "light",
  },
  oled: {
    page: "#000000",
    panel: "rgba(24,24,27,0.68)",
    panelStrong: "rgba(31,31,35,0.92)",
    card: "#151517",
    cardAlt: "#202024",
    text: "#FAFAFA",
    muted: "#9D9DA7",
    border: "rgba(255,255,255,0.16)",
    accent: "#FFFFFF",
    accentSoft: "rgba(255,255,255,0.12)",
    danger: "#FF7189",
    warning: "#FFC66D",
    glassTint: "dark",
  },
  kawarp: {
    page: "#100B12",
    panel: "rgba(35,24,39,0.66)",
    panelStrong: "rgba(35,24,39,0.92)",
    card: "#231827",
    cardAlt: "#33233A",
    text: "#FFF7FB",
    muted: "#B9A9B7",
    border: "rgba(255,139,199,0.28)",
    accent: "#FF4FA3",
    accentSoft: "rgba(255,79,163,0.16)",
    danger: "#FF7C9A",
    warning: "#FFC66D",
    glassTint: "dark",
  },
};

export function getPalette(theme: AppThemeName) {
  return APP_PALETTES[theme];
}

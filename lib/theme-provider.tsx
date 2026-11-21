import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";
import { APP_PALETTES, getPalette, type AppThemeName, type WalleditorPalette } from "@/lib/walleditor/theme";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  appTheme: AppThemeName;
  setAppTheme: (theme: AppThemeName) => void;
  palette: WalleditorPalette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const SETTINGS_KEY = "walleditor.settings.v1";

type StoredSettings = { appTheme?: AppThemeName };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() === "dark" ? "dark" : "light";
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);
  const [appTheme, setAppThemeState] = useState<AppThemeName>("kawarp");

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => root.style.setProperty(`--color-${token}`, value));
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    applyScheme(scheme);
  }, [applyScheme]);

  const setAppTheme = useCallback((theme: AppThemeName) => {
    setAppThemeState(theme);
    const nextScheme: ColorScheme = theme === "white" ? "light" : "dark";
    setColorSchemeState(nextScheme);
    applyScheme(nextScheme);
    void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ appTheme: theme } satisfies StoredSettings));
  }, [applyScheme]);

  useEffect(() => {
    void AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const settings = JSON.parse(raw) as StoredSettings;
        if (settings.appTheme && settings.appTheme in APP_PALETTES) setAppThemeState(settings.appTheme);
      } catch {
        // Keep the safe default theme.
      }
    });
  }, []);

  useEffect(() => {
    const scheme: ColorScheme = appTheme === "white" ? "light" : "dark";
    setColorSchemeState(scheme);
    applyScheme(scheme);
  }, [appTheme, applyScheme]);

  const themeVariables = useMemo(() => {
    const base = SchemeColors[colorScheme];
    const palette = getPalette(appTheme);
    return vars({
      "color-primary": palette.accent,
      "color-background": palette.page,
      "color-surface": palette.card,
      "color-foreground": palette.text,
      "color-muted": palette.muted,
      "color-border": palette.border,
      "color-success": base.success,
      "color-warning": palette.warning,
      "color-error": palette.danger,
    });
  }, [appTheme, colorScheme]);

  const value = useMemo(() => ({
    colorScheme,
    setColorScheme,
    appTheme,
    setAppTheme,
    palette: APP_PALETTES[appTheme],
  }), [appTheme, colorScheme, setAppTheme, setColorScheme]);

  return <ThemeContext.Provider value={value}><View style={[{ flex: 1 }, themeVariables]}>{children}</View></ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}

export function useAppTheme() {
  const { appTheme, setAppTheme, palette } = useThemeContext();
  return { appTheme, setAppTheme, palette };
}

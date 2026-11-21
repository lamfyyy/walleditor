import { BlurView } from "expo-blur";
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { useAppTheme } from "@/lib/theme-provider";

type GlassSurfaceProps = ViewProps & {
  variant?: "panel" | "card" | "strong";
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function GlassSurface({ children, variant = "panel", style, contentStyle, ...props }: GlassSurfaceProps) {
  const { appTheme, palette } = useAppTheme();
  const intensity = variant === "strong" ? 70 : variant === "card" ? 45 : 32;
  const fill = variant === "strong" ? palette.panelStrong : palette.panel;
  return (
    <View style={[styles.shell, { borderColor: palette.border, backgroundColor: fill }, style]} {...props}>
      <BlurView intensity={intensity} tint={palette.glassTint} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: appTheme === "white" ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.035)" }]} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  content: { position: "relative" },
});

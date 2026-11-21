import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/lib/theme-provider";

export default function TabLayout() {
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { position: "absolute", left: 12, right: 12, bottom: Math.max(insets.bottom, 7), height: 62, paddingTop: 7, paddingBottom: 6, borderTopWidth: 0, backgroundColor: "transparent", elevation: 0 },
        tabBarBackground: () => <View style={[StyleSheet.absoluteFill, styles.bar, { borderColor: palette.border }]}><BlurView intensity={68} tint={palette.glassTint} style={StyleSheet.absoluteFill} /><View style={[StyleSheet.absoluteFill, { backgroundColor: palette.panelStrong }]} /></View>,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Главная", tabBarIcon: ({ color }) => <IconSymbol size={25} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="projects" options={{ title: "Проекты", tabBarIcon: ({ color }) => <IconSymbol size={25} name="square.stack.3d.up.fill" color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Настройки", tabBarIcon: ({ color }) => <IconSymbol size={25} name="gearshape.fill" color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({ bar: { overflow: "hidden", borderWidth: 1, borderRadius: 23, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 8 } });

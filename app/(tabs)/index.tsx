import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CanvasPreview } from "@/components/walleditor/CanvasPreview";
import { GlassSurface } from "@/components/walleditor/GlassSurface";
import { ScreenContainer } from "@/components/screen-container";
import { useAppTheme } from "@/lib/theme-provider";
import { appendLog } from "@/lib/walleditor/logs";
import { loadProjects } from "@/lib/walleditor/storage";
import type { Project } from "@/lib/walleditor/model";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette, appTheme } = useAppTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [playing, setPlaying] = useState(true);
  useFocusEffect(useCallback(() => {
    void loadProjects().then(setProjects).catch((error) => appendLog("error", `Home load failed: ${String(error)}`));
    void appendLog("info", "Home dashboard opened");
  }, []));
  const latest = projects[0];
  return (
    <ScreenContainer style={{ backgroundColor: palette.page }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 18), paddingBottom: 110 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>WALLEDITOR / HOME</Text>
        <View style={styles.headingRow}><View style={{ flex: 1 }}><Text style={[styles.title, { color: palette.text }]}>Make it move.</Text><Text style={[styles.subtitle, { color: palette.muted }]}>Собирай сцену, проверяй цикл, сохраняй локально.</Text></View><Pressable onPress={() => setPlaying((value) => !value)} style={[styles.play, { borderColor: palette.border, backgroundColor: palette.panel }]}><Text style={{ color: palette.text, fontWeight: "900" }}>{playing ? "Ⅱ" : "▶"}</Text></Pressable></View>
        {latest ? <CanvasPreview project={latest} playing={playing} /> : <GlassSurface><Text style={{ color: palette.text }}>Загрузка проектов…</Text></GlassSurface>}
        <GlassSurface variant="strong" style={{ marginTop: 18 }} contentStyle={styles.heroCard}>
          <Text style={[styles.kicker, { color: palette.accent }]}>KAWARP / PINK EDITION</Text>
          <Text style={[styles.heroTitle, { color: palette.text }]}>Живые обои —{`\n`}без лишних шагов.</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>Текстура, цвет, движение и слои в одном локальном draft.</Text>
          <Pressable onPress={() => router.push("/projects")} style={[styles.primary, { backgroundColor: palette.accent }]}><Text style={{ color: palette.page, fontWeight: "900", fontSize: 11 }}>ОТКРЫТЬ РЕДАКТОР</Text></Pressable>
        </GlassSurface>
        <View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle, { color: palette.text }]}>Быстрый обзор</Text><Text style={[styles.subtitle, { color: palette.muted }]}>Ваше локальное рабочее пространство</Text></View><Text style={[styles.kicker, { color: palette.accent }]}>{projects.length} PROJECTS</Text></View>
        <View style={styles.stats}><GlassSurface variant="card" style={styles.stat}><Text style={[styles.statValue, { color: palette.text }]}>{projects.length}</Text><Text style={[styles.statLabel, { color: palette.muted }]}>DRAFTS</Text></GlassSurface><GlassSurface variant="card" style={styles.stat}><Text style={[styles.statValue, { color: palette.text }]}>{latest?.canvas.device ?? "iPhone 16"}</Text><Text style={[styles.statLabel, { color: palette.muted }]}>CANVAS</Text></GlassSurface><GlassSurface variant="card" style={styles.stat}><Text style={[styles.statValue, { color: palette.text }]}>12s</Text><Text style={[styles.statLabel, { color: palette.muted }]}>LIMIT</Text></GlassSurface></View>
        <Pressable onPress={() => router.push("/projects")}><GlassSurface style={{ marginTop: 10 }}><View style={styles.recent}><View style={{ flex: 1 }}><Text style={[styles.kicker, { color: palette.accent }]}>CONTINUE EDITING</Text><Text style={[styles.recentTitle, { color: palette.text }]}>{latest?.name ?? "Новый draft"}</Text><Text style={[styles.subtitle, { color: palette.muted }]}>background + image layers · {appTheme.toUpperCase()} theme</Text></View><Text style={{ color: palette.accent, fontSize: 27 }}>→</Text></View></GlassSurface></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 20 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.7 }, headingRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 7 }, title: { fontSize: 34, fontWeight: "900", letterSpacing: -1.2 }, subtitle: { fontSize: 13, lineHeight: 19, marginTop: 5 }, play: { width: 42, height: 42, borderWidth: 1, borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 5 }, heroCard: { padding: 18 }, kicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1.3 }, heroTitle: { fontSize: 24, fontWeight: "900", lineHeight: 28, marginTop: 7 }, primary: { alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginTop: 15 }, sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 25, marginBottom: 10 }, sectionTitle: { fontSize: 19, fontWeight: "900" }, stats: { flexDirection: "row", gap: 8 }, stat: { flex: 1 }, statValue: { fontSize: 16, fontWeight: "900" }, statLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.6, marginTop: 5 }, recent: { flexDirection: "row", alignItems: "center", padding: 2 }, recentTitle: { fontSize: 16, fontWeight: "900", marginTop: 4 } });

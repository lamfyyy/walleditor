import { useEffect, useState } from "react";
import { Animated, Image, ImageSourcePropType, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { useAppTheme } from "@/lib/theme-provider";
import type { Layer, Project } from "@/lib/walleditor/model";
import { KawarpBackground } from "./KawarpBackground";

const asset1 = require("@/assets/walleditor/asset1.png") as ImageSourcePropType;
const asset2 = require("@/assets/walleditor/asset2.png") as ImageSourcePropType;

const assetFor = (asset: Layer["asset"]) => asset === "asset1" ? asset1 : asset2;

type CanvasPreviewProps = {
  project: Project;
  playing: boolean;
  selectedLayerId?: string;
  onSelectLayer?: (id: string) => void;
};

export function CanvasPreview({ project, playing, selectedLayerId, onSelectLayer }: CanvasPreviewProps) {
  const { width } = useWindowDimensions();
  const { appTheme, palette } = useAppTheme();
  const canvasWidth = Math.min(Math.max(width - 36, 280), 390);
  const canvasHeight = canvasWidth * (project.canvas.height / project.canvas.width);
  const [float] = useState(() => new Animated.Value(0));

  useEffect(() => {
    float.stopAnimation();
    float.setValue(0);
    if (!playing) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [float, playing]);

  const selectedLift = float.interpolate({ inputRange: [0, 1], outputRange: [0, -1] });
  return (
    <View style={[styles.shell, { width: canvasWidth, height: canvasHeight, borderColor: palette.border, backgroundColor: palette.card }]}>
      <KawarpBackground settings={project.kawarp} playing={playing} enabled={appTheme === "kawarp"} style={StyleSheet.absoluteFill}>
        {project.layers.filter((layer) => layer.visible && layer.asset !== "background").map((layer) => {
          const imageWidth = canvasWidth * (layer.asset === "asset1" ? 1.08 : 0.73) * layer.scale / 0.52;
          const imageHeight = canvasHeight * (layer.asset === "asset1" ? 0.68 : 0.38) * layer.scale / 0.52;
          const animatedY = layer.animation.enabled && playing ? float.interpolate({ inputRange: [0, 1], outputRange: [0, -layer.animation.amplitude] }) : selectedLift;
          const animatedRotate = layer.animation.enabled && playing ? float.interpolate({ inputRange: [0, 1], outputRange: [0, layer.asset === "asset1" ? -2 : 1] }) : "0deg";
          return (
            <Pressable key={layer.id} disabled={!onSelectLayer} onPress={() => onSelectLayer?.(layer.id)}>
              <Animated.View style={[styles.layer, { width: imageWidth, height: imageHeight, left: canvasWidth * layer.x, top: canvasHeight * layer.y, opacity: layer.opacity, transform: [{ translateY: animatedY }, { rotate: animatedRotate }] }]}>
                <Image source={assetFor(layer.asset)} resizeMode="contain" style={StyleSheet.absoluteFill} />
                {selectedLayerId === layer.id && <View pointerEvents="none" style={[styles.selection, { borderColor: palette.accent }]} />}
              </Animated.View>
            </Pressable>
          );
        })}
        <View pointerEvents="none" style={styles.lockMockup}>
          <Text style={styles.lockTime}>09:41</Text>
          <Text style={styles.lockDate}>SATURDAY 21 NOVEMBER</Text>
          <View style={styles.widgetRow}><View style={styles.widget}><Text style={styles.widgetText}>WEATHER</Text><Text style={styles.widgetValue}>18°</Text></View><View style={styles.widget}><Text style={styles.widgetText}>CALENDAR</Text><Text style={styles.widgetValue}>2</Text></View></View>
        </View>
        <View pointerEvents="none" style={[styles.badge, { backgroundColor: palette.panelStrong, borderColor: palette.border }]}><Text style={{ color: palette.text, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }}>LOCK SCREEN MOCKUP</Text></View>
      </KawarpBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { alignSelf: "center", overflow: "hidden", borderWidth: 1, borderRadius: 28, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  layer: { position: "absolute" },
  selection: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderWidth: 2, borderRadius: 14 },
  lockMockup: { position: "absolute", top: 22, left: 0, right: 0, alignItems: "center" },
  lockTime: { color: "rgba(255,255,255,0.94)", fontSize: 34, fontWeight: "300", letterSpacing: -1 },
  lockDate: { color: "rgba(255,255,255,0.76)", fontSize: 7, fontWeight: "800", letterSpacing: 1.2, marginTop: 1 },
  widgetRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  widget: { backgroundColor: "rgba(0,0,0,0.22)", borderColor: "rgba(255,255,255,0.26)", borderWidth: 1, borderRadius: 10, padding: 7, width: 52 },
  widgetText: { color: "rgba(255,255,255,0.75)", fontSize: 5, fontWeight: "800" },
  widgetValue: { color: "white", fontSize: 13, fontWeight: "800", marginTop: 3 },
  badge: { position: "absolute", bottom: 12, left: 12, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
});

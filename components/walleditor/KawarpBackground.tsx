import { useEffect, useState } from "react";
import { Animated, ImageSourcePropType, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import type { KawarpSettings } from "@/lib/walleditor/model";

const background = require("@/assets/walleditor/background.png") as ImageSourcePropType;

type KawarpBackgroundProps = {
  settings: KawarpSettings;
  playing: boolean;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function KawarpBackground({ settings, playing, enabled = true, style, children }: KawarpBackgroundProps) {
  const [motion] = useState(() => new Animated.Value(0));
  useEffect(() => {
    motion.stopAnimation();
    motion.setValue(0);
    if (!playing || (!settings.animateColors && !settings.animateTexture)) return;
    const duration = Math.max(1100, 4200 / Math.max(settings.speed, 0.1));
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(motion, { toValue: 0, duration, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [motion, playing, settings.animateColors, settings.animateTexture, settings.speed]);

  const shift = settings.animateTexture && playing ? settings.pan : 0;
  const zoom = settings.animateTexture && playing ? settings.zoom : 0;
  const translateX = motion.interpolate({ inputRange: [0, 1], outputRange: [-shift, shift] });
  const translateY = motion.interpolate({ inputRange: [0, 1], outputRange: [shift * 0.3, -shift * 0.3] });
  const scale = motion.interpolate({ inputRange: [0, 1], outputRange: [1 + zoom * 0.35, 1 + zoom] });
  const colorOpacity = motion.interpolate({ inputRange: [0, 1], outputRange: [settings.intensity, settings.intensity * 0.72] });
  const secondOpacity = motion.interpolate({ inputRange: [0, 1], outputRange: [settings.intensity * 0.22, settings.intensity] });

  return (
    <View style={[styles.root, { backgroundColor: enabled ? settings.primaryColor : "#EDEDED" }, style]}>
      <Animated.Image source={background} resizeMode="cover" style={[StyleSheet.absoluteFill, { transform: [{ translateX }, { translateY }, { scale }] }]} />
      {enabled && <>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: settings.primaryColor, opacity: colorOpacity }]} />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: settings.secondaryColor, opacity: secondOpacity }]} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: settings.accentColor, opacity: 0.035 }]} />
      </>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { overflow: "hidden" } });

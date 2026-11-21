import React from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from './hooks';

/** Liquid Glass — постоянная основа интерфейса. На iOS 26 нативный GlassView; иначе (старый iOS) — BlurView. Отключить нельзя. */
export function GlassSurface({ children, style, radius = 22, interactive = false }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; radius?: number; interactive?: boolean }) {
  const th = useTheme();
  const native = isLiquidGlassAvailable();
  const box: ViewStyle = { borderRadius: radius, overflow: 'hidden' };
  if (native) {
    return <GlassView glassEffectStyle="regular" isInteractive={interactive} tintColor={th.glassTint} style={[box, style]}>{children}</GlassView>;
  }
  return (
    <View style={[box, { borderWidth: StyleSheet.hairlineWidth, borderColor: th.border }, style]}>
      <BlurView intensity={60} tint={th.scheme} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: th.glassTint }]} />
      {children}
    </View>
  );
}

export function GlassButton({ label, onPress, icon, active, danger, small, disabled }: { label?: string; icon?: string; onPress: () => void; active?: boolean; danger?: boolean; small?: boolean; disabled?: boolean }) {
  const th = useTheme();
  return (
    <Pressable disabled={disabled} onPress={() => { Haptics.selectionAsync(); onPress(); }} style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}>
      <GlassSurface radius={small ? 14 : 18} interactive style={{ paddingHorizontal: small ? 10 : 14, paddingVertical: small ? 6 : 10, borderWidth: active ? 1.5 : 0, borderColor: th.accent }}>
        <Text style={{ color: danger ? th.danger : active ? th.accent : th.text, fontWeight: '600', fontSize: small ? 12 : 14, textAlign: 'center' }}>{icon ? icon + (label ? ' ' : '') : ''}{label}</Text>
      </GlassSurface>
    </Pressable>
  );
}

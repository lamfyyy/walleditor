import React, { useRef, useState } from 'react';
import { PanResponder, View, Text, StyleSheet } from 'react-native';
import { useTheme } from './hooks';

interface P { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; onEnd?: () => void; label?: string; format?: (v: number) => string }

export function Slider({ value, min, max, step = 0, onChange, onEnd, label, format }: P) {
  const th = useTheme();
  const [w, setW] = useState(1);
  const ref = useRef({ w: 1, min, max, step, onChange, onEnd });
  ref.current = { w, min, max, step, onChange, onEnd };
  const calc = (x: number) => {
    const c = ref.current; let v = c.min + Math.max(0, Math.min(1, x / c.w)) * (c.max - c.min);
    if (c.step) v = Math.round(v / c.step) * c.step;
    return v;
  };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => ref.current.onChange(calc(e.nativeEvent.locationX)),
    onPanResponderMove: (e) => ref.current.onChange(calc(e.nativeEvent.locationX)),
    onPanResponderRelease: () => ref.current.onEnd?.(), onPanResponderTerminate: () => ref.current.onEnd?.()
  })).current;
  const f = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  return (
    <View style={{ marginVertical: 6 }}>
      {label ? <View style={s.row}><Text style={{ color: th.subtext, fontSize: 12 }}>{label}</Text><Text style={{ color: th.text, fontSize: 12 }}>{format ? format(value) : Math.round(value * 100) / 100}</Text></View> : null}
      <View style={s.hit} onLayout={(e) => setW(e.nativeEvent.layout.width)} {...pan.panHandlers}>
        <View style={[s.track, { backgroundColor: th.border }]} pointerEvents="none">
          <View style={{ width: `${f * 100}%`, height: 4, backgroundColor: th.accent, borderRadius: 2 }} />
        </View>
        <View pointerEvents="none" style={[s.knob, { left: f * w - 11, backgroundColor: '#fff', borderColor: th.border }]} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  hit: { height: 30, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  knob: { position: 'absolute', width: 22, height: 22, borderRadius: 11, borderWidth: 1, top: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }
});

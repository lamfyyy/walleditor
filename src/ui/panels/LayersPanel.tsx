import React from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useStore } from '../../state/store';
import { useTheme, useT } from '../hooks';
import { GlassButton, GlassSurface } from '../Glass';
import { layerSource } from '../../state/assets';
import { pickAndAdd, addText, addShape } from '../../state/addLayer';

export function LayersPanel() {
  const th = useTheme(); const t = useT();
  const { hist, selection, select, patchLayer, removeLayer, duplicateLayer, moveLayer } = useStore();
  const p = hist!.present;
  const layers = [...p.layers].reverse(); // сверху — верхний слой
  const rename = (id: string, cur: string) => Alert.prompt?.(t('layerName'), undefined, (n) => n && patchLayer(id, 'Переименовать', { name: n }), 'plain-text', cur);
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
        <GlassButton small label={t('background')} onPress={() => pickAndAdd('background')} />
        <GlassButton small label={t('image')} onPress={() => pickAndAdd('image')} />
        <GlassButton small label={t('video')} onPress={() => pickAndAdd('video')} />
        <GlassButton small label={t('text')} onPress={addText} />
        <GlassButton small label="▭" onPress={() => addShape('rect')} />
        <GlassButton small label="▢" onPress={() => addShape('roundRect')} />
        <GlassButton small label="◯" onPress={() => addShape('ellipse')} />
      </ScrollView>
      {layers.map((l) => {
        const src = layerSource(l, p.id);
        return (
          <Pressable key={l.id} onPress={() => select(l.id)} onLongPress={() => rename(l.id, l.name)}>
            <GlassSurface radius={14} style={{ marginBottom: 6, padding: 8, borderWidth: selection === l.id ? 1.5 : 0, borderColor: th.accent, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', backgroundColor: l.kind === 'shape' ? l.fill : '#3334', alignItems: 'center', justifyContent: 'center' }}>
                {src ? <Image source={src as any} style={{ width: 36, height: 36 }} contentFit="cover" /> : <Text style={{ color: th.text }}>{l.kind === 'text' ? 'T' : l.kind === 'video' ? '▶' : ''}</Text>}
              </View>
              <Text numberOfLines={1} style={{ color: th.text, flex: 1, opacity: l.visible ? 1 : 0.4 }}>{l.name}</Text>
              <GlassButton small label={l.visible ? '👁' : '—'} onPress={() => patchLayer(l.id, 'Видимость', { visible: !l.visible })} />
              <GlassButton small label={l.locked ? '🔒' : '🔓'} onPress={() => patchLayer(l.id, 'Блокировка', { locked: !l.locked })} />
              <GlassButton small label="↑" onPress={() => moveLayer(l.id, 1)} />
              <GlassButton small label="↓" onPress={() => moveLayer(l.id, -1)} />
              <GlassButton small label="⧉" onPress={() => duplicateLayer(l.id)} />
              <GlassButton small danger label="✕" onPress={() => removeLayer(l.id)} />
            </GlassSurface>
          </Pressable>
        );
      })}
      {layers.length === 0 && <Text style={{ color: th.subtext, textAlign: 'center', padding: 20 }}>{t('empty')}</Text>}
    </View>
  );
}

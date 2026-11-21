import React from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useStore } from '../../state/store';
import { useTheme, useT } from '../hooks';
import { GlassButton, GlassSurface } from '../Glass';
import { Slider } from '../Slider';
import { pixelSize } from '../../core/devices';
import { alignLayer, fitLayer, AlignMode, FitMode } from '../../core/arrange';

const COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#FF9F0A', '#FFD60A', '#30D158', '#0A84FF', '#BF5AF2'];

export function Inspector() {
  const th = useTheme(); const t = useT();
  const { hist, selection, patchLayer, preview, endPreview } = useStore();
  const p = hist!.present; const l = p.layers.find((x) => x.id === selection);
  if (!l) return <Text style={{ color: th.subtext, textAlign: 'center', padding: 20 }}>{t('empty')}</Text>;
  const { w: W, h: H } = pixelSize(p.profile);
  const sl = (label: string, key: 'x' | 'y' | 'scale' | 'rotation' | 'opacity', min: number, max: number, step = 0, fmt?: (v: number) => string) => (
    <Slider label={label} value={l[key] as number} min={min} max={max} step={step} format={fmt}
      onChange={(v) => preview(l.id, { [key]: v } as any)} onEnd={() => endPreview(label)} />
  );
  const crop = l.crop ?? { x: 0, y: 0, w: 1, h: 1 };
  const setCrop = (c: Partial<typeof crop>) => preview(l.id, { crop: { ...crop, ...c } });
  return (
    <View>
      <TextInput value={l.name} onChangeText={(n) => patchLayer(l.id, 'Переименовать', { name: n })} placeholder={t('layerName')} placeholderTextColor={th.subtext}
        style={{ color: th.text, fontSize: 16, fontWeight: '700', paddingVertical: 6 }} />
      {sl(t('position') + ' X', 'x', -W, W * 2, 1, (v) => Math.round(v) + ' px')}
      {sl(t('position') + ' Y', 'y', -H, H * 2, 1, (v) => Math.round(v) + ' px')}
      <Text style={{ color: th.subtext, fontSize: 12 }}>{t('size')}: {Math.round(l.w * l.scale)} × {Math.round(l.h * l.scale)} px</Text>
      {sl(t('scale'), 'scale', 0.1, 4, 0.01, (v) => v.toFixed(2) + '×')}
      {sl(t('rotation'), 'rotation', -180, 180, 1, (v) => Math.round(v) + '°')}
      {sl(t('opacity'), 'opacity', 0, 1, 0.01, (v) => Math.round(v * 100) + '%')}

      {(l.kind === 'image' || l.kind === 'background') && (
        <GlassSurface radius={14} style={{ padding: 10, marginTop: 8 }}>
          <Text style={{ color: th.text, fontWeight: '600' }}>{t('crop')}</Text>
          <Slider label="x" value={crop.x} min={0} max={0.9} step={0.005} onChange={(v) => setCrop({ x: v, w: Math.min(crop.w, 1 - v) })} onEnd={() => endPreview(t('crop'))} />
          <Slider label="y" value={crop.y} min={0} max={0.9} step={0.005} onChange={(v) => setCrop({ y: v, h: Math.min(crop.h, 1 - v) })} onEnd={() => endPreview(t('crop'))} />
          <Slider label="w" value={crop.w} min={0.1} max={1 - crop.x} step={0.005} onChange={(v) => setCrop({ w: v })} onEnd={() => endPreview(t('crop'))} />
          <Slider label="h" value={crop.h} min={0.1} max={1 - crop.y} step={0.005} onChange={(v) => setCrop({ h: v })} onEnd={() => endPreview(t('crop'))} />
        </GlassSurface>
      )}
      {l.kind === 'video' && l.videoDuration ? (
        <GlassSurface radius={14} style={{ padding: 10, marginTop: 8 }}>
          <Text style={{ color: th.text, fontWeight: '600' }}>{t('trim')} (≤ 12 с)</Text>
          <Slider label="start" value={l.videoTrim?.start ?? 0} min={0} max={l.videoDuration} step={0.1} format={(v) => v.toFixed(1) + ' с'}
            onChange={(v) => preview(l.id, { videoTrim: { start: v, end: Math.min(l.videoDuration!, Math.max(v + 0.2, l.videoTrim?.end ?? l.videoDuration!), v + 12) } })} onEnd={() => endPreview(t('trim'))} />
          <Slider label="end" value={l.videoTrim?.end ?? l.videoDuration} min={0.2} max={l.videoDuration} step={0.1} format={(v) => v.toFixed(1) + ' с'}
            onChange={(v) => preview(l.id, { videoTrim: { start: Math.min(l.videoTrim?.start ?? 0, v - 0.2), end: v } })} onEnd={() => endPreview(t('trim'))} />
        </GlassSurface>
      ) : null}
      {l.kind === 'text' && (
        <View style={{ marginTop: 8 }}>
          <TextInput value={l.text} onChangeText={(x) => patchLayer(l.id, t('content'), { text: x })} multiline style={{ color: th.text, borderWidth: 1, borderColor: th.border, borderRadius: 10, padding: 8 }} />
          <Slider label={t('fontSize')} value={l.fontSize ?? 48} min={16} max={400} step={1} onChange={(v) => preview(l.id, { fontSize: v })} onEnd={() => endPreview(t('fontSize'))} />
        </View>
      )}
      {(l.kind === 'text' || l.kind === 'shape') && (
        <ScrollView horizontal contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          {COLORS.map((c) => (
            <GlassButton key={c} small label={'●'} onPress={() => patchLayer(l.id, t('color'), l.kind === 'text' ? { color: c } : { fill: c })} />
          ))}
        </ScrollView>
      )}
      <Text style={{ color: th.text, fontWeight: '600', marginTop: 10 }}>{t('align')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 6 }}>
        {([['left', '⇤'], ['hcenter', '↔'], ['right', '⇥'], ['top', '⤒'], ['vcenter', '↕'], ['bottom', '⤓'], ['safeTop', 'safe↑'], ['safeBottom', 'safe↓']] as [AlignMode, string][]).map(([m, ic]) => (
          <GlassButton key={m} small label={ic} onPress={() => patchLayer(l.id, t('align'), alignLayer(l, W, H, m, p.profile))} />
        ))}
      </ScrollView>
      {(l.kind === 'image' || l.kind === 'background') && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          {(['contain', 'cover', 'stretch'] as FitMode[]).map((m) => <GlassButton key={m} small label={t(m)} onPress={() => patchLayer(l.id, t('fit'), fitLayer(l, W, H, m))} />)}
        </View>
      )}
      <View style={{ marginTop: 8 }}>
        <GlassButton label={t('reset')} onPress={() => patchLayer(l.id, t('reset'), { scale: 1, rotation: 0, opacity: 1, crop: undefined })} />
      </View>
    </View>
  );
}

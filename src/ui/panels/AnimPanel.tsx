import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useStore } from '../../state/store';
import { useTheme, useT } from '../hooks';
import { GlassButton, GlassSurface } from '../Glass';
import { Slider } from '../Slider';
import { PRESETS, PROP_LABEL, PROP_RANGE, loopSeamError } from '../../core/anim';
import { makeSeamless } from '../../core/arrange';
import type { AnimProp, LayerAnimation, AnimTrack } from '../../core/types';

export function AnimPanel() {
  const th = useTheme(); const t = useT();
  const { hist, selection, patchLayer, copyAnim, pasteAnim, clipAnim } = useStore();
  const p = hist!.present; const l = p.layers.find((x) => x.id === selection);
  if (!l) return <Text style={{ color: th.subtext, textAlign: 'center', padding: 20 }}>{t('empty')}</Text>;
  const a = l.animation;
  const set = (n: Partial<LayerAnimation>, label = t('animation')) => patchLayer(l.id, label, { animation: { ...a, ...n } });
  const setTrack = (i: number, tr: AnimTrack) => set({ tracks: a.tracks.map((x, j) => (j === i ? tr : x)) });
  const seam = loopSeamError(a);
  const addTrack = (prop: AnimProp) => {
    if (a.tracks.some((x) => x.prop === prop)) return;
    const base = prop === 'scale' || prop === 'opacity' ? 1 : 0;
    set({ enabled: true, tracks: [...a.tracks, { prop, keys: [{ t: 0, v: base }, { t: 1, v: base }] }] });
  };
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <GlassButton small active={a.enabled} label={a.enabled ? 'ON' : 'OFF'} onPress={() => set({ enabled: !a.enabled })} />
        <GlassButton small active={a.loop} label={t('loop')} onPress={() => set({ loop: !a.loop })} />
        <GlassButton small active={a.autoreverse} label={t('autoreverse')} onPress={() => set({ autoreverse: !a.autoreverse })} />
        <GlassButton small label={t('copyAnim')} onPress={() => copyAnim(l.id)} />
        <GlassButton small disabled={!clipAnim} label={t('pasteAnim')} onPress={() => pasteAnim(l.id)} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
        {PRESETS.map((pr) => <GlassButton key={pr.id} small label={pr.label} onPress={() => set(pr.make(40), pr.label)} />)}
      </ScrollView>
      <Slider label={t('duration')} value={a.duration} min={0.5} max={12} step={0.1} format={(v) => v.toFixed(1) + ' с'}
        onChange={(v) => useStore.getState().preview(l.id, { animation: { ...a, duration: v } })} onEnd={() => useStore.getState().endPreview(t('duration'))} />
      {seam.length > 0 && !a.autoreverse && <Text style={{ color: '#FF9F0A', fontSize: 12 }}>⚠ Стык цикла не бесшовный: {seam.map((s) => PROP_LABEL[s.prop as AnimProp]).join(', ')}. Сделайте последний ключ равным первому или включите «Туда-обратно».</Text>}
      {seam.length > 0 && !a.autoreverse && <GlassButton small label={t('makeSeamless')} onPress={() => patchLayer(l.id, t('makeSeamless'), { animation: makeSeamless(a) })} />}
      {a.tracks.map((tr, i) => {
        const [mn, mx] = PROP_RANGE[tr.prop];
        return (
          <GlassSurface key={tr.prop} radius={14} style={{ padding: 10, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: th.text, fontWeight: '700' }}>{PROP_LABEL[tr.prop]}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <GlassButton small label="＋ key" onPress={() => { const k = [...tr.keys]; const last = k[k.length - 1]; k.splice(k.length - 1, 0, { t: (k[k.length - 2].t + last.t) / 2, v: k[k.length - 2].v }); setTrack(i, { ...tr, keys: k }); }} />
                <GlassButton small danger label="✕" onPress={() => set({ tracks: a.tracks.filter((_, j) => j !== i) })} />
              </View>
            </View>
            {tr.keys.map((k, ki) => (
              <View key={ki}>
                <Slider label={`${Math.round(k.t * 100)}%`} value={k.v} min={mn} max={mx} step={(mx - mn) / 400} format={(v) => v.toFixed(2)}
                  onChange={(v) => useStore.getState().preview(l.id, { animation: { ...a, tracks: a.tracks.map((x, j) => (j === i ? { ...tr, keys: tr.keys.map((kk, q) => (q === ki ? { ...kk, v } : kk)) } : x)) } })}
                  onEnd={() => useStore.getState().endPreview(t('animation'))} />
                {ki > 0 && ki < tr.keys.length - 1 && <Slider label="t" value={k.t} min={tr.keys[ki - 1].t + 0.01} max={tr.keys[ki + 1].t - 0.01} step={0.01}
                  onChange={(v) => useStore.getState().preview(l.id, { animation: { ...a, tracks: a.tracks.map((x, j) => (j === i ? { ...tr, keys: tr.keys.map((kk, q) => (q === ki ? { ...kk, t: v } : kk)) } : x)) } })}
                  onEnd={() => useStore.getState().endPreview(t('animation'))} />}
              </View>
            ))}
          </GlassSurface>
        );
      })}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: 10 }}>
        {(Object.keys(PROP_LABEL) as AnimProp[]).map((pp) => <GlassButton key={pp} small label={'＋ ' + PROP_LABEL[pp]} disabled={a.tracks.some((x) => x.prop === pp)} onPress={() => addTrack(pp)} />)}
      </ScrollView>
    </View>
  );
}

import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useStore } from '../../state/store';
import { useTheme, useT } from '../hooks';
import { GlassButton } from '../Glass';
import { Slider } from '../Slider';
import { DEVICE_PROFILES } from '../../core/devices';

export function CanvasPanel({ lockscreen, setLockscreen }: { lockscreen: boolean; setLockscreen: (b: boolean) => void }) {
  const th = useTheme(); const t = useT();
  const { hist, mutate, setProfile, settings, undo, redo } = useStore();
  const p = hist!.present;
  const toggle = (k: 'grid' | 'guides' | 'snap') => mutate(k, (pr) => ({ ...pr, settings: { ...pr.settings, [k]: !pr.settings[k] } }));
  const all = [...DEVICE_PROFILES, ...settings.customProfiles];
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <GlassButton small active={p.settings.grid} label={t('grid')} onPress={() => toggle('grid')} />
        <GlassButton small active={p.settings.guides} label={t('guides')} onPress={() => toggle('guides')} />
        <GlassButton small active={p.settings.snap} label={t('snap')} onPress={() => toggle('snap')} />
        <GlassButton small active={lockscreen} label={t('lockscreen')} onPress={() => setLockscreen(!lockscreen)} />
      </View>
      {lockscreen && <Text style={{ color: '#FF9F0A', fontSize: 12 }}>{t('lockscreenNote')}</Text>}
      <Slider label="Grid" value={p.settings.gridStep} min={20} max={200} step={10} onChange={(v) => mutate('grid', (pr) => ({ ...pr, settings: { ...pr.settings, gridStep: v } }))} />
      <Text style={{ color: th.text, fontWeight: '700', marginVertical: 6 }}>{t('device')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {all.map((d) => (
          <View key={d.id} style={{ flexDirection: 'row', gap: 2 }}>
            <GlassButton small active={p.profile.id === d.id} label={d.name} onPress={() => setProfile(d)} />
            {d.custom && <GlassButton small danger label="✕" onPress={() => useStore.getState().setSettings({ customProfiles: settings.customProfiles.filter((x) => x.id !== d.id) })} />}
          </View>
        ))}
      </ScrollView>
      <View style={{ marginTop: 6 }}>
        <GlassButton small label={t('saveTemplate')} onPress={() => Alert.prompt?.(t('templateName'), undefined, (name) => {
          if (!name) return;
          const tpl = { ...p.profile, id: 'custom-' + Date.now(), name, custom: true };
          useStore.getState().setSettings({ customProfiles: [...settings.customProfiles, tpl] });
        }, 'plain-text', p.profile.name)} />
      </View>
      <Text style={{ color: th.subtext, fontSize: 12, marginTop: 6 }}>{p.profile.pointsW}×{p.profile.pointsH} pt @{p.profile.scale}x = {p.profile.pointsW * p.profile.scale}×{p.profile.pointsH * p.profile.scale} px</Text>
      <Text style={{ color: th.text, fontWeight: '700', marginTop: 12 }}>{t('history')}</Text>
      <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
        <GlassButton small disabled={!(hist!.past.length)} label={'↶ ' + t('undo')} onPress={undo} />
        <GlassButton small disabled={!(hist!.future.length)} label={'↷ ' + t('redo')} onPress={redo} />
      </View>
      {hist!.log.slice(0, 8).map((e, i) => <Text key={i} style={{ color: th.subtext, fontSize: 12 }}>• {e.label} · {new Date(e.at).toLocaleTimeString()}</Text>)}
    </View>
  );
}

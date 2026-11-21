import React, { useEffect, useState } from 'react';
import { View, Text, useWindowDimensions, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../src/state/store';
import { useTheme, useT, useClock } from '../src/ui/hooks';
import { GlassButton, GlassSurface } from '../src/ui/Glass';
import { CanvasView } from '../src/ui/CanvasView';
import { Slider } from '../src/ui/Slider';
import { LayersPanel } from '../src/ui/panels/LayersPanel';
import { Inspector } from '../src/ui/panels/Inspector';
import { AnimPanel } from '../src/ui/panels/AnimPanel';
import { CanvasPanel } from '../src/ui/panels/CanvasPanel';
import { pixelSize } from '../src/core/devices';
import type { Guide } from '../src/core/snap';

type Tab = 'layers' | 'inspector' | 'anim' | 'canvas';

export default function Editor() {
  const th = useTheme(); const t = useT(); const router = useRouter();
  const { id, layer } = useLocalSearchParams<{ id: string; layer?: string }>();
  const { hist, selection, select, preview, endPreview, save, dirty, savedAt, undo, redo, open, close } = useStore();
  const { width, height } = useWindowDimensions();
  const clock = useClock();
  const [tab, setTab] = useState<Tab>('layers');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [lock, setLock] = useState(false);

  useEffect(() => { if (!hist && id) open(id); }, [id]);
  useEffect(() => { if (layer) { select(layer); setTab('inspector'); } }, [layer]);
  if (!hist) return null;
  const p = hist.present;
  const { w: W, h: H } = pixelSize(p.profile);
  const cw = Math.min(width - 32, (height * 0.42) * (W / H));
  const maxDur = Math.max(2, ...p.layers.filter((l) => l.animation.enabled).map((l) => l.animation.duration * (l.animation.autoreverse ? 2 : 1)));
  const tabs: [Tab, string][] = [['layers', t('layers')], ['inspector', t('inspector')], ['anim', t('animation')], ['canvas', t('device')]];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 }}>
        <GlassButton small label="‹" onPress={async () => { await close(); router.back(); }} />
        <Text numberOfLines={1} style={{ color: th.text, fontWeight: '800', fontSize: 16, flex: 1 }}>{p.name}</Text>
        <GlassButton small disabled={!hist.past.length} label="↶" onPress={undo} />
        <GlassButton small disabled={!hist.future.length} label="↷" onPress={redo} />
        <GlassButton small label={dirty ? t('save') : '✓ ' + t('saved')} onPress={save} />
        <GlassButton small label={t('export')} onPress={async () => { await save(); router.push({ pathname: '/export', params: { id: p.id } }); }} />
      </View>

      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <CanvasView project={p} width={cw} t={clock.t} selection={selection} interactive onSelect={select}
          onDragLive={(lid, x, y) => preview(lid, { x, y })} onDragEnd={() => endPreview('Перемещение')}
          guides={guides} setGuides={setGuides} showOverlays lockscreen={lock} />
      </View>

      <GlassSurface radius={16} style={{ marginHorizontal: 12, marginTop: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <GlassButton small label={clock.playing ? '❚❚' : '▶'} onPress={clock.playing ? clock.pause : clock.play} />
          <GlassButton small label="⟲" onPress={clock.restart} />
          <GlassButton small label={t('loopStart')} onPress={() => { clock.pause(); clock.seek(0); }} />
          <GlassButton small label={t('loopEnd')} onPress={() => { clock.pause(); clock.seek(Math.max(0, maxDur - 0.001)); }} />
          <View style={{ flex: 1 }}><Slider value={clock.t % maxDur} min={0} max={maxDur} step={0.01} onChange={(v) => { clock.pause(); clock.seek(v); }} /></View>
        </View>
      </GlassSurface>

      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingTop: 8 }}>
        {tabs.map(([k, label]) => <View key={k} style={{ flex: 1 }}><GlassButton small active={tab === k} label={label} onPress={() => setTab(k)} /></View>)}
      </View>
      <ScrollView style={{ flex: 1, paddingHorizontal: 12, marginTop: 8 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {tab === 'layers' && <LayersPanel />}
        {tab === 'inspector' && <Inspector />}
        {tab === 'anim' && <AnimPanel />}
        {tab === 'canvas' && <CanvasPanel lockscreen={lock} setLockscreen={setLock} />}
      </ScrollView>
    </SafeAreaView>
  );
}

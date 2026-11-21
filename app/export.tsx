import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useStore } from '../src/state/store';
import { useTheme, useT } from '../src/ui/hooks';
import { GlassButton, GlassSurface } from '../src/ui/Glass';
import { Slider } from '../src/ui/Slider';
import { buildTendies, estimateSize, validateTendies, BuildResult } from '../src/core/tendies';
import { makeAssetSource } from '../src/state/assets';
import { loadTemplate } from '../src/state/storage';
import { guideSteps } from '../src/i18n';
import type { Issue } from '../src/core/types';

const mb = (b: number) => (b / 1048576).toFixed(1) + ' МБ';

export default function Export() {
  const th = useTheme(); const t = useT(); const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hist, setExport, select } = useStore();
  const [busy, setBusy] = useState(false); const [prog, setProg] = useState(''); const [res, setRes] = useState<BuildResult | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const p = hist?.present;
  const est = useMemo(() => (p ? estimateSize(p) : null), [p]);
  useEffect(() => { setRes(null); }, [p?.export, p?.layers]);
  if (!p || !est) return null;
  const lang = useStore.getState().lang();

  const suggestions: string[] = [];
  if (est.seconds > 12) suggestions.push('Длительность больше 12 с — сократите анимацию или обрежьте видео.');
  if (est.bytes > 60 * 1048576) suggestions.push('Большой размер: уменьшите разрешение видео или частоту кадров.');

  const build = async () => {
    setBusy(true); setIssues([]); setRes(null);
    try {
      const tpl = await loadTemplate(p.id);
      const r = await buildTendies(p, makeAssetSource(p.id), tpl, (m, d, tt) => setProg(`${m} ${d}/${tt}`));
      setRes(r); setIssues(r.issues);
    } catch (e: any) { Alert.alert('Ошибка', String(e?.message ?? e)); }
    setBusy(false);
  };
  const share = async () => {
    if (!res) return;
    const name = p.name.replace(/[^\p{L}\p{N}_-]+/gu, '_') || 'wallpaper';
    const f = new File(Paths.cache, name + '.tendies');
    if (f.exists) f.delete();
    f.create(); f.write(res.zip);
    await Sharing.shareAsync(f.uri, { UTI: 'public.data', mimeType: 'application/octet-stream', dialogTitle: name + '.tendies' });
  };
  const hasErr = issues.some((i) => i.level === 'error');
  const open = (i: Issue) => { if (i.layerId) { select(i.layerId); router.replace({ pathname: '/editor', params: { id: p.id, layer: i.layerId } }); } else router.back(); };
  const color = (l: Issue['level']) => (l === 'error' ? th.danger : l === 'warning' ? '#FF9F0A' : th.subtext);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
        <GlassButton small label="‹" onPress={() => router.back()} />
        <Text style={{ color: th.text, fontSize: 20, fontWeight: '800' }}>{t('exportTitle')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 60, gap: 10 }}>
        <GlassSurface style={{ padding: 12 }}>
          <Text style={{ color: th.text, fontWeight: '700' }}>{t('estimate')}</Text>
          <Text style={{ color: th.subtext }}>≈ {mb(est.bytes)} · {est.seconds.toFixed(1)} с · {est.frames} кадров</Text>
          {suggestions.map((s, i) => <Text key={i} style={{ color: '#FF9F0A', marginTop: 4 }}>⚠ {s}</Text>)}
          <Slider label={t('fps')} value={p.export.fps} min={5} max={30} step={1} onChange={(v) => setExport({ fps: v })} />
          <Slider label={t('resolution')} value={p.export.resolutionScale} min={0.25} max={1} step={0.05} format={(v) => Math.round(v * 100) + '%'} onChange={(v) => setExport({ resolutionScale: v })} />
          <Slider label={t('quality')} value={p.export.jpegQuality} min={0.3} max={0.9} step={0.05} onChange={(v) => setExport({ jpegQuality: v })} />
          <Text style={{ color: th.subtext, fontSize: 12, marginTop: 6 }}>{t('unverifiedNote')}</Text>
        </GlassSurface>

        <GlassButton label={busy ? t('validating') : t('build')} disabled={busy} onPress={build} />
        {busy && <View style={{ alignItems: 'center' }}><ActivityIndicator /><Text style={{ color: th.subtext, fontSize: 12 }}>{prog}</Text></View>}

        {res && (
          <GlassSurface style={{ padding: 12 }}>
            <Text style={{ color: th.text, fontWeight: '700' }}>{t('problems')} · {mb(res.bytes)}</Text>
            {issues.filter((i) => i.level === 'error').length === 0 && <Text style={{ color: th.subtext }}>{t('noProblems')}</Text>}
            {issues.map((i, k) => (
              <Pressable key={k} onPress={() => open(i)} style={{ paddingVertical: 4 }}>
                <Text style={{ color: color(i.level) }}>{i.level === 'error' ? '✗' : i.level === 'warning' ? '⚠' : 'ℹ'} {i.message}{i.layerId ? ' ›' : ''}</Text>
              </Pressable>
            ))}
            <View style={{ marginTop: 10 }}><GlassButton label={t('share')} disabled={hasErr} onPress={share} /></View>
          </GlassSurface>
        )}

        <GlassSurface style={{ padding: 12 }}>
          <Text style={{ color: th.text, fontWeight: '700', marginBottom: 6 }}>{t('guide')}</Text>
          {guideSteps(lang).map((s, i) => <Text key={i} style={{ color: th.text, marginBottom: 4 }}>{i + 1}. {s}</Text>)}
          <Text style={{ color: th.subtext, fontSize: 12, marginTop: 6 }}>{t('guideNote')}</Text>
        </GlassSurface>
      </ScrollView>
    </SafeAreaView>
  );
}

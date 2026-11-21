import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useStore } from '../src/state/store';
import { useTheme, useT } from '../src/ui/hooks';
import { GlassSurface, GlassButton } from '../src/ui/Glass';
import { CanvasView } from '../src/ui/CanvasView';
import { loadProject } from '../src/state/storage';
import type { Project, ProjectMeta } from '../src/core/types';
import { importTendiesFromUri } from '../src/state/importFlow';
import { shareBackup, restoreBackup } from '../src/state/backupFlow';

type Filter = 'all' | 'video' | 'anim' | 'demo';

function Card({ m, onOpen }: { m: ProjectMeta; onOpen: () => void }) {
  const th = useTheme(); const t = useT();
  const [p, setP] = useState<Project | null>(null);
  const { duplicate, remove, refresh } = useStore();
  useEffect(() => { loadProject(m.id).then(setP); }, [m.id, m.updatedAt]);
  const rename = () => Alert.prompt?.(t('rename'), undefined, async (name) => {
    if (!name || !p) return;
    const { saveProject } = await import('../src/state/storage');
    await saveProject({ ...p, name, updatedAt: Date.now() }); refresh();
  }, 'plain-text', m.name);
  return (
    <Pressable onPress={onOpen} onLongPress={rename} style={{ flex: 1, margin: 6 }}>
      <GlassSurface style={{ padding: 10 }}>
        <View style={{ alignItems: 'center' }}>{p ? <CanvasView project={p} width={110} t={0} /> : <View style={{ width: 110, height: 238 }} />}</View>
        <Text numberOfLines={1} style={{ color: th.text, fontWeight: '700', marginTop: 8 }}>{m.name}{m.isDemo ? ' · ' + t('demo') : ''}</Text>
        <Text style={{ color: th.subtext, fontSize: 11 }}>{t('modified')}: {new Date(m.updatedAt).toLocaleString()}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          <GlassButton small label={t('duplicate')} onPress={() => duplicate(m.id)} />
          <GlassButton small label="⇪" onPress={() => shareBackup(m.id).catch((e) => Alert.alert(t('backup'), String(e?.message ?? e)))} />
          <GlassButton small danger label="✕" onPress={() => Alert.alert(m.name, undefined, [{ text: t('cancel') }, { text: t('delete'), style: 'destructive', onPress: () => remove(m.id) }])} />
        </View>
      </GlassSurface>
    </Pressable>
  );
}

export default function Library() {
  const th = useTheme(); const t = useT(); const router = useRouter();
  const { library, create, open, resetDemo } = useStore();
  const [q, setQ] = useState(''); const [f, setF] = useState<Filter>('all');
  const list = useMemo(() => library.filter((m) =>
    m.name.toLowerCase().includes(q.toLowerCase()) &&
    (f === 'all' || (f === 'video' && m.hasVideo) || (f === 'anim' && m.hasAnimation) || (f === 'demo' && m.isDemo))), [library, q, f]);
  const go = async (id: string) => { if (await open(id)) router.push({ pathname: '/editor', params: { id } }); };
  const newProject = async () => { const p = await create(t('newProject')); go(p.id); };
  const importFile = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (r.canceled) return;
    try {
      const a = r.assets[0];
      if (/\.walleditor$/i.test(a.name)) {
        const b = await restoreBackup(a.uri);
        if (b.warnings.length) Alert.alert(t('importWarnings'), b.warnings.join('\n'));
        return;
      }
      const res = await importTendiesFromUri(a.uri, a.name);
      if (res.warnings.length) Alert.alert(t('importWarnings'), res.warnings.join('\n'));
      router.push({ pathname: '/editor', params: { id: res.id } });
    } catch (e: any) { Alert.alert('.tendies', String(e?.message ?? e)); }
  };
  const chips: [Filter, string][] = [['all', t('all')], ['video', t('withVideo')], ['anim', t('animated')], ['demo', t('demo')]];
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: th.text, fontSize: 30, fontWeight: '800' }}>walleditor</Text>
          <GlassButton small label={t('settings')} icon="⚙︎" onPress={() => router.push('/settings')} />
        </View>
        <GlassSurface radius={16} style={{ marginTop: 10 }}>
          <TextInput value={q} onChangeText={setQ} placeholder={t('search')} placeholderTextColor={th.subtext} style={{ color: th.text, padding: 12 }} />
        </GlassSurface>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }} contentContainerStyle={{ gap: 8 }}>
          {chips.map(([k, label]) => <GlassButton key={k} small active={f === k} label={label} onPress={() => setF(k)} />)}
        </ScrollView>
      </View>
      <FlatList data={list} numColumns={2} keyExtractor={(m) => m.id} contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 120 }}
        ListEmptyComponent={<Text style={{ color: th.subtext, textAlign: 'center', marginTop: 40 }}>{t('empty')}</Text>}
        renderItem={({ item }) => <Card m={item} onOpen={() => go(item.id)} />} />
      <View style={{ position: 'absolute', bottom: 24, left: 16, right: 16, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><GlassButton label={'＋ ' + t('newProject')} onPress={newProject} /></View>
        <View style={{ flex: 1 }}><GlassButton label={t('openTendies')} onPress={importFile} /></View>
        {!library.some((m) => m.isDemo) && <GlassButton label={t('demo')} onPress={resetDemo} />}
      </View>
    </SafeAreaView>
  );
}

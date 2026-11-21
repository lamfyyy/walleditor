import React from 'react';
import { View, Text, ScrollView, Linking, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../src/state/store';
import { useTheme, useT } from '../src/ui/hooks';
import { GlassButton, GlassSurface } from '../src/ui/Glass';
import { Slider } from '../src/ui/Slider';
import { THEMES, ThemeId } from '../src/theme/themes';
import { guideSteps } from '../src/i18n';

const PALETTES: string[][] = [
  ['#6C4DFF', '#FF4D9D', '#2EC5FF'], ['#FF8A00', '#FF2D55', '#7A00FF'], ['#00C9A7', '#0A84FF', '#B9A7FF'],
  ['#FFD60A', '#FF9F0A', '#FF375F'], ['#111111', '#444444', '#888888']
];

export default function Settings() {
  const th = useTheme(); const t = useT(); const router = useRouter();
  const { settings, setSettings } = useStore();
  const k = settings.kawarp;
  const lang = useStore.getState().lang();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
        <GlassButton small label="‹" onPress={() => router.back()} />
        <Text style={{ color: th.text, fontSize: 20, fontWeight: '800' }}>{t('settings')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 60 }}>
        <GlassSurface style={{ padding: 12 }}>
          <Text style={{ color: th.text, fontWeight: '700', marginBottom: 8 }}>{t('theme')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(Object.keys(THEMES) as ThemeId[]).map((id) => (
              <View key={id} style={{ flex: 1 }}><GlassButton active={settings.theme === id} label={THEMES[id].name[lang]} onPress={() => setSettings({ theme: id })} /></View>
            ))}
          </View>
          <Text style={{ color: th.subtext, fontSize: 12, marginTop: 8 }}>{t('glassAlways')}</Text>
        </GlassSurface>

        {settings.theme === 'kawarp' && (
          <GlassSurface style={{ padding: 12 }}>
            <Text style={{ color: th.text, fontWeight: '700', marginBottom: 8 }}>{t('kawarpColors')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {PALETTES.map((pal, i) => (
                <GlassButton key={i} small active={pal.join() === k.colors.join()} label={'●●●'} onPress={() => setSettings({ kawarp: { ...k, colors: pal } })} />
              ))}
            </View>
            <Text style={{ color: th.subtext, fontSize: 12, marginTop: 8 }}>{t('hexColor')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              {k.colors.map((c, i) => (
                <View key={i} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c }} />
                  <TextInput defaultValue={c} autoCapitalize="characters" maxLength={7} style={{ color: th.text, flex: 1, borderBottomWidth: 1, borderColor: th.border }}
                    onEndEditing={(e) => { const v = e.nativeEvent.text.trim(); if (/^#[0-9a-fA-F]{6}$/.test(v)) setSettings({ kawarp: { ...k, colors: k.colors.map((x, j) => (j === i ? v : x)) } }); }} />
                </View>
              ))}
            </View>
            <Slider label={t('brightness')} value={k.brightness} min={0.4} max={1.4} step={0.05} onChange={(v) => setSettings({ kawarp: { ...k, brightness: v } })} />
            <Slider label={t('intensity')} value={k.intensity} min={0.2} max={2} step={0.05} onChange={(v) => setSettings({ kawarp: { ...k, intensity: v } })} />
          </GlassSurface>
        )}

        <GlassSurface style={{ padding: 12 }}>
          <Text style={{ color: th.text, fontWeight: '700', marginBottom: 8 }}>{t('language')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['auto', 'ru', 'en'] as const).map((l) => <View key={l} style={{ flex: 1 }}><GlassButton active={settings.lang === l} label={l === 'auto' ? t('auto') : l.toUpperCase()} onPress={() => setSettings({ lang: l })} /></View>)}
          </View>
        </GlassSurface>

        <GlassSurface style={{ padding: 12 }}>
          <Text style={{ color: th.text, fontWeight: '700', marginBottom: 6 }}>{t('guide')}</Text>
          {guideSteps(lang).map((s, i) => <Text key={i} style={{ color: th.text, marginBottom: 4 }}>{i + 1}. {s}</Text>)}
          <Text style={{ color: th.subtext, fontSize: 12 }}>{t('guideNote')}</Text>
        </GlassSurface>

        <GlassSurface style={{ padding: 12 }}>
          <Text style={{ color: th.text, fontWeight: '700' }}>{t('about')}</Text>
          <Text style={{ color: th.text, marginTop: 6 }}>walleditor 1.0.0 · com.yxwwx.walleditor</Text>
          <Text style={{ color: th.subtext }}>{t('author')}: Даня Янти (yntheee/yxwwx)</Text>
          <Text style={{ color: th.subtext }}>{t('kawarpCredit')}</Text>
          <Text style={{ color: th.subtext, marginTop: 4 }}>Лицензия: AGPL-3.0-only</Text>
          <View style={{ marginTop: 8 }}><GlassButton small label="Kawarp" onPress={() => Linking.openURL('https://kawarp.vercel.app/')} /></View>
        </GlassSurface>
      </ScrollView>
    </SafeAreaView>
  );
}

import '../global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useStore } from '../src/state/store';
import { useTheme } from '../src/ui/hooks';
import { KawarpBackground } from '../src/ui/KawarpBackground';
import { importTendiesFromUri } from '../src/state/importFlow';

export default function Root() {
  const ready = useStore((s) => s.ready);
  const init = useStore((s) => s.init);
  const th = useTheme();
  const router = useRouter();
  const url = Linking.useURL();
  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (!ready || !url || !/\.tendies(\?|$)/i.test(url)) return;
    const name = decodeURIComponent(url.split('/').pop() ?? 'import.tendies');
    importTendiesFromUri(url, name).then((r) => router.push({ pathname: '/editor', params: { id: useStore.getState().hist!.present.id, warn: r.warnings.length ? '1' : '' } })).catch(() => {});
  }, [url, ready]);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: th.bg }}>
      <StatusBar style={th.scheme === 'dark' ? 'light' : 'dark'} />
      {th.id === 'kawarp' && <KawarpBackground />}
      {ready ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: th.id === 'kawarp' ? 'transparent' : th.bg }, animation: 'fade' }} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>
      )}
    </GestureHandlerRootView>
  );
}

import React, { useState, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { KAWARP_BUNDLE } from '../generated/kawarpBundle';
import { useStore } from '../state/store';

// Анимированный фон Kawarp (@kawarp/core, AGPL-3.0, автор — Better Lyrics) внутри WebView, полностью офлайн.
// Если WebGL/бандл недоступны — статичный вариант из тех же цветов.
function html(colors: string[], brightness: number, intensity: number) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:${colors[0]};overflow:hidden}canvas{width:100%;height:100%;display:block;filter:brightness(${brightness}) saturate(${0.6 + intensity * 0.6})}</style></head>
<body><canvas id="c"></canvas><script>${KAWARP_BUNDLE}</script><script>
(function(){try{
var L=window.KawarpLib||{};var K=L.Kawarp||L.default;if(!K)throw new Error('no Kawarp');
var c=document.getElementById('c');var k=new K(c);
var cols=${JSON.stringify(colors)};
if(typeof k.loadGradient==='function')k.loadGradient(cols);
else throw new Error('no loadGradient');
try{if(typeof k.setOptions==='function')k.setOptions({warpIntensity:${intensity}});}catch(e){}
if(typeof k.start==='function')k.start();
window.ReactNativeWebView.postMessage('ok');
}catch(e){window.ReactNativeWebView.postMessage('fail:'+e.message);}})();
</script></body></html>`;
}

export function StaticKawarp({ colors, brightness }: { colors: string[]; brightness: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors[0], opacity: Math.min(1, brightness) }]}>
      {colors.map((c, i) => (
        <View key={i} style={{ position: 'absolute', width: 420, height: 420, borderRadius: 210, backgroundColor: c, opacity: 0.8, left: i * 90 - 120, top: i * 260 - 40 }} />
      ))}
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
    </View>
  );
}

export function KawarpBackground() {
  const k = useStore((s) => s.settings.kawarp);
  const [failed, setFailed] = useState(!KAWARP_BUNDLE);
  const src = useMemo(() => ({ html: html(k.colors, k.brightness, k.intensity) }), [k.colors, k.brightness, k.intensity]);
  if (failed) return <StaticKawarp colors={k.colors} brightness={k.brightness} />;
  return (
    <WebView pointerEvents="none" style={StyleSheet.absoluteFill} originWhitelist={['*']} source={src} scrollEnabled={false}
      onMessage={(e) => { if (e.nativeEvent.data.startsWith('fail')) setFailed(true); }} onError={() => setFailed(true)} />
  );
}

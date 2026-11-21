import React, { useMemo, useRef } from 'react';
import { View, PanResponder, Text } from 'react-native';
import { Image } from 'expo-image';
import type { Project, Layer } from '../core/types';
import { pixelSize } from '../core/devices';
import { evalLayer } from '../core/anim';
import { snapMove, Guide } from '../core/snap';
import { layerSource } from '../state/assets';

interface Props {
  project: Project; width: number; t: number;
  selection?: string | null; interactive?: boolean;
  onSelect?: (id: string | null) => void;
  onDragLive?: (id: string, x: number, y: number) => void;
  onDragEnd?: () => void;
  guides?: Guide[]; setGuides?: (g: Guide[]) => void;
  showOverlays?: boolean; lockscreen?: boolean; clockText?: string;
}

function LayerNode({ l, k, project, pose, selected, interactive, others, W, H, onSelect, onDragLive, onDragEnd, setGuides }: any) {
  const st = useRef({ x0: 0, y0: 0 });
  const live = useRef({ l, k, project, others, W, H, onSelect, onDragLive, onDragEnd, setGuides, interactive });
  live.current = { l, k, project, others, W, H, onSelect, onDragLive, onDragEnd, setGuides, interactive };
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !!live.current.interactive,
    onMoveShouldSetPanResponder: () => !!live.current.interactive && !live.current.l.locked,
    onPanResponderGrant: () => { st.current = { x0: live.current.l.x, y0: live.current.l.y }; live.current.onSelect?.(live.current.l.id); },
    onPanResponderMove: (_, g) => {
      const c = live.current; if (c.l.locked) return;
      let x = st.current.x0 + g.dx / c.k, y = st.current.y0 + g.dy / c.k;
      if (c.project.settings.snap) {
        const r = snapMove(x, y, c.l.w * c.l.scale, c.l.h * c.l.scale, c.W, c.H, c.project.profile, c.others, 14 / c.k);
        x = r.x; y = r.y; c.setGuides?.(r.guides);
      }
      c.onDragLive?.(c.l.id, x, y);
    },
    onPanResponderRelease: () => { live.current.setGuides?.([]); live.current.onDragEnd?.(); },
    onPanResponderTerminate: () => { live.current.setGuides?.([]); live.current.onDragEnd?.(); }
  }), []);

  const w = l.w * l.scale * k, h = l.h * l.scale * k;
  const cx = (l.x + l.w / 2 + pose.dx) * k, cy = (l.y + l.h / 2 + pose.dy) * k;
  const src = layerSource(l, project.id);
  const crop = l.crop;
  const common = { position: 'absolute' as const, left: cx - w / 2, top: cy - h / 2, width: w, height: h, opacity: l.opacity * pose.opacity, transform: [{ rotate: `${l.rotation + pose.rotation}deg` }, { scale: pose.scale }] };
  let body: React.ReactNode = null;
  if (l.kind === 'text') body = <Text numberOfLines={4} style={{ color: l.color ?? '#fff', fontSize: (l.fontSize ?? 48) * l.scale * k, textAlign: 'center', fontWeight: '600' }}>{l.text}</Text>;
  else if (l.kind === 'shape') body = <View style={{ flex: 1, backgroundColor: l.fill ?? '#fff', borderRadius: l.shape === 'ellipse' ? 9999 : l.shape === 'roundRect' ? (l.cornerRadius ?? 24) * k : 0 }} />;
  else if (l.kind === 'video') body = <View style={{ flex: 1, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: Math.max(10, 16 * k * 3) }}>▶ {l.videoTrim ? (l.videoTrim.end - l.videoTrim.start).toFixed(1) + ' c' : ''}</Text></View>;
  else if (src) {
    const iw = crop ? w / crop.w : w, ih = crop ? h / crop.h : h;
    body = <View style={{ width: w, height: h, overflow: 'hidden' }}><Image source={src as any} contentFit="fill" style={{ position: 'absolute', width: iw, height: ih, left: crop ? -crop.x * iw : 0, top: crop ? -crop.y * ih : 0 }} /></View>;
  }
  return (
    <View {...pan.panHandlers} style={[common, selected && interactive ? { borderWidth: 1.5, borderColor: '#0A84FF' } : null]}>{body}</View>
  );
}

/** Единый рендер проекта: холст редактора, миниатюры библиотеки, макет Lock Screen. Время t — детерминированный предпросмотр анимаций. */
export function CanvasView({ project, width, t, selection, interactive, onSelect, onDragLive, onDragEnd, guides = [], setGuides, showOverlays, lockscreen, clockText }: Props) {
  const { w: W, h: H } = pixelSize(project.profile);
  const k = width / W; const height = H * k;
  const sc = project.profile.scale;
  return (
    <View style={{ width, height, backgroundColor: '#111', overflow: 'hidden', borderRadius: Math.max(6, 40 * k) }}>
      <View style={{ position: 'absolute', inset: 0 }} onTouchEnd={() => {}} />
      {project.layers.filter((l) => l.visible).map((l) => (
        <LayerNode key={l.id} l={l} k={k} project={project} pose={evalLayer(l, t)} selected={selection === l.id} interactive={interactive}
          others={project.layers.filter((o) => o.id !== l.id && o.visible)} W={W} H={H} onSelect={onSelect} onDragLive={onDragLive} onDragEnd={onDragEnd} setGuides={setGuides} />
      ))}
      {showOverlays && project.settings.grid && Array.from({ length: Math.floor(W / project.settings.gridStep) }, (_, i) => (
        <View key={'gx' + i} pointerEvents="none" style={{ position: 'absolute', left: (i + 1) * project.settings.gridStep * k, top: 0, bottom: 0, width: 0.5, backgroundColor: 'rgba(255,255,255,0.25)' }} />
      ))}
      {showOverlays && project.settings.grid && Array.from({ length: Math.floor(H / project.settings.gridStep) }, (_, i) => (
        <View key={'gy' + i} pointerEvents="none" style={{ position: 'absolute', top: (i + 1) * project.settings.gridStep * k, left: 0, right: 0, height: 0.5, backgroundColor: 'rgba(255,255,255,0.25)' }} />
      ))}
      {showOverlays && project.settings.guides && (
        <>
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: project.profile.safeTop * sc * k, height: 0.5, backgroundColor: 'rgba(255,214,10,0.6)' }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: project.profile.safeBottom * sc * k, height: 0.5, backgroundColor: 'rgba(255,214,10,0.6)' }} />
        </>
      )}
      {guides.map((g, i) => (
        <View key={'g' + i} pointerEvents="none" style={g.axis === 'x'
          ? { position: 'absolute', left: g.pos * k, top: 0, bottom: 0, width: 1, backgroundColor: '#FF2D55' }
          : { position: 'absolute', top: g.pos * k, left: 0, right: 0, height: 1, backgroundColor: '#FF2D55' }} />
      ))}
      {lockscreen && (
        // Визуальный макет. Позиции считаются от safe area профиля, а не зашиты; реальное положение часов определяет система.
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: (project.profile.safeTop + 24) * sc * k, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 * sc * k }}>Saturday, 21 November</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 86 * sc * k, fontWeight: '700', lineHeight: 92 * sc * k }}>{clockText ?? '9:41'}</Text>
        </View>
      )}
    </View>
  );
}

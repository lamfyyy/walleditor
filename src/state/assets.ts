import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import type { Layer } from '../core/types';
import type { AssetSource } from '../core/tendies';
import { fileUriFor } from './storage';

// Исходные файлы пользователя подключаются как есть (не изменяются, не перекодируются).
export const BUNDLED: Record<string, number> = {
  background: require('../../assets/walleditor/background.png'),
  asset1: require('../../assets/walleditor/asset1.png'),
  asset2: require('../../assets/walleditor/asset2.png')
};

/** Источник для <Image>: require-число для bundled или {uri} для файла проекта. */
export function layerSource(l: Layer, projectId: string): number | { uri: string } | undefined {
  if (!l.asset) return undefined;
  if (l.asset.startsWith('bundled:')) return BUNDLED[l.asset.slice(8)];
  return { uri: fileUriFor(projectId, l.asset) };
}

async function localUri(l: Layer, projectId: string): Promise<string> {
  if (l.asset?.startsWith('bundled:')) {
    const a = Asset.fromModule(BUNDLED[l.asset.slice(8)]);
    await a.downloadAsync();
    return a.localUri ?? a.uri;
  }
  return fileUriFor(projectId, l.asset!);
}

export function makeAssetSource(projectId: string): AssetSource {
  return {
    async getImage(l) {
      const uri = await localUri(l, projectId);
      const ctx = ImageManipulator.ImageManipulator.manipulate(uri);
      const W = l.assetW ?? 0, H = l.assetH ?? 0;
      if (l.crop && W && H) ctx.crop({ originX: Math.round(l.crop.x * W), originY: Math.round(l.crop.y * H), width: Math.round(l.crop.w * W), height: Math.round(l.crop.h * H) });
      const target = Math.round(l.w * l.scale);
      if (target > 0) ctx.resize({ width: target });
      const img = await ctx.renderAsync();
      const out = await img.saveAsync({ format: ImageManipulator.SaveFormat.PNG });
      return new File(out.uri).bytes();
    },
    async getVideoFrames(l, fps, scale, quality, onProgress) {
      const uri = await localUri(l, projectId);
      const start = l.videoTrim?.start ?? 0;
      const end = l.videoTrim?.end ?? l.videoDuration ?? 0;
      const total = Math.max(1, Math.round((end - start) * fps));
      const frames: Uint8Array[] = [];
      for (let i = 0; i < total; i++) {
        const t = Math.round((start + i / fps) * 1000);
        const th = await VideoThumbnails.getThumbnailAsync(uri, { time: t, quality });
        let fileUri = th.uri;
        if (scale < 0.999) {
          const ctx = ImageManipulator.ImageManipulator.manipulate(th.uri).resize({ width: Math.round(th.width * scale) });
          const r = await (await ctx.renderAsync()).saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: quality });
          fileUri = r.uri;
        }
        frames.push(await new File(fileUri).bytes());
        onProgress?.(i + 1, total);
      }
      return frames;
    }
  };
}

export const cacheFile = (name: string) => new File(Paths.cache, name);

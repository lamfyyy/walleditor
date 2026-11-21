import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { Project } from "../model";
import { validateProjectForExport, type ExportCheck } from "./validate";
import { buildTendiesEnvelope, parseTendies, serializeTendies, TENDIES_FORMAT, TENDIES_VERSION } from "./format";

export const TENDIES_MIME = "application/vnd.walleditor.tendies+json";

export type TendiesPreview = {
  filename: string;
  expectedBytes: number;
  entries: string[];
  checks: ExportCheck[];
  supported: true;
  format: typeof TENDIES_FORMAT;
};

const safeFilename = (name: string) => `${name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "") || "walleditor"}.tendies`;

export function buildTendiesPreview(project: Project): TendiesPreview {
  const payload = serializeTendies(project);
  return {
    filename: safeFilename(project.name),
    expectedBytes: new TextEncoder().encode(payload).length,
    entries: ["manifest.json", "project.json", "assets/walleditor/background.png", "assets/walleditor/asset1.png", "assets/walleditor/asset2.png"],
    checks: validateProjectForExport(project),
    supported: true,
    format: TENDIES_FORMAT,
  };
}

function downloadOnWeb(filename: string, payload: string) {
  const documentRef = globalThis.document;
  if (!documentRef) throw new Error("Web document API unavailable");
  const blob = new Blob([payload], { type: TENDIES_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = documentRef.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportProjectToFile(project: Project): Promise<{ filename: string; bytes: number; uri?: string }> {
  const filename = safeFilename(project.name);
  const payload = serializeTendies(project);
  const bytes = new TextEncoder().encode(payload).length;
  if (Platform.OS === "web") {
    downloadOnWeb(filename, payload);
    return { filename, bytes };
  }
  const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDirectory) throw new Error("Не найдено локальное хранилище для экспорта");
  const uri = `${baseDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, payload);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: TENDIES_MIME, dialogTitle: `Экспорт ${filename}` });
  }
  return { filename, bytes, uri };
}

export async function importProjectFromFile(): Promise<Project | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: [TENDIES_MIME, "application/json", "*/*"], copyToCacheDirectory: true, multiple: false });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  let text: string;
  if (Platform.OS === "web" && asset.file && typeof asset.file.text === "function") text = await asset.file.text();
  else text = await FileSystem.readAsStringAsync(asset.uri);
  return parseTendies(text);
}

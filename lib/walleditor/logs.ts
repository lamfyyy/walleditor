import AsyncStorage from "@react-native-async-storage/async-storage";

export type LogLevel = "info" | "warn" | "error";
export type AppLog = { id: string; level: LogLevel; message: string; createdAt: string };
const KEY = "walleditor.logs.v1";

const seedLogs: AppLog[] = [
  { id: "boot", level: "info", message: "walleditor launched", createdAt: new Date().toISOString() },
  { id: "demo", level: "info", message: "Demo project loaded from local storage", createdAt: new Date().toISOString() },
];

export async function loadLogs(): Promise<AppLog[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) { await AsyncStorage.setItem(KEY, JSON.stringify(seedLogs)); return seedLogs; }
  try { return JSON.parse(raw) as AppLog[]; } catch { return seedLogs; }
}

export async function appendLog(level: LogLevel, message: string) {
  const logs = await loadLogs();
  const next = [{ id: `${Date.now()}-${Math.random()}`, level, message, createdAt: new Date().toISOString() }, ...logs].slice(0, 100);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function clearLogs() { await AsyncStorage.setItem(KEY, JSON.stringify([])); }

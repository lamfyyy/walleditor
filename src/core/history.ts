import type { Project } from './types';

export interface HistoryEntry { label: string; at: number; project: Project }
export interface History { past: HistoryEntry[]; present: Project; future: HistoryEntry[]; log: { label: string; at: number }[] }
const LIMIT = 100;

export const initHistory = (p: Project): History => ({ past: [], present: p, future: [], log: [] });

export function commit(h: History, next: Project, label: string): History {
  const past = [...h.past, { label, at: Date.now(), project: h.present }].slice(-LIMIT);
  return { past, present: { ...next, updatedAt: Date.now() }, future: [], log: [{ label, at: Date.now() }, ...h.log].slice(0, 30) };
}

export function undo(h: History): History {
  const e = h.past[h.past.length - 1];
  if (!e) return h;
  return { past: h.past.slice(0, -1), present: e.project, future: [{ label: e.label, at: e.at, project: h.present }, ...h.future], log: [{ label: '↶ ' + e.label, at: Date.now() }, ...h.log].slice(0, 30) };
}

export function redo(h: History): History {
  const e = h.future[0];
  if (!e) return h;
  return { past: [...h.past, { label: e.label, at: e.at, project: h.present }], present: e.project, future: h.future.slice(1), log: [{ label: '↷ ' + e.label, at: Date.now() }, ...h.log].slice(0, 30) };
}

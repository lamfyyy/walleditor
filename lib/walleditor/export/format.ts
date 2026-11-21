import type { Project } from "../model";
import { normalizeProject } from "../model";

export const TENDIES_FORMAT = "walleditor.tendies" as const;
export const TENDIES_VERSION = 1 as const;

export type TendiesEnvelope = {
  format: typeof TENDIES_FORMAT;
  version: number;
  exportedAt: string;
  manifest: {
    app: "walleditor";
    projectId: string;
    projectName: string;
    canvas: Project["canvas"];
    resources: string[];
  };
  project: Project;
};

export function buildTendiesEnvelope(project: Project): TendiesEnvelope {
  const normalized = normalizeProject(project);
  return {
    format: TENDIES_FORMAT,
    version: TENDIES_VERSION,
    exportedAt: new Date().toISOString(),
    manifest: {
      app: "walleditor",
      projectId: normalized.id,
      projectName: normalized.name,
      canvas: normalized.canvas,
      resources: normalized.layers.map((layer) => `assets/walleditor/${layer.asset}.png`),
    },
    project: normalized,
  };
}

export function serializeTendies(project: Project): string {
  return JSON.stringify(buildTendiesEnvelope(project), null, 2);
}

export function parseTendies(text: string): Project {
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null) throw new Error("Файл .tendies должен содержать JSON-пакет");
  const envelope = parsed as Partial<TendiesEnvelope>;
  if (envelope.format !== TENDIES_FORMAT) throw new Error("Это не .tendies-пакет walleditor");
  if (envelope.version !== TENDIES_VERSION || !envelope.project) throw new Error("Неподдерживаемая версия .tendies-пакета");
  const project = normalizeProject(envelope.project, envelope.manifest?.projectName ?? "Imported project");
  return { ...project, id: `${project.id}-import-${Date.now()}`, name: `${project.name} import`, modifiedAt: new Date().toISOString(), exportedAt: undefined };
}

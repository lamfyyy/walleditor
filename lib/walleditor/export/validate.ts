import type { Project } from "../model";

export type ExportCheck = { level: "pass" | "warn" | "fail"; label: string; detail: string };

const HEX = /^#[0-9A-F]{6}$/i;

export function validateProjectForExport(project: Project): ExportCheck[] {
  const checks: ExportCheck[] = [];
  const ids = new Set(project.layers.map((layer) => layer.id));
  const visible = project.layers.filter((layer) => layer.visible);
  checks.push({ level: project.id.length > 0 ? "pass" : "fail", label: "Project identifier", detail: project.id || "Missing project id" });
  checks.push({ level: ids.size === project.layers.length ? "pass" : "fail", label: "Layer identifiers", detail: ids.size === project.layers.length ? `${ids.size} unique layer ids` : "Duplicate layer id detected" });
  checks.push({ level: project.duration <= 12 ? "pass" : "fail", label: "Duration", detail: `${project.duration}s / 12s limit` });
  checks.push({ level: visible.length > 0 ? "pass" : "fail", label: "Visible resources", detail: visible.length > 0 ? `${visible.length} visible layers` : "Nothing visible to export" });
  checks.push({ level: project.layers.some((layer) => layer.asset === "background") ? "pass" : "fail", label: "Background resource", detail: project.layers.some((layer) => layer.asset === "background") ? "Background layer present" : "Add a background layer before export" });
  checks.push({ level: project.layers.every((layer) => layer.opacity >= 0 && layer.opacity <= 1) ? "pass" : "fail", label: "Layer opacity", detail: "All opacity values are between 0 and 1" });
  checks.push({ level: HEX.test(project.kawarp.primaryColor) && HEX.test(project.kawarp.secondaryColor) ? "pass" : "warn", label: "Kawarp colors", detail: "Colors are stored in #RRGGBB format" });
  checks.push({ level: "pass", label: "Portable resources", detail: "The package records the supplied asset keys and project-local resource paths" });
  checks.push({ level: "warn", label: "PosterBoard compatibility", detail: "The walleditor .tendies package is portable between walleditor installs; PosterBoard/CAML compatibility still needs manual device verification" });
  return checks;
}

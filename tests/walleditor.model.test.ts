import { describe, expect, it } from "vitest";
import { createDemoProject, createLayer, normalizeProject } from "../lib/walleditor/model";
import { buildTendiesEnvelope, parseTendies, serializeTendies } from "../lib/walleditor/export/format";


describe("walleditor project model", () => {
  it("normalizes legacy layers and supplies Kawarp defaults", () => {
    const project = normalizeProject({ id: "legacy", name: "Legacy", layers: [{ id: "old", asset: "asset1", animated: true, opacity: 4 }] });
    expect(project.schemaVersion).toBe(2);
    expect(project.layers.some((layer) => layer.asset === "background")).toBe(true);
    expect(project.layers.find((layer) => layer.id === "old")?.animation.enabled).toBe(true);
    expect(project.layers.find((layer) => layer.id === "old")?.opacity).toBe(1);
    expect(project.kawarp.primaryColor).toBe("#FF4FA3");
  });

  it("keeps layer controls in the project payload", () => {
    const project = createDemoProject();
    const layer = createLayer("asset2", "Test layer");
    const next = { ...project, layers: [...project.layers, { ...layer, locked: false, x: 0.2, y: -0.1, scale: 0.8, opacity: 0.4 }] };
    expect(next.layers.at(-1)).toMatchObject({ name: "Test layer", locked: false, x: 0.2, y: -0.1, scale: 0.8, opacity: 0.4 });
  });
});

describe("walleditor tendies", () => {
  it("round-trips a project through the versioned JSON envelope", () => {
    const original = createDemoProject();
    const envelope = buildTendiesEnvelope(original);
    expect(envelope.format).toBe("walleditor.tendies");
    expect(envelope.version).toBe(1);
    const imported = parseTendies(serializeTendies(original));
    expect(imported.name).toContain(original.name);
    expect(imported.layers).toHaveLength(original.layers.length);
    expect(imported.kawarp.primaryColor).toBe(original.kawarp.primaryColor);
    expect(imported.id).not.toBe(original.id);
  });

  it("rejects packages from another format", () => {
    expect(() => parseTendies(JSON.stringify({ format: "other", version: 1, project: {} }))).toThrow("не .tendies");
  });
});

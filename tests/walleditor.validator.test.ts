import { describe, expect, it } from "vitest";
import { createDemoProject } from "../lib/walleditor/model";
import { validateProjectForExport } from "../lib/walleditor/export/validate";

describe("walleditor export validator", () => {
  it("accepts the supplied demo within the duration limit", () => {
    const checks = validateProjectForExport(createDemoProject());
    expect(checks.some((check) => check.level === "fail")).toBe(false);
    expect(checks.find((check) => check.label === "Duration")?.level).toBe("pass");
  });

  it("blocks projects beyond the initial twelve-second limit", () => {
    const project = { ...createDemoProject(), duration: 13 };
    const checks = validateProjectForExport(project);
    expect(checks.find((check) => check.label === "Duration")?.level).toBe("fail");
  });
});

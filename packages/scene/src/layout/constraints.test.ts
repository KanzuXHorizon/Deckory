import { describe, expect, it } from "vitest";
import { resolveConstraints, tryResolveConstraints } from "./constraints";

describe("resolveConstraints", () => {
  it("keeps a right-anchored element attached when its parent grows", () => {
    const result = resolveConstraints({
      originalParent: { width: 600, height: 400 },
      nextParent: { width: 800, height: 400 },
      child: { x: 420, y: 40, width: 140, height: 80 },
      constraints: { horizontal: "right", vertical: "top" }
    });

    expect(result).toEqual({ x: 620, y: 40, width: 140, height: 80 });
  });

  it("preserves center offsets and scales proportionally", () => {
    expect(resolveConstraints({
      originalParent: { width: 400, height: 200 },
      nextParent: { width: 800, height: 400 },
      child: { x: 110, y: 60, width: 100, height: 40 },
      constraints: { horizontal: "center", vertical: "scale" }
    })).toEqual({ x: 310, y: 120, width: 100, height: 80 });
  });

  it("returns an actionable diagnostic instead of shrinking below a minimum", () => {
    const result = tryResolveConstraints({
      originalParent: { width: 500, height: 300 },
      nextParent: { width: 120, height: 300 },
      child: { x: 40, y: 20, width: 420, height: 80 },
      constraints: { horizontal: "stretch", vertical: "top" },
      minimumSize: { width: 160, height: 40 }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostics[0]?.code).toBe("constraint-minimum-does-not-fit");
      expect(result.diagnostics[0]?.message).toMatch(/tăng kích thước khung cha/i);
    }
  });
});

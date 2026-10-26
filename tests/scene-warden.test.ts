import { describe, expect, it } from "vitest";
import {
  clamp,
  dropIntensityFor,
  footstepIntervalFor,
  lampScaleFor,
  wardenStateFor,
} from "@/ui/game/scene/warden";

describe("scene/warden", () => {
  it("maps phases to visible warden states", () => {
    expect(wardenStateFor(0, "desk")).toBe("away");
    expect(wardenStateFor(30, "desk")).toBe("near");
    expect(wardenStateFor(60, "desk")).toBe("still");
    expect(wardenStateFor(0, "locked")).toBe("knocking");
    expect(wardenStateFor(10, "interpretation")).toBe("still");
    expect(wardenStateFor(100, "u1Resolved")).toBe("away");
    expect(wardenStateFor(100, "noise")).toBe("away");
    expect(wardenStateFor(100, "u2Resolved")).toBe("away");
    expect(wardenStateFor(100, "boundary")).toBe("away");
  });

  it("tightens the lamp pool as pressure rises", () => {
    expect(lampScaleFor(0)).toBe(0.96);
    expect(lampScaleFor(50)).toBeLessThan(lampScaleFor(10));
    expect(lampScaleFor(100)).toBeGreaterThanOrEqual(0.55);
    expect(lampScaleFor(100)).toBeLessThanOrEqual(0.96);
  });

  it("brings footsteps closer as pressure rises", () => {
    expect(footstepIntervalFor(0)).toBe(16000);
    expect(footstepIntervalFor(50)).toBeLessThan(footstepIntervalFor(10));
    expect(footstepIntervalFor(100)).toBeGreaterThanOrEqual(5200);
    expect(footstepIntervalFor(100)).toBeLessThanOrEqual(16000);
  });

  it("darkens the drops with attempts and complicity", () => {
    expect(dropIntensityFor(0, 0)).toBe(0);
    expect(dropIntensityFor(1, 0)).toBeGreaterThan(0);
    expect(dropIntensityFor(3, 2)).toBeLessThanOrEqual(1);
    expect(dropIntensityFor(9, 9)).toBe(1);
  });

  it("clamps arbitrary values", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(4, 0, 10)).toBe(4);
  });
});

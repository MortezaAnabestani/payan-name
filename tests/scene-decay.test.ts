import { describe, expect, it } from "vitest";
import {
  charDecay,
  motifRange,
  noise,
  readableMask,
} from "@/ui/game/scene/decay";

describe("scene/decay", () => {
  it("noise is deterministic and stays in [0, 1)", () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const value = noise(seed);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(noise(seed)).toBe(value);
    }
  });

  it("finds the motif with ZWNJ, plain spaces, or digit three", () => {
    expect(motifRange("اول سه‌قطره خون آخر")).toEqual([4, 15]);
    expect(motifRange("سه قطره خون")).toEqual([0, 11]);
    expect(motifRange("3 قطره خون")).toEqual([0, 10]);
    expect(motifRange("چیزی نیست")).toBeNull();
  });

  it("keeps only the motif readable", () => {
    const text = "این خط می‌ریزد اما سه قطره خون می‌ماند";
    const mask = readableMask(text);
    const start = text.indexOf("سه");
    const end = text.indexOf("می‌ماند");
    expect(mask.slice(0, start).every((item) => item === false)).toBe(true);
    expect(mask.slice(start, end).some((item) => item === true)).toBe(true);
    expect(mask.slice(end).every((item) => item === false)).toBe(true);
  });

  it("decays harder with each attempt while remaining finite", () => {
    const first = charDecay(11, 0);
    const third = charDecay(11, 2);
    expect(third.ink).toBeLessThan(first.ink);
    expect(third.blur).toBeGreaterThan(first.blur);
    expect(Number.isFinite(third.drift)).toBe(true);
    expect(Number.isFinite(third.fall)).toBe(true);
    expect(Number.isFinite(third.tilt)).toBe(true);
    expect(third.ink).toBeGreaterThan(0);
  });
});

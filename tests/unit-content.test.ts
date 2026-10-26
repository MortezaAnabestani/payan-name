import { describe, expect, it } from "vitest";
import { U1 } from "@/content/u1";
import { U2 } from "@/content/u2";
import { G1, UNIT_REGISTRY } from "@/content/units";

const EXPECTED_ORDER = [
  "G1",
  "U1",
  "U2",
  "U3",
  "U4",
  "U5",
  "U6",
  "U7",
  "U8",
  "U9",
];

describe("unit registry contract", () => {
  it("covers G1 and U1–U9 with unique ids and contiguous order", () => {
    const ids = Object.keys(UNIT_REGISTRY);
    expect(ids.sort()).toEqual([...EXPECTED_ORDER].sort());
    for (const [index, id] of EXPECTED_ORDER.entries()) {
      const unit = UNIT_REGISTRY[id];
      expect(unit, id).toBeDefined();
      expect(unit?.id).toBe(id);
      expect(unit?.order).toBe(index);
    }
  });

  it("keeps chapter 1 on chapter-1 and G1 as the paratext of the prologue", () => {
    expect(G1.chapterId).toBe("prologue");
    expect(G1.type).toBe("paratext");
    expect(G1.level).toBeNull();
    for (const id of EXPECTED_ORDER.slice(1)) {
      const unit = UNIT_REGISTRY[id];
      expect(unit?.chapterId, id).toBe("chapter-1");
      expect(unit?.type, id).not.toBe("paratext");
    }
  });

  it("pins the canonical source ranges for G1, U1 and U2", () => {
    expect(G1.source).toEqual({
      lines: "۱",
      sentences: "S001",
      quote: "سه قطره خون",
      charStart: 0,
      charEnd: 11,
    });
    expect(U1.source.charStart).toBe(12);
    expect(U1.source.charEnd).toBe(564);
    expect(U2.source.lines).toBe("۳");
    expect(U2.source.sentences).toBe("S011");
    expect(U2.source.charStart).toBe(565);
    expect(U2.source.charEnd).toBe(676);
    expect(U2.source.quote).toBe(
      "حالا که دقت میکنم مابین خط‌های درهم و برهمی که روی کاغذ کشیده‌ام تنها چیزی که خوانده میشود اینست: «سه قطره خون.»",
    );
  });

  it("gives every definition a non-empty quote, valid range and technique", () => {
    for (const id of EXPECTED_ORDER) {
      const unit = UNIT_REGISTRY[id];
      expect(unit, id).toBeDefined();
      if (!unit) continue;
      expect(unit.source.quote.length, id).toBeGreaterThan(0);
      expect(unit.source.charEnd, id).toBeGreaterThan(unit.source.charStart);
      expect(unit.source.charStart, id).toBeGreaterThanOrEqual(0);
      expect(unit.technique.length, id).toBeGreaterThan(0);
      expect(unit.dominant.length, id).toBeGreaterThan(0);
      expect(unit.motifs.length, id).toBeGreaterThan(0);
      expect(unit.relations.length, id).toBeGreaterThan(0);
      expect(unit.renderer.key.length, id).toBeGreaterThan(0);
    }
  });

  it("keeps levels inside 1–5 for core/catalyst/support units", () => {
    for (const id of EXPECTED_ORDER) {
      const unit = UNIT_REGISTRY[id];
      if (!unit || unit.type === "paratext") continue;
      expect(unit.level, id).toBeGreaterThanOrEqual(1);
      expect(unit.level, id).toBeLessThanOrEqual(5);
    }
  });

  it("exposes the built units through the same shapes they are registered with", () => {
    expect(UNIT_REGISTRY.U1?.id).toBe(U1.id);
    expect(UNIT_REGISTRY.U2?.id).toBe(U2.id);
    expect(UNIT_REGISTRY.U2?.renderer.kind).toBe("canvas");
    expect(UNIT_REGISTRY.U1?.renderer.kind).toBe("text");
    expect(UNIT_REGISTRY.U3?.id).toBe("U3");
    expect(UNIT_REGISTRY.U3?.renderer.kind).toBe("composite");
    expect(UNIT_REGISTRY.U3?.source.charStart).toBe(677);
    expect(UNIT_REGISTRY.U3?.source.charEnd).toBe(1453);
    expect(UNIT_REGISTRY.U3?.source.sentences).toBe("S012–S017");
  });
});

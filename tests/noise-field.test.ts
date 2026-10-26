import { describe, expect, it } from "vitest";
import {
  U2_CONFIG,
  candidatePoints,
  createField,
  hashSeed,
  isBlank,
  placeMotif,
  readability,
  regenerate,
  strokeFromCursor,
  surfacedCountFor,
  wipe,
  type NoiseField,
} from "@/ui/game/scene/noise";

function serpentineStroke(index: number): { x: number; y: number }[] {
  // قطعی و پراکنده روی کل کاغذ (37 و 61 نسبت به 100 اول‌اند).
  const x = ((index * 37) % 100) / 100;
  const y = ((index * 61) % 100) / 100;
  return [{ x: 0.14 + x * 0.72, y: 0.12 + y * 0.76 }];
}

function play(field: NoiseField, strokes: number): NoiseField {
  let next = field;
  for (let index = 0; index < strokes; index += 1) {
    next = regenerate(wipe(next, serpentineStroke(index)), index + 1);
  }
  return next;
}

describe("scene/noise", () => {
  it("creates a deterministic field from a seed", () => {
    const first = createField(42);
    const second = createField(42);
    const other = createField(43);
    expect(first.cells.length).toBeGreaterThan(100);
    expect(first.baseInk).toBeGreaterThan(0);
    expect(second.cells).toEqual(first.cells);
    expect(other.cells).not.toEqual(first.cells);
  });

  it("hashes session ids into stable seeds", () => {
    expect(hashSeed("session-1")).toBe(hashSeed("session-1"));
    expect(hashSeed("session-1")).not.toBe(hashSeed("session-2"));
    expect(Number.isInteger(hashSeed("x"))).toBe(true);
  });

  it("erases ink under the brush and raises readability a little", () => {
    const field = createField(7);
    const point = serpentineStroke(3);
    const wiped = wipe(field, point);
    const beforeInk = field.cells.reduce((sum, cell) => sum + cell.ink, 0);
    const afterInk = wiped.cells.reduce((sum, cell) => sum + cell.ink, 0);
    expect(afterInk).toBeLessThan(beforeInk);
    expect(readability(wiped)).toBeGreaterThan(readability(field));
    const radius = U2_CONFIG.wipeRadius;
    for (const cell of wiped.cells) {
      const dx = cell.x - point[0].x;
      const dy = cell.y - point[0].y;
      if (Math.sqrt(dx * dx + dy * dy) <= radius * 0.9) {
        expect(cell.ink).toBe(0);
      }
    }
  });

  it("regenerates fresh noise but never more than it erased", () => {
    const field = createField(11);
    const stroke = serpentineStroke(5);
    const wiped = wipe(field, stroke);
    const regrown = regenerate(wiped, 1);
    const inkOf = (state: NoiseField) =>
      state.cells.reduce((sum, cell) => sum + cell.ink, 0);
    expect(inkOf(regrown)).toBeGreaterThan(inkOf(wiped));
    expect(inkOf(regrown)).toBeLessThan(inkOf(field));
  });

  it("does not regenerate twice from the same nonce", () => {
    const field = createField(13);
    const wiped = wipe(field, serpentineStroke(6));
    expect(regenerate(wiped, 2)).toEqual(regenerate(wiped, 2));
  });

  it("rejects an empty stroke", () => {
    const field = createField(3);
    expect(wipe(field, [])).toBe(field);
  });

  it("keeps the paper far from blank early, and blank after persistent wiping", () => {
    const field = createField(17);
    const early = play(field, 10);
    expect(isBlank(early)).toBe(false);
    const late = play(field, 320);
    expect(isBlank(late)).toBe(true);
  });

  it("maps stroke counts to the three surfacing thresholds", () => {
    const [first, second, third] = U2_CONFIG.surfaceStrokes;
    expect(surfacedCountFor(0)).toBe(0);
    expect(surfacedCountFor(first - 1)).toBe(0);
    expect(surfacedCountFor(first)).toBe(1);
    expect(surfacedCountFor(second - 1)).toBe(1);
    expect(surfacedCountFor(second)).toBe(2);
    expect(surfacedCountFor(third - 1)).toBe(2);
    expect(surfacedCountFor(third)).toBe(3);
    expect(surfacedCountFor(1000)).toBe(3);
  });

  it("offers three bounded candidate points in a seed-dependent order", () => {
    const seed = hashSeed("session-1");
    const points = candidatePoints(seed);
    expect(points).toHaveLength(3);
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(U2_CONFIG.bounds.minX);
      expect(point.x).toBeLessThanOrEqual(U2_CONFIG.bounds.maxX);
      expect(point.y).toBeGreaterThanOrEqual(U2_CONFIG.bounds.minY);
      expect(point.y).toBeLessThanOrEqual(U2_CONFIG.bounds.maxY);
    }
    const distinct = new Set(points.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`));
    expect(distinct.size).toBe(3);
    expect(candidatePoints(seed)).toEqual(points);
  });

  it("places motif marks sequentially and never erases them with the brush", () => {
    const field = createField(21);
    expect(placeMotif(field, 2, 0.5, 0.5)).toBe(field);
    const first = placeMotif(field, 1, 0.7, 0.3);
    expect(first.motif).toEqual({ index: 1, x: 0.7, y: 0.3 });
    const skipped = placeMotif(first, 3, 0.3, 0.6);
    expect(skipped).toBe(first);
    const second = placeMotif(first, 2, 0.3, 0.6);
    expect(second.motif?.index).toBe(2);
    const wiped = wipe(second, [{ x: 0.3, y: 0.6 }]);
    expect(wiped.motif).toEqual(second.motif);
  });

  it("builds a keyboard stroke around the cursor, inside the paper", () => {
    const stroke = strokeFromCursor({ x: 0.02, y: 0.98 });
    expect(stroke.length).toBeGreaterThan(2);
    for (const point of stroke) {
      expect(point.y).toBeCloseTo(0.98, 5);
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
    }
  });
});

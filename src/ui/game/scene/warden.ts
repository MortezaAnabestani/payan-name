export type WardenState = "away" | "near" | "still" | "knocking";

export function wardenStateFor(
  pressure: number,
  phase: string,
): WardenState {
  if (phase === "locked") return "knocking";
  if (phase === "interpretation") return "still";
  if (phase === "desk") {
    if (pressure >= 60) return "still";
    if (pressure >= 30) return "near";
  }
  // U2 (noise/u2Resolved/boundary) شاهد منبعی برای ناظم ندارد؛ پشتِ در می‌ماند.
  return "away";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** شعاع حوضهٔ نور: هرچه فشار بیشتر، نور تنگ‌تر. */
export function lampScaleFor(pressure: number): number {
  return clamp(0.96 - pressure / 210, 0.55, 0.96);
}

/** فاصلهٔ قدم‌های ناظم: هرچه فشار بیشتر، نزدیک‌تر. */
export function footstepIntervalFor(pressure: number): number {
  return Math.round(clamp(16000 - pressure * 110, 5200, 16000));
}

/** تیرگی سه قطره: تلاش‌ها و هم‌دستی. */
export function dropIntensityFor(attempts: number, complicity: number): number {
  return clamp(attempts * 0.22 + complicity * 0.16, 0, 1);
}

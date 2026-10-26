import { STATIONS } from "@/domain/session/reducer";
import type { StationId } from "@/domain/session/types";

/** چرخهٔ انتخاب در حیاط: برگه و چهار در. */
export const WARD_RING = [
  "page",
  "garden",
  "cellar",
  "infirmary",
  "night",
] as const;

export type WardSpot = (typeof WARD_RING)[number];

export function selectionNext(current: WardSpot, delta: number): WardSpot {
  const length = WARD_RING.length;
  const index = WARD_RING.indexOf(current);
  const next = (((index + delta) % length) + length) % length;
  return WARD_RING[next];
}

export function isCycleComplete(visited: readonly StationId[]): boolean {
  return STATIONS.every((station) => visited.includes(station));
}

/** گرمای رنگ حیاط: هر چرخه، یک لایه اشباع‌تر (چرخهٔ آشکار بدون عدد). */
export function wardWarmthFor(loops: number): number {
  return Math.min(1, 0.3 + loops * 0.5);
}

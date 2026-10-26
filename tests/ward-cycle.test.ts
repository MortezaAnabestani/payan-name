import { describe, expect, it } from "vitest";
import {
  CLAIM_SENTENCE,
  CLAIM_STAGES,
  STATIONS,
  claimStageFor,
} from "@/domain/session/reducer";
import {
  WARD_RING,
  isCycleComplete,
  selectionNext,
  wardWarmthFor,
} from "@/ui/game/scene/ward";

describe("scene/ward", () => {
  it("walks the yard ring forward and backward with wrap", () => {
    expect(selectionNext("page", 1)).toBe("garden");
    expect(selectionNext("night", 1)).toBe("page");
    expect(selectionNext("page", -1)).toBe("night");
    expect(selectionNext("garden", -2)).toBe("night");
    expect(selectionNext("infirmary", 5)).toBe("infirmary");
  });

  it("keeps the ring one step larger than the stations", () => {
    expect(WARD_RING).toHaveLength(STATIONS.length + 1);
    for (const station of STATIONS) {
      expect(WARD_RING).toContain(station);
    }
    expect(WARD_RING).toContain("page");
  });

  it("detects complete day cycles in any order", () => {
    expect(isCycleComplete([])).toBe(false);
    expect(isCycleComplete(["garden", "cellar", "infirmary"])).toBe(false);
    expect(isCycleComplete(STATIONS)).toBe(true);
    expect(isCycleComplete([...STATIONS].reverse())).toBe(true);
  });

  it("maps same-acts to monotone, capped claim stages", () => {
    expect(claimStageFor(0)).toBe(0);
    expect(claimStageFor(1)).toBe(0);
    expect(claimStageFor(2)).toBe(1);
    expect(claimStageFor(7)).toBe(3);
    expect(claimStageFor(8)).toBe(CLAIM_STAGES);
    expect(claimStageFor(40)).toBe(CLAIM_STAGES);
  });

  it("warms the yard monotonically across loops", () => {
    expect(wardWarmthFor(0)).toBeGreaterThan(0);
    expect(wardWarmthFor(1)).toBeGreaterThan(wardWarmthFor(0));
    expect(wardWarmthFor(9)).toBeLessThanOrEqual(1);
  });

  it("pins the claim sentence to the source claim", () => {
    expect(CLAIM_SENTENCE).toContain("زمین تا آسمان");
    expect(CLAIM_SENTENCE).toContain("فرق دارم");
  });
});

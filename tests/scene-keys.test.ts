import { describe, expect, it } from "vitest";
import {
  brushMoveForKey,
  isBrushStrokeKey,
  isPenLiftKey,
  lockedActForKey,
} from "@/ui/game/scene/keys";

describe("scene/keys", () => {
  it("lifts the pen only with a command shortcut", () => {
    expect(isPenLiftKey({ key: "Enter", ctrlKey: true })).toBe(true);
    expect(isPenLiftKey({ key: "Enter", metaKey: true })).toBe(true);
    expect(isPenLiftKey({ key: "Enter" })).toBe(false);
    expect(isPenLiftKey({ key: "Enter", shiftKey: true })).toBe(false);
    expect(isPenLiftKey({ key: "a", ctrlKey: true })).toBe(false);
  });

  it("offers keyboard equivalents for the two locked acts", () => {
    expect(lockedActForKey({ key: "k" })).toBe("keep");
    expect(lockedActForKey({ key: "K" })).toBe("keep");
    expect(lockedActForKey({ key: "Escape" })).toBe("release");
    expect(lockedActForKey({ key: "Enter" })).toBeNull();
  });

  it("moves the U2 brush with the arrow keys", () => {
    expect(brushMoveForKey({ key: "ArrowLeft" })).toEqual({ dx: -1, dy: 0 });
    expect(brushMoveForKey({ key: "ArrowRight" })).toEqual({ dx: 1, dy: 0 });
    expect(brushMoveForKey({ key: "ArrowUp" })).toEqual({ dx: 0, dy: -1 });
    expect(brushMoveForKey({ key: "ArrowDown" })).toEqual({ dx: 0, dy: 1 });
    expect(brushMoveForKey({ key: "k" })).toBeNull();
  });

  it("makes a brush stroke with space or enter", () => {
    expect(isBrushStrokeKey({ key: " " })).toBe(true);
    expect(isBrushStrokeKey({ key: "Spacebar" })).toBe(true);
    expect(isBrushStrokeKey({ key: "Enter" })).toBe(true);
    expect(isBrushStrokeKey({ key: "a" })).toBe(false);
  });
});

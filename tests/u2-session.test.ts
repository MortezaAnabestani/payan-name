import { describe, expect, it } from "vitest";
import { commands } from "@/application/commands";
import {
  createInitialState,
  reduceEvent,
  replayEvents,
} from "@/domain/session/reducer";
import type { Filing, GameEvent, GameState } from "@/domain/session/types";

const T0 = "2026-01-01T00:00:00.000Z";

function at(seconds: number): string {
  return new Date(Date.parse(T0) + seconds * 1000).toISOString();
}

function atDesk(): GameState {
  const initial = createInitialState("session-1", T0);
  const started = reduceEvent(initial, commands.start("session-1", at(1)));
  return reduceEvent(started, commands.completePrologue(at(2)));
}

function resolved(filing: Filing = "conceal"): GameState {
  let state = reduceEvent(atDesk(), commands.submitDraft("سه قطره خون", at(3)));
  state = reduceEvent(state, commands.keepMotif(at(4)));
  state = reduceEvent(
    state,
    commands.recordInterpretation("interface", ["motif-remained"], at(5)),
  );
  return reduceEvent(state, commands.disposeFile(filing, at(6)));
}

function inNoise(filing: Filing = "conceal"): GameState {
  return reduceEvent(resolved(filing), commands.bridgeContinue(at(7)));
}

function surfaced(state: GameState, count: 1 | 2 | 3, from = 8): GameState {
  let next = state;
  for (let index = 1; index <= count; index += 1) {
    next = reduceEvent(
      next,
      commands.surfaceMotif(index as 1 | 2 | 3, 0.2 + index * 0.1, 0.4, at(from + index)),
    );
  }
  return next;
}

describe("U2 session progression", () => {
  it("opens the noise page from every U1 resolution, and only from there", () => {
    for (const filing of ["submit", "conceal", "tear", "leave"] as Filing[]) {
      const bridged = reduceEvent(resolved(filing), commands.bridgeContinue(at(7)));
      expect(bridged.phase).toBe("noise");
      expect(bridged.unit).toBe("U2");
      expect(bridged.ending).toBe(
        filing === "submit" ? "file" : filing === "conceal" ? "paper" : filing === "tear" ? "ash" : "silence",
      );
    }

    const desk = atDesk();
    expect(reduceEvent(desk, commands.bridgeContinue(at(3)))).toBe(desk);
    const interpretation = reduceEvent(
      reduceEvent(atDesk(), commands.submitDraft("سه قطره خون", at(3))),
      commands.keepMotif(at(4)),
    );
    expect(reduceEvent(interpretation, commands.bridgeContinue(at(5)))).toBe(
      interpretation,
    );
  });

  it("records motif surfacing sequentially and clamps coordinates", () => {
    const noise = inNoise();
    const late = reduceEvent(noise, commands.surfaceMotif(2, 0.5, 0.5, at(8)));
    expect(late).toBe(noise);

    const first = reduceEvent(noise, commands.surfaceMotif(1, 2, -1, at(9)));
    expect(first.u2.surfaced).toHaveLength(1);
    expect(first.u2.surfaced[0]?.x).toBe(1);
    expect(first.u2.surfaced[0]?.y).toBe(0);

    const duplicate = reduceEvent(first, commands.surfaceMotif(1, 0.4, 0.4, at(10)));
    expect(duplicate).toBe(first);

    const second = reduceEvent(first, commands.surfaceMotif(2, 0.4, 0.6, at(11)));
    const third = reduceEvent(second, commands.surfaceMotif(3, 0.6, 0.5, at(12)));
    expect(third.u2.surfaced.map((mark) => mark.index)).toEqual([1, 2, 3]);
  });

  it("rejects non-finite coordinates", () => {
    const noise = inNoise();
    expect(
      reduceEvent(noise, commands.surfaceMotif(1, Number.NaN, 0.5, at(8))),
    ).toBe(noise);
  });

  it("captures the motif only after the third surfacing", () => {
    const noise = inNoise();
    expect(reduceEvent(noise, commands.captureMotif(at(9)))).toBe(noise);

    const two = surfaced(noise, 2);
    expect(reduceEvent(two, commands.captureMotif(at(9)))).toBe(two);

    const three = surfaced(noise, 3);
    const captured = reduceEvent(three, commands.captureMotif(at(20)));
    expect(captured.phase).toBe("u2Resolved");
    expect(captured.u2.outcome).toBe("captured");
    expect(captured.motifOwner).toBe("discovered");
    expect(captured.complicity).toBe(three.complicity + 1);
  });

  it("denies the page from the noise phase and closes it", () => {
    const noise = inNoise();
    const denied = reduceEvent(noise, commands.denyPage(at(9)));
    expect(denied.phase).toBe("u2Resolved");
    expect(denied.u2.outcome).toBe("denied");
    expect(denied.motifOwner).toBe("denied");

    const captured = surfaced(noise, 3);
    const resolvedState = reduceEvent(captured, commands.captureMotif(at(20)));
    expect(reduceEvent(resolvedState, commands.denyPage(at(21)))).toBe(resolvedState);
  });

  it("ignores noise events outside the noise phase", () => {
    const desk = atDesk();
    expect(reduceEvent(desk, commands.captureMotif(at(3)))).toBe(desk);
    expect(reduceEvent(desk, commands.denyPage(at(3)))).toBe(desk);
    expect(reduceEvent(desk, commands.surfaceMotif(1, 0.5, 0.5, at(3)))).toBe(desk);
  });

  it("does not accept the boundary before U3 resolves", () => {
    const noise = inNoise();
    const captured = surfaced(noise, 3);
    const resolvedState = reduceEvent(captured, commands.captureMotif(at(20)));
    expect(resolvedState.phase).toBe("u2Resolved");
    expect(
      reduceEvent(resolvedState, commands.acknowledgeBoundary(at(21))),
    ).toBe(resolvedState);
  });

  it("replays a full U1–U2 log deterministically", () => {
    const initial = createInitialState("session-1", T0);
    const events: GameEvent[] = [
      commands.start("session-1", at(1)),
      commands.completePrologue(at(2)),
      commands.submitDraft("نوشتهٔ اول", at(3)),
      commands.submitDraft("سه قطره خون", at(4)),
      commands.keepMotif(at(5)),
      commands.recordInterpretation("self", ["registered", "no-error"], at(6)),
      commands.disposeFile("conceal", at(7)),
      commands.bridgeContinue(at(8)),
      commands.surfaceMotif(1, 0.66, 0.2, at(9)),
      commands.surfaceMotif(2, 0.3, 0.5, at(10)),
      commands.surfaceMotif(3, 0.5, 0.8, at(11)),
      commands.captureMotif(at(12)),
      commands.enterWard(at(13)),
    ];

    const direct = events.reduce(reduceEvent, initial);
    const replayed = replayEvents(events, initial);
    expect(replayed).toEqual(direct);
    expect(replayed.phase).toBe("ward");
    expect(replayed.unit).toBe("U3");
    expect(replayed.u2.surfaced).toHaveLength(3);
    expect(replayed.motifOwner).toBe("discovered");
    expect(replayed.complicity).toBe(2);
  });

  it("resets mid-U2 back to a fresh invitation while preserving settings", () => {
    let noise = inNoise("tear");
    noise = surfaced(noise, 3);
    const changed = reduceEvent(noise, commands.changeSettings({ muted: true }, at(30)));
    const reset = reduceEvent(changed, commands.reset("session-2", at(31)));
    expect(reset.phase).toBe("invitation");
    expect(reset.unit).toBe("U1");
    expect(reset.u2.surfaced).toHaveLength(0);
    expect(reset.u2.outcome).toBeNull();
    expect(reset.motifOwner).toBe("unknown");
    expect(reset.settings.muted).toBe(true);
  });
});

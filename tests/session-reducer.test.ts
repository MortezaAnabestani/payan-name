import { describe, expect, it } from "vitest";
import { commands } from "@/application/commands";
import {
  canRecordInterpretation,
  createInitialState,
  isLocked,
  isMotifTyped,
  normalizeText,
  reduceEvent,
  replayEvents,
} from "@/domain/session/reducer";
import type {
  Claim,
  Filing,
  GameEvent,
  GameState,
} from "@/domain/session/types";

const T0 = "2026-01-01T00:00:00.000Z";

function at(seconds: number): string {
  return new Date(Date.parse(T0) + seconds * 1000).toISOString();
}

function atDesk(): GameState {
  const initial = createInitialState("session-1", T0);
  const started = reduceEvent(initial, commands.start("session-1", at(1)));
  return reduceEvent(started, commands.completePrologue(at(2)));
}

function submit(state: GameState, text: string, seconds: number): GameState {
  return reduceEvent(state, commands.submitDraft(text, at(seconds)));
}

function lockedByAttempts(): GameState {
  let state = atDesk();
  state = submit(state, "نوشتهٔ اول", 3);
  state = submit(state, "نوشتهٔ دوم", 4);
  return submit(state, "نوشتهٔ سوم", 5);
}

function interpreted(claim: Claim = "interface"): GameState {
  const locked = reduceEvent(lockedByAttempts(), commands.keepMotif(at(6)));
  return reduceEvent(
    locked,
    commands.recordInterpretation(claim, ["registered", "no-error"], at(7)),
  );
}

describe("session lifecycle", () => {
  it("starts at the invitation and moves to the desk only through the prologue", () => {
    const initial = createInitialState("session-1", T0);
    expect(initial.phase).toBe("invitation");
    expect(initial.revision).toBe(0);

    const started = reduceEvent(initial, commands.start("session-1", at(1)));
    expect(started.phase).toBe("prologue");
    expect(started.sessionId).toBe("session-1");

    const desk = reduceEvent(started, commands.completePrologue(at(2)));
    expect(desk.phase).toBe("desk");
    expect(desk.revision).toBe(2);
  });

  it("ignores a second start and a prologue completion from the wrong phase", () => {
    const initial = createInitialState("session-1", T0);
    const started = reduceEvent(initial, commands.start("session-1", at(1)));
    const secondStart = reduceEvent(started, commands.start("other", at(2)));
    expect(secondStart).toBe(started);
    expect(reduceEvent(initial, commands.completePrologue(at(3)))).toBe(initial);
  });

  it("ignores empty drafts", () => {
    const desk = atDesk();
    expect(submit(desk, "   ", 3)).toBe(desk);
  });
});

describe("desk attempts and the motif", () => {
  it("normalizes Persian variants and detects the motif", () => {
    expect(normalizeText("سه‌قطره‌خون")).toBe("سهقطرهخون");
    expect(isMotifTyped("سه قطره خون")).toBe(true);
    expect(isMotifTyped("سه‌قطره‌خون")).toBe(true);
    expect(isMotifTyped("سه قطرهٔ خون")).toBe(true);
    expect(isMotifTyped("3 قطره خون")).toBe(true);
    expect(isMotifTyped("سه قطره")).toBe(false);
  });

  it("locks after three submitted attempts", () => {
    let state = atDesk();
    state = submit(state, "نوشتهٔ اول", 3);
    expect(state.phase).toBe("desk");
    expect(state.attempts).toHaveLength(1);
    expect(state.pressure).toBeGreaterThan(0);

    state = submit(state, "نوشتهٔ دوم", 4);
    expect(state.phase).toBe("desk");
    expect(state.attempts).toHaveLength(2);

    state = submit(state, "نوشتهٔ سوم", 5);
    expect(state.phase).toBe("locked");
    expect(state.attempts).toHaveLength(3);
    expect(isLocked(state)).toBe(true);
    expect(state.attempts[2]?.index).toBe(3);
  });

  it("locks immediately when the motif is typed", () => {
    const state = submit(atDesk(), "امشب سه قطره خون روی کاغذ ماند", 3);
    expect(state.phase).toBe("locked");
    expect(state.attempts).toHaveLength(1);
    expect(state.motifTyped).toBe(true);
    expect(state.attempts[0]?.motifTyped).toBe(true);
  });

  it("does not accept more drafts after locking", () => {
    const locked = lockedByAttempts();
    expect(submit(locked, "یک تلاش دیگر", 6)).toBe(locked);
  });

  it("keeps the motif only from the locked phase", () => {
    const desk = atDesk();
    expect(reduceEvent(desk, commands.keepMotif(at(3)))).toBe(desk);

    const locked = lockedByAttempts();
    const kept = reduceEvent(locked, commands.keepMotif(at(6)));
    expect(kept.phase).toBe("interpretation");
    expect(kept.motifAccepted).toBe(true);
    expect(kept.complicity).toBe(1);
  });

  it("releases the hand only from the locked phase", () => {
    const desk = atDesk();
    expect(reduceEvent(desk, commands.releaseHand(at(3)))).toBe(desk);

    const released = reduceEvent(lockedByAttempts(), commands.releaseHand(at(6)));
    expect(released.phase).toBe("interpretation");
    expect(released.handReleased).toBe(true);
    expect(released.resistance).toBe(1);
  });
});

describe("interpretation and endings", () => {
  it("requires both a claim and at least one evidence item", () => {
    const locked = lockedByAttempts();
    const interpretation = reduceEvent(locked, commands.keepMotif(at(6)));
    expect(canRecordInterpretation(interpretation)).toBe(false);

    expect(
      reduceEvent(
        interpretation,
        commands.recordInterpretation("self", [], at(7)),
      ),
    ).toBe(interpretation);

    const recorded = reduceEvent(
      interpretation,
      commands.recordInterpretation("self", ["registered"], at(7)),
    );
    expect(recorded.interpretation.claim).toBe("self");
    expect(recorded.interpretation.evidence).toEqual(["registered"]);
    expect(canRecordInterpretation(recorded)).toBe(true);
  });

  it("rejects an interpretation before the desk is locked", () => {
    const desk = atDesk();
    expect(
      reduceEvent(
        desk,
        commands.recordInterpretation("self", ["registered"], at(3)),
      ),
    ).toBe(desk);
  });

  it("maps each filing to its ending and closes the U1 desk", () => {
    const cases: [Filing, string][] = [
      ["submit", "file"],
      ["conceal", "paper"],
      ["tear", "ash"],
      ["leave", "silence"],
    ];

    for (const [filing, ending] of cases) {
      const ended = reduceEvent(
        interpreted(),
        commands.disposeFile(filing, at(8)),
      );
      expect(ended.phase).toBe("u1Resolved");
      expect(ended.ending).toBe(ending);
      expect(ended.interpretation.filing).toBe(filing);
    }
  });

  it("rejects a filing before an interpretation is recorded", () => {
    const interpretation = reduceEvent(
      lockedByAttempts(),
      commands.keepMotif(at(6)),
    );
    expect(
      reduceEvent(interpretation, commands.disposeFile("submit", at(7))),
    ).toBe(interpretation);
  });
});

describe("settings and replay", () => {
  it("merges settings patches without changing the phase", () => {
    const state = atDesk();
    const changed = reduceEvent(
      state,
      commands.changeSettings({ muted: true, textScale: 1.15 }, at(3)),
    );
    expect(changed.settings.muted).toBe(true);
    expect(changed.settings.textScale).toBe(1.15);
    expect(changed.phase).toBe("desk");
    expect(changed.revision).toBe(state.revision + 1);
  });

  it("replays a complete event log deterministically", () => {
    const initial = createInitialState("session-1", T0);
    const events: GameEvent[] = [
      commands.start("session-1", at(1)),
      commands.completePrologue(at(2)),
      commands.submitDraft("نوشتهٔ اول", at(3)),
      commands.submitDraft("نوشتهٔ دوم", at(4)),
      commands.submitDraft("سه قطره خون", at(5)),
      commands.keepMotif(at(6)),
      commands.recordInterpretation("institution", ["motif-remained"], at(7)),
      commands.changeSettings({ muted: true }, at(8)),
      commands.disposeFile("conceal", at(9)),
    ];

    const direct = events.reduce(reduceEvent, initial);
    const replayed = replayEvents(events, initial);
    expect(replayed).toEqual(direct);
    expect(replayed.ending).toBe("paper");
    expect(replayed.settings.muted).toBe(true);
  });

  it("resets to a fresh invitation while preserving settings", () => {
    const changed = reduceEvent(
      atDesk(),
      commands.changeSettings({ highContrast: true }, at(3)),
    );
    const reset = reduceEvent(changed, commands.reset("session-2", at(4)));
    expect(reset.phase).toBe("invitation");
    expect(reset.sessionId).toBe("session-2");
    expect(reset.attempts).toHaveLength(0);
    expect(reset.settings.highContrast).toBe(true);
  });
});

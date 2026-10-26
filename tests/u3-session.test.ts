import { describe, expect, it } from "vitest";
import { commands } from "@/application/commands";
import {
  STATIONS,
  claimStageFor,
  createInitialState,
  reduceEvent,
  replayEvents,
} from "@/domain/session/reducer";
import type { Filing, GameEvent, GameState } from "@/domain/session/types";

const T0 = "2026-01-01T00:00:00.000Z";

function at(seconds: number): string {
  return new Date(Date.parse(T0) + seconds * 1000).toISOString();
}

function atNoise(filing: Filing = "conceal"): GameState {
  let state = createInitialState("session-1", T0);
  state = reduceEvent(state, commands.start("session-1", at(1)));
  state = reduceEvent(state, commands.completePrologue(at(2)));
  state = reduceEvent(state, commands.submitDraft("سه قطره خون", at(3)));
  state = reduceEvent(state, commands.keepMotif(at(4)));
  state = reduceEvent(
    state,
    commands.recordInterpretation("interface", ["motif-remained"], at(5)),
  );
  state = reduceEvent(state, commands.disposeFile(filing, at(6)));
  state = reduceEvent(state, commands.bridgeContinue(at(7)));
  return state;
}

/** مسیر انکار: کوتاه‌ترین راه رسیدن به u2Resolved. */
function resolvedU2(filing: Filing = "conceal"): GameState {
  return reduceEvent(atNoise(filing), commands.denyPage(at(8)));
}

function inWard(filing: Filing = "conceal"): GameState {
  return reduceEvent(resolvedU2(filing), commands.enterWard(at(9)));
}

function walkDay(
  start: GameState,
  startSeconds: number,
  withActs = true,
): GameState {
  let state = start;
  let clock = startSeconds;
  for (const station of STATIONS) {
    state = reduceEvent(state, commands.moveWard(station, at(clock++)));
    if (withActs) {
      state = reduceEvent(
        state,
        commands.noteStation(station, `obj-${station}`, at(clock++)),
      );
      state = reduceEvent(state, commands.sameAct(station, at(clock++)));
    }
    state = reduceEvent(state, commands.moveWard("yard", at(clock++)));
  }
  return state;
}

describe("U3 ward cycle", () => {
  it("opens the ward only from a resolved U2, for both outcomes", () => {
    const captured = (() => {
      let state = atNoise();
      state = reduceEvent(state, commands.surfaceMotif(1, 0.6, 0.3, at(9)));
      state = reduceEvent(state, commands.surfaceMotif(2, 0.3, 0.5, at(10)));
      state = reduceEvent(state, commands.surfaceMotif(3, 0.5, 0.8, at(11)));
      return reduceEvent(state, commands.captureMotif(at(12)));
    })();
    const fromCaptured = reduceEvent(captured, commands.enterWard(at(13)));
    expect(fromCaptured.phase).toBe("ward");
    expect(fromCaptured.unit).toBe("U3");

    const denied = reduceEvent(atNoise(), commands.denyPage(at(9)));
    const fromDenied = reduceEvent(denied, commands.enterWard(at(10)));
    expect(fromDenied.phase).toBe("ward");

    const noise = atNoise();
    expect(reduceEvent(noise, commands.enterWard(at(9)))).toBe(noise);
  });

  it("moves only between the yard and the stations", () => {
    const ward = inWard();
    expect(reduceEvent(ward, commands.moveWard("yard", at(9)))).toBe(ward);

    const garden = reduceEvent(ward, commands.moveWard("garden", at(9)));
    expect(garden.u3.at).toBe("garden");
    expect(garden.u3.visited).toEqual(["garden"]);

    // از ایستگاه، مستقیم به ایستگاه دیگری نمی‌رود.
    expect(reduceEvent(garden, commands.moveWard("cellar", at(10)))).toBe(garden);

    const back = reduceEvent(garden, commands.moveWard("yard", at(11)));
    expect(back.u3.at).toBe("yard");
  });

  it("records notes only while standing in the station, without duplicates", () => {
    const ward = inWard();
    expect(reduceEvent(ward, commands.noteStation("garden", "sky", at(9)))).toBe(ward);

    const garden = reduceEvent(ward, commands.moveWard("garden", at(9)));
    const noted = reduceEvent(garden, commands.noteStation("garden", "sky", at(10)));
    expect(noted.u3.noted).toEqual(["garden:sky"]);
    expect(reduceEvent(noted, commands.noteStation("garden", "sky", at(11)))).toBe(noted);
    expect(reduceEvent(noted, commands.noteStation("garden", "", at(11)))).toBe(noted);
  });

  it("allows one same-act per station per day", () => {
    const ward = inWard();
    const garden = reduceEvent(ward, commands.moveWard("garden", at(9)));
    const once = reduceEvent(garden, commands.sameAct("garden", at(10)));
    expect(once.u3.sameActs).toBe(1);
    expect(once.u3.sameToday).toEqual(["garden"]);
    expect(reduceEvent(once, commands.sameAct("garden", at(11)))).toBe(once);
  });

  it("loops the day after all four stations and keeps notes", () => {
    const ward = inWard();
    const day1 = walkDay(ward, 10);
    expect(day1.u3.day).toBe(2);
    expect(day1.u3.loops).toBe(1);
    expect(day1.u3.visited).toEqual([]);
    expect(day1.u3.sameToday).toEqual([]);
    expect(day1.u3.noted).toHaveLength(4);
    expect(day1.u3.sameActs).toBe(4);
    expect(day1.u3.at).toBe("yard");
    expect(day1.u3.done).toBe(false);
  });

  it("marks the cycle done after the second day", () => {
    const day2 = walkDay(walkDay(inWard(), 10), 40);
    expect(day2.u3.day).toBe(2);
    expect(day2.u3.done).toBe(true);
    expect(day2.u3.at).toBe("yard");
    expect(day2.u3.sameActs).toBe(8);
    expect(claimStageFor(day2.u3.sameActs)).toBe(4);
  });

  it("rejects the exit until the sentence is dissolved, then closes the ward", () => {
    const ward = inWard();
    expect(reduceEvent(ward, commands.resolveWard(at(9)))).toBe(ward);

    // روز دوم بدون کنش همسانی: چرخه تمام است اما جمله نمانده را نگفته.
    const quiet = walkDay(walkDay(ward, 10), 40, false);
    expect(quiet.u3.done).toBe(true);
    expect(quiet.u3.sameActs).toBe(4);
    expect(reduceEvent(quiet, commands.resolveWard(at(99)))).toBe(quiet);

    const full = walkDay(walkDay(ward, 10), 40);
    const resolved = reduceEvent(full, commands.resolveWard(at(99)));
    expect(resolved.phase).toBe("u3Resolved");

    // دروازه از u3Resolved بسته است؛ گذار U3→U4 از طریق صف شام می‌گذرد.
    expect(reduceEvent(resolved, commands.acknowledgeBoundary(at(100)))).toBe(resolved);
    const queued = reduceEvent(resolved, commands.joinQueue(at(100)));
    expect(queued.phase).toBe("queue");
    expect(queued.unit).toBe("U4");
  });

  it("lets missed stations be visited after the cycle ends", () => {
    const quiet = walkDay(walkDay(inWard(), 10), 40, false);
    // روز دوم بدون کنش؛ حالا در حیاط و done است.
    let state = reduceEvent(quiet, commands.moveWard("cellar", at(99)));
    state = reduceEvent(state, commands.sameAct("cellar", at(100)));
    state = reduceEvent(state, commands.moveWard("yard", at(101)));
    expect(state.u3.sameActs).toBe(5);
    expect(state.u3.done).toBe(true);
  });

  it("replays a full U1–U3 log deterministically", () => {
    let clock = 14;
    const tick = () => at(clock++);
    const walk = STATIONS.flatMap((station) => [
      commands.moveWard(station, tick()),
      commands.noteStation(station, `obj-${station}`, tick()),
      commands.sameAct(station, tick()),
      commands.moveWard("yard", tick()),
    ]);

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
      ...walk,
      ...walk,
      commands.resolveWard(at(150)),
      commands.joinQueue(at(151)),
      commands.openMenu(at(152)),
      commands.pickDish("ash", at(153)),
      commands.pickDish("chelo", at(154)),
      commands.offerTray(at(155)),
      commands.takeTray(at(156)),
      commands.acknowledgeBoundary(at(157)),
    ];

    const initial = createInitialState("session-1", T0);
    const direct = events.reduce(reduceEvent, initial);
    const replayed = replayEvents(events, initial);
    expect(replayed).toEqual(direct);
    expect(replayed.phase).toBe("boundary");
    expect(replayed.u3.loops).toBe(1);
    expect(replayed.u3.done).toBe(true);
    expect(replayed.u3.sameActs).toBe(8);
    expect(replayed.u3.noted).toHaveLength(4);
    expect(replayed.motifOwner).toBe("discovered");
  });

  it("resets mid-ward back to a fresh invitation while preserving settings", () => {
    const twice = walkDay(walkDay(inWard("tear"), 10), 40);
    const changed = reduceEvent(
      twice,
      commands.changeSettings({ highContrast: true }, at(120)),
    );
    const reset = reduceEvent(changed, commands.reset("session-2", at(121)));
    expect(reset.phase).toBe("invitation");
    expect(reset.unit).toBe("U1");
    expect(reset.u3).toEqual({
      day: 1,
      at: "yard",
      visited: [],
      sameToday: [],
      noted: [],
      sameActs: 0,
      done: false,
      loops: 0,
    });
    expect(reset.settings.highContrast).toBe(true);
  });
});

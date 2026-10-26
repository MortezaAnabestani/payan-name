import { describe, expect, it } from "vitest";
import { commands } from "@/application/commands";
import { DISH_CONTENT, U4, trayLineFor } from "@/content/u4";
import {
  CALORIE_QUOTA,
  DISHES,
  STATIONS,
  U4_THRESHOLD,
  claimStageFor,
  createInitialState,
  reduceEvent,
  replayEvents,
  u4TrayAccepted,
} from "@/domain/session/reducer";
import type { Filing, GameEvent, GameState } from "@/domain/session/types";

const T0 = "2026-01-01T00:00:00.000Z";

function at(seconds: number): string {
  return new Date(Date.parse(T0) + seconds * 1000).toISOString();
}

/** کوتاه‌ترین مسیر تا u3Resolved: انکار صفحه، چرخهٔ کامل دو روزه با کنش‌ها. */
function walkDay(start: GameState, startSeconds: number): GameState {
  let state = start;
  let clock = startSeconds;
  for (const station of STATIONS) {
    state = reduceEvent(state, commands.moveWard(station, at(clock++)));
    state = reduceEvent(
      state,
      commands.noteStation(station, `obj-${station}`, at(clock++)),
    );
    state = reduceEvent(state, commands.sameAct(station, at(clock++)));
    state = reduceEvent(state, commands.moveWard("yard", at(clock++)));
  }
  return state;
}

function resolvedU3(filing: Filing = "conceal"): GameState {
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
  state = reduceEvent(state, commands.denyPage(at(8)));
  state = reduceEvent(state, commands.enterWard(at(9)));
  state = walkDay(walkDay(state, 10), 40);
  return reduceEvent(state, commands.resolveWard(at(70)));
}

function inQueue(): GameState {
  return reduceEvent(resolvedU3(), commands.joinQueue(at(80)));
}

function inMenu(): GameState {
  return reduceEvent(inQueue(), commands.openMenu(at(81)));
}

describe("U4 menu cycle", () => {
  it("opens the queue only from a resolved U3 or U4", () => {
    const fromU3 = inQueue();
    expect(fromU3.phase).toBe("queue");
    expect(fromU3.unit).toBe("U4");

    // پس از پایان U4 هم می‌توان دوباره سرِ صف نشست (قاعدهٔ محوشونده).
    const afterU4 = reduceEvent(
      reduceEvent(
        reduceEvent(inMenu(), commands.pickDish("ash", at(90))),
        commands.pickDish("chelo", at(91)),
      ),
      commands.offerTray(at(92)),
    );
    const done = reduceEvent(afterU4, commands.takeTray(at(93)));
    expect(done.phase).toBe("u4Resolved");
    const rejoined = reduceEvent(done, commands.joinQueue(at(94)));
    expect(rejoined.phase).toBe("queue");

    // از فازهای دیگر صف باز نمی‌شود.
    const ward = reduceEvent(
      reduceEvent(resolvedU3(), commands.joinQueue(at(80))),
      commands.openMenu(at(81)),
    );
    expect(reduceEvent(ward, commands.joinQueue(at(82)))).toBe(ward);
    const fresh = createInitialState("session-1", T0);
    expect(reduceEvent(fresh, commands.joinQueue(at(80)))).toBe(fresh);
  });

  it("opens the board only from the queue, once", () => {
    const queued = inQueue();
    const menu = reduceEvent(queued, commands.openMenu(at(82)));
    expect(menu.phase).toBe("menu");
    // یک‌بار که فهرست باز شد، بازگشت به صف با MENU_OPENED ممکن نیست.
    expect(reduceEvent(menu, commands.openMenu(at(83)))).toBe(menu);
    const fresh = createInitialState("session-1", T0);
    expect(reduceEvent(fresh, commands.openMenu(at(82)))).toBe(fresh);
  });

  it("counts every pick without any differentiating outcome", () => {
    let state = inMenu();
    for (const dish of DISHES) {
      state = reduceEvent(state, commands.pickDish(dish, at(90)));
    }
    expect(state.u4.picks).toBe(4);
    expect(state.u4.chosen).toEqual([...DISHES]);
    expect(state.u4.quotaMet).toBe(true);
    // سهمیه ثابت است؛ بیشتر از سهمیه هم همان سهمیه می‌ماند.
    expect(CALORIE_QUOTA).toBe(1);
    // خوراک نامعتبر ثبت نمی‌شود.
    const bogus = reduceEvent(
      state,
      { type: "DISH_PICKED", dish: "kebab" as never, at: at(99) },
    );
    expect(bogus).toBe(state);
    // بیرون از منو هم برداشتن ممکن نیست.
    expect(
      reduceEvent(inQueue(), commands.pickDish("ash", at(100))),
    ).toEqual(inQueue());
  });

  it("offers the tray only past the threshold — more spoons change nothing", () => {
    const one = reduceEvent(inMenu(), commands.pickDish("ash", at(90)));
    expect(u4TrayAccepted(one.u4.picks)).toBe(false);
    expect(reduceEvent(one, commands.offerTray(at(91)))).toBe(one);

    const two = reduceEvent(one, commands.pickDish("shirbirinj", at(92)));
    expect(two.u4.picks).toBe(U4_THRESHOLD);
    const offered = reduceEvent(two, commands.offerTray(at(93)));
    expect(offered.phase).toBe("tray");

    // حتی اگر همه را برداشته باشی، همان سینی است و همان tray.
    const four = DISHES.reduce(
      (s, dish) => reduceEvent(s, commands.pickDish(dish, at(94))),
      inMenu(),
    );
    const offeredFour = reduceEvent(four, commands.offerTray(at(95)));
    expect(offeredFour.phase).toBe("tray");
    expect(offeredFour.u4.picks).toBe(4);
    expect(offered.u4.done).toBe(offeredFour.u4.done);
  });

  it("takes the tray once, resolving into u4Resolved", () => {
    const offered = reduceEvent(
      reduceEvent(
        reduceEvent(inMenu(), commands.pickDish("ash", at(90))),
        commands.pickDish("chelo", at(91)),
      ),
      commands.offerTray(at(92)),
    );
    const taken = reduceEvent(offered, commands.takeTray(at(93)));
    expect(taken.phase).toBe("u4Resolved");
    expect(taken.u4.done).toBe(true);
    expect(reduceEvent(taken, commands.takeTray(at(94)))).toBe(taken);
    // حلقهٔ تکرار: نشستن دوباره سرِ صف، همان منو، همان سهمیه.
    const again = reduceEvent(
      reduceEvent(taken, commands.joinQueue(at(95))),
      commands.openMenu(at(96)),
    );
    expect(again.phase).toBe("menu");
    expect(again.u4.picks).toBe(2); // شمارندهٔ سینی پاک نمی‌شود — تکرار بی‌پیامد
  });

  it("gates the boundary behind the tray", () => {
    const queued = inQueue();
    expect(reduceEvent(queued, commands.acknowledgeBoundary(at(90)))).toBe(queued);
    const menu = inMenu();
    expect(reduceEvent(menu, commands.acknowledgeBoundary(at(91)))).toBe(menu);
    const taken = reduceEvent(
      reduceEvent(
        reduceEvent(
          reduceEvent(menu, commands.pickDish("nanpanir", at(92))),
          commands.pickDish("ash", at(93)),
        ),
        commands.offerTray(at(94)),
      ),
      commands.takeTray(at(95)),
    );
    const boundary = reduceEvent(taken, commands.acknowledgeBoundary(at(96)));
    expect(boundary.phase).toBe("boundary");
    expect(reduceEvent(boundary, commands.acknowledgeBoundary(at(97)))).toBe(boundary);
  });

  it("replays a full U1–U4 log deterministically", () => {
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
      ...DISHES.map((dish) => commands.pickDish(dish, at(153))),
      commands.offerTray(at(158)),
      commands.takeTray(at(159)),
      commands.acknowledgeBoundary(at(160)),
    ];

    const initial = createInitialState("session-1", T0);
    const direct = events.reduce(reduceEvent, initial);
    const replayed = replayEvents(events, initial);
    expect(replayed).toEqual(direct);
    expect(replayed.phase).toBe("boundary");
    expect(replayed.u4.picks).toBe(4);
    expect(replayed.u4.chosen).toEqual([...DISHES]);
    expect(replayed.u4.done).toBe(true);
    expect(replayed.u4.quotaMet).toBe(true);
  });

  it("resets mid-menu back to a fresh invitation while preserving settings", () => {
    const menu = reduceEvent(
      inMenu(),
      commands.pickDish("ash", at(90)),
    );
    const changed = reduceEvent(
      menu,
      commands.changeSettings({ muted: true }, at(91)),
    );
    const reset = reduceEvent(changed, commands.reset("session-2", at(92)));
    expect(reset.phase).toBe("invitation");
    expect(reset.u4).toEqual({ picks: 0, chosen: [], quotaMet: false, done: false });
    expect(reset.settings.muted).toBe(true);
  });
});

describe("U4 content", () => {
  it("maps every dish id to matching content", () => {
    for (const dish of DISHES) {
      expect(DISH_CONTENT[dish].id).toBe(dish);
      expect(DISH_CONTENT[dish].label.length).toBeGreaterThan(0);
      expect(DISH_CONTENT[dish].trayLine.length).toBeGreaterThan(0);
    }
  });

  it("keeps the archive line honest about the erasure", () => {
    expect(trayLineFor(0, false)).toContain("هنوز");
    expect(trayLineFor(3, false)).toContain("همان سهمیه");
    expect(trayLineFor(3, true)).toContain("طعمِ هیچ انتخابی نماند");
  });

  it("pins U4 to its source sentence", () => {
    expect(U4.id).toBe("U4");
    expect(U4.order).toBe(4);
    expect(U4.type).toBe("catalyst");
    expect(U4.source.quote).toContain("بخور و نمیر");
    expect(U4.level).toBe(4);
    expect(claimStageFor(8)).toBe(4);
  });
});

import {
  ATTEMPT_LIMIT,
  CONTENT_VERSION,
  SCHEMA_VERSION,
  type Claim,
  type DishId,
  type EndingId,
  type EvidenceId,
  type Filing,
  type GameEvent,
  type GameState,
  type Settings,
  type StationId,
} from "./types";

export const DEFAULT_SETTINGS: Settings = {
  muted: false,
  reduceMotion: false,
  highContrast: false,
  textScale: 1,
};

export const MOTIF = "سه قطره خون";

const CLAIMS: Claim[] = ["self", "institution", "interface"];
const EVIDENCE: EvidenceId[] = [
  "intact-before",
  "registered",
  "motif-remained",
  "no-error",
];
const FILINGS: Filing[] = ["submit", "conceal", "tear", "leave"];

export function normalizeText(text: string): string {
  return text
    .replace(/[\u200c\u200d\u200e\u200f\u202a-\u202e]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[^\u0600-\u06ff0-9a-zA-Z]/g, "")
    .toLowerCase();
}

export function isMotifTyped(text: string): boolean {
  const normalized = normalizeText(text);
  return (
    normalized.includes("سهقطرهخون") ||
    normalized.includes("3قطرهخون") ||
    normalized.includes("سهقطرهٔخون")
  );
}

export function createInitialState(
  sessionId: string,
  now = new Date().toISOString(),
  settings: Settings = DEFAULT_SETTINGS,
): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    sessionId,
    phase: "invitation",
    unit: "U1",
    attempts: [],
    pressure: 0,
    complicity: 0,
    resistance: 0,
    motifTyped: false,
    motifAccepted: false,
    handReleased: false,
    motifOwner: "unknown",
    u2: { surfaced: [], outcome: null },
    u3: {
      day: 1,
      at: "yard",
      visited: [],
      sameToday: [],
      noted: [],
      sameActs: 0,
      done: false,
      loops: 0,
    },
    u4: { picks: 0, chosen: [], quotaMet: false, done: false },
    interpretation: {
      claim: null,
      evidence: [],
      filing: null,
      recordedAt: null,
    },
    ending: null,
    settings: { ...settings },
    createdAt: now,
    updatedAt: now,
    revision: 0,
  };
}

function withRevision(state: GameState, patch: Partial<GameState>, at: string): GameState {
  return {
    ...state,
    ...patch,
    updatedAt: at,
    revision: state.revision + 1,
  };
}

function endingFor(filing: Filing): EndingId {
  if (filing === "submit") return "file";
  if (filing === "conceal") return "paper";
  if (filing === "tear") return "ash";
  return "silence";
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** چهار فضای U3؛ درها همه به حیاط برمی‌گردند. */
export const STATIONS: readonly StationId[] = [
  "garden",
  "cellar",
  "infirmary",
  "night",
];

/** سقف مراحل محوشدن ادعا؛ با هر دو کنش همسانی یک پله. */
export const CLAIM_STAGES = 4;

export const CLAIM_SENTENCE =
  "هیچ وجه اشتراکی بین ما نیست؛ من از زمین تا آسمان با آنها فرق دارم.";

/** مرحلهٔ محوشدن ادعای تفاوت: ۰ = دست‌نخورده، ۴ = محو. */
export function claimStageFor(sameActs: number): number {
  return Math.min(CLAIM_STAGES, Math.floor(sameActs / 2));
}

/** چهار خوراکِ فهرست، به همان توالی بی‌علتِ متن منبع. */
export const DISHES: readonly DishId[] = [
  "ash",
  "shirbirinj",
  "chelo",
  "nanpanir",
];

/** سهمیهٔ کالری «بخور و نمیر»: ثابت و غیرقابل‌مذاکره. */
export const CALORIE_QUOTA = 1;

/** آستانهٔ پذیرش سینی: تا دو انتخاب نکرده‌ای، سینی به دستت نمی‌آید. */
export const U4_THRESHOLD = 2;

/** آیا سینی پذیرفته شده و گذار به U5 باز است؟ (منطق محوشوندهٔ U4) */
export function u4TrayAccepted(picks: number): boolean {
  return picks >= U4_THRESHOLD;
}

export function reduceEvent(state: GameState, event: GameEvent): GameState {
  if (event.type === "HYDRATE") {
    return event.state;
  }

  if (event.type === "SESSION_RESET") {
    return createInitialState(event.sessionId, event.at, state.settings);
  }

  if (event.type === "SESSION_STARTED") {
    if (state.phase !== "invitation") return state;
    return withRevision(
      state,
      {
        sessionId: event.sessionId,
        phase: "prologue",
        createdAt: event.at,
      },
      event.at,
    );
  }

  if (event.type === "PROLOGUE_COMPLETED") {
    if (state.phase !== "prologue") return state;
    return withRevision(state, { phase: "desk" }, event.at);
  }

  if (event.type === "DRAFT_SUBMITTED") {
    if (state.phase !== "desk") return state;
    const text = event.text.trim();
    if (!text) return state;
    if (state.attempts.length >= ATTEMPT_LIMIT) return state;

    const motifTyped = isMotifTyped(text);
    const attempt = {
      index: state.attempts.length + 1,
      text,
      length: text.length,
      motifTyped,
      at: event.at,
    };
    const pressure = Math.min(
      100,
      state.pressure + 18 + Math.min(30, Math.ceil(text.length / 40)),
    );
    const attempts = [...state.attempts, attempt];
    const locked = motifTyped || attempts.length >= ATTEMPT_LIMIT;

    return withRevision(
      state,
      {
        attempts,
        motifTyped: state.motifTyped || motifTyped,
        pressure,
        phase: locked ? "locked" : "desk",
      },
      event.at,
    );
  }

  if (event.type === "MOTIF_KEPT") {
    if (state.phase !== "locked") return state;
    return withRevision(
      state,
      {
        motifAccepted: true,
        complicity: state.complicity + 1,
        phase: "interpretation",
      },
      event.at,
    );
  }

  if (event.type === "HAND_RELEASED") {
    if (state.phase !== "locked") return state;
    return withRevision(
      state,
      {
        handReleased: true,
        resistance: state.resistance + 1,
        phase: "interpretation",
      },
      event.at,
    );
  }

  if (event.type === "INTERPRETATION_RECORDED") {
    if (state.phase !== "interpretation") return state;
    if (!CLAIMS.includes(event.claim)) return state;
    const evidence = [...new Set(event.evidence.filter((item) => EVIDENCE.includes(item)))];
    if (evidence.length === 0) return state;
    return withRevision(
      state,
      {
        interpretation: {
          ...state.interpretation,
          claim: event.claim,
          evidence,
          recordedAt: event.at,
        },
      },
      event.at,
    );
  }

  if (event.type === "FILE_DISPOSED") {
    if (state.phase !== "interpretation") return state;
    if (!state.interpretation.claim || state.interpretation.evidence.length === 0) {
      return state;
    }
    if (!FILINGS.includes(event.filing)) return state;
    return withRevision(
      state,
      {
        interpretation: {
          ...state.interpretation,
          filing: event.filing,
        },
        ending: endingFor(event.filing),
        phase: "u1Resolved",
      },
      event.at,
    );
  }

  if (event.type === "BRIDGE_CONTINUED") {
    if (state.phase !== "u1Resolved") return state;
    return withRevision(
      state,
      {
        unit: "U2",
        phase: "noise",
      },
      event.at,
    );
  }

  if (event.type === "MOTIF_SURFACED") {
    if (state.phase !== "noise") return state;
    const expected = state.u2.surfaced.length + 1;
    if (event.index !== expected || expected > 3) return state;
    if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) return state;
    const mark = {
      index: event.index,
      x: clamp01(event.x),
      y: clamp01(event.y),
      at: event.at,
    };
    return withRevision(
      state,
      {
        u2: { ...state.u2, surfaced: [...state.u2.surfaced, mark] },
      },
      event.at,
    );
  }

  if (event.type === "MOTIF_CAPTURED") {
    if (state.phase !== "noise") return state;
    if (state.u2.surfaced.length < 3) return state;
    return withRevision(
      state,
      {
        u2: { ...state.u2, outcome: "captured" },
        motifOwner: "discovered",
        complicity: state.complicity + 1,
        phase: "u2Resolved",
      },
      event.at,
    );
  }

  if (event.type === "PAGE_DENIED") {
    if (state.phase !== "noise") return state;
    return withRevision(
      state,
      {
        u2: { ...state.u2, outcome: "denied" },
        motifOwner: "denied",
        phase: "u2Resolved",
      },
      event.at,
    );
  }

  if (event.type === "BOUNDARY_ACKNOWLEDGED") {
    if (state.phase !== "u4Resolved") return state;
    return withRevision(state, { phase: "boundary" }, event.at);
  }

  if (event.type === "WARD_ENTERED") {
    if (state.phase !== "u2Resolved") return state;
    return withRevision(
      state,
      {
        unit: "U3",
        phase: "ward",
      },
      event.at,
    );
  }

  if (event.type === "WARD_MOVED") {
    if (state.phase !== "ward") return state;
    const u3 = state.u3;
    const to = event.to;
    const enteringStation =
      to !== "yard" && STATIONS.includes(to) && u3.at === "yard";
    const leavingStation = to === "yard" && u3.at !== "yard";
    if (!enteringStation && !leavingStation) return state;

    if (enteringStation) {
      const visited = u3.visited.includes(to)
        ? u3.visited
        : [...u3.visited, to];
      return withRevision(state, { u3: { ...u3, at: to, visited } }, event.at);
    }

    const complete = STATIONS.every((station) => u3.visited.includes(station));
    if (complete && u3.day === 1) {
      // شب می‌گذرد و همان روز از نو آغاز می‌شود.
      return withRevision(
        state,
        {
          u3: {
            ...u3,
            day: 2,
            loops: u3.loops + 1,
            visited: [],
            sameToday: [],
            at: "yard",
          },
        },
        event.at,
      );
    }
    if (complete && u3.day === 2) {
      return withRevision(state, { u3: { ...u3, at: "yard", done: true } }, event.at);
    }
    return withRevision(state, { u3: { ...u3, at: "yard" } }, event.at);
  }

  if (event.type === "STATION_NOTED") {
    if (state.phase !== "ward") return state;
    if (state.u3.at !== event.station) return state;
    if (event.object.length === 0) return state;
    const key = `${event.station}:${event.object}`;
    if (state.u3.noted.includes(key)) return state;
    return withRevision(
      state,
      { u3: { ...state.u3, noted: [...state.u3.noted, key] } },
      event.at,
    );
  }

  if (event.type === "SAME_ACT") {
    if (state.phase !== "ward") return state;
    if (state.u3.at !== event.station) return state;
    if (state.u3.sameToday.includes(event.station)) return state;
    return withRevision(
      state,
      {
        u3: {
          ...state.u3,
          sameToday: [...state.u3.sameToday, event.station],
          sameActs: state.u3.sameActs + 1,
        },
      },
      event.at,
    );
  }

  if (event.type === "WARD_RESOLVED") {
    if (state.phase !== "ward") return state;
    if (!state.u3.done || state.u3.at !== "yard") return state;
    if (claimStageFor(state.u3.sameActs) < CLAIM_STAGES) return state;
    return withRevision(state, { phase: "u3Resolved" }, event.at);
  }

  // ---- U4 — «منوی بخور و نمیر» (کاتالیزور تودرتو در U5) ----
  // قاعدهٔ محوشونده: هر انتخاب از منو به همان سینی و همان سهمیه می‌رسد.
  // هیچ پیامدِ افتراقی برای دیگ غذا ثبت نمی‌شود؛ انتخاب فقط آیین است.

  if (event.type === "QUEUE_JOINED") {
    if (state.phase !== "u3Resolved") return state;
    return withRevision(
      state,
      { unit: "U4", phase: "queue" },
      event.at,
    );
  }

  // ورود به منو از صف؛ یک‌بار که فهرست باز شد، همان فهرست می‌ماند.
  if (event.type === "MENU_OPENED") {
    if (state.phase !== "queue") return state;
    return withRevision(state, { phase: "menu" }, event.at);
  }

  if (event.type === "DISH_PICKED") {
    if (state.phase !== "menu") return state;
    if (!DISHES.includes(event.dish)) return state;
    const picks = state.u4.picks + 1;
    // نوار کالری کمی بالا می‌رود و سپس به همان حد بازمی‌گردد:
    // سهمیه ثابت است، فارغ از این‌که کدام خوراک را برداشته‌ای.
    return withRevision(
      state,
      {
        u4: {
          ...state.u4,
          picks,
          chosen: [...state.u4.chosen, event.dish],
          quotaMet: true,
        },
      },
      event.at,
    );
  }

  // سینی فقط پس از آستانه به دست می‌آید؛ انتخابِ بیشتر هم همان سینی را می‌دهد.
  if (event.type === "TRAY_OFFERED") {
    if (state.phase !== "menu") return state;
    if (!u4TrayAccepted(state.u4.picks)) return state;
    return withRevision(state, { phase: "tray" }, event.at);
  }

  if (event.type === "TRAY_TAKEN") {
    if (state.phase !== "tray") return state;
    return withRevision(
      state,
      { u4: { ...state.u4, done: true }, phase: "u4Resolved" },
      event.at,
    );
  }

  if (event.type === "SETTINGS_CHANGED") {
    return withRevision(
      state,
      {
        settings: {
          ...state.settings,
          ...event.settings,
        },
      },
      event.at,
    );
  }

  return state;
}

export function replayEvents(events: GameEvent[], initial: GameState): GameState {
  return events.reduce(reduceEvent, initial);
}

export function isLocked(state: GameState): boolean {
  return state.phase === "locked";
}

export function canRecordInterpretation(state: GameState): boolean {
  return (
    state.phase === "interpretation" &&
    state.interpretation.claim !== null &&
    state.interpretation.evidence.length > 0
  );
}

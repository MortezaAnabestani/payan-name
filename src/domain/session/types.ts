export const CONTENT_VERSION = "three-drops-ch1-v1";
export const SCHEMA_VERSION = 1;
export const ATTEMPT_LIMIT = 3;

export type Phase =
  | "invitation"
  | "prologue"
  | "desk"
  | "locked"
  | "interpretation"
  | "u1Resolved"
  | "noise"
  | "u2Resolved"
  | "ward"
  | "u3Resolved"
  | "boundary";

export type Claim = "self" | "institution" | "interface";
export type EvidenceId = "intact-before" | "registered" | "motif-remained" | "no-error";
export type Filing = "submit" | "conceal" | "tear" | "leave";
export type EndingId = "file" | "paper" | "ash" | "silence";

/** واحد جاری جلسه. G1/پیش‌درآمد بخشی از U1 شمرده می‌شود. */
export type UnitId = "U1" | "U2" | "U3";

/** چهار فضای U3 که درها همه به حیاط بازمی‌گردند. */
export type StationId = "garden" | "cellar" | "infirmary" | "night";

export interface U3State {
  day: 1 | 2;
  at: StationId | "yard";
  /** فضای دیده‌شده در روز جاری. */
  visited: StationId[];
  /** کنش همسانی‌های انجام‌شده در روز جاری (هر فضا یک‌بار در روز). */
  sameToday: StationId[];
  /** اشیای بررسی‌شده؛ الگوی «station:object» و ماندگار میان روزها. */
  noted: string[];
  sameActs: number;
  /** چرخهٔ کامل روز دوم تمام شده است. */
  done: boolean;
  /** شمار چرخه‌های تکرارشده (۱ پس از پایان روز اول). */
  loops: number;
}

/** مالکیت تفسیری «سه قطره خون»؛ تا U9 نامعلوم/کشف/انکار می‌ماند. */
export type MotifOwner = "unknown" | "discovered" | "denied";

export type U2Outcome = "captured" | "denied";

export interface SurfaceMark {
  index: 1 | 2 | 3;
  x: number;
  y: number;
  at: string;
}

export interface U2State {
  surfaced: SurfaceMark[];
  outcome: U2Outcome | null;
}

export interface Settings {
  muted: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  textScale: 1 | 1.15 | 1.3;
}

export interface Attempt {
  index: number;
  text: string;
  length: number;
  motifTyped: boolean;
  at: string;
}

export interface Interpretation {
  claim: Claim | null;
  evidence: EvidenceId[];
  filing: Filing | null;
  recordedAt: string | null;
}

export interface GameState {
  schemaVersion: number;
  contentVersion: string;
  sessionId: string;
  phase: Phase;
  unit: UnitId;
  attempts: Attempt[];
  pressure: number;
  complicity: number;
  resistance: number;
  motifTyped: boolean;
  motifAccepted: boolean;
  handReleased: boolean;
  motifOwner: MotifOwner;
  u2: U2State;
  u3: U3State;
  interpretation: Interpretation;
  ending: EndingId | null;
  settings: Settings;
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export type GameEvent =
  | { type: "HYDRATE"; state: GameState }
  | { type: "SESSION_STARTED"; sessionId: string; at: string }
  | { type: "PROLOGUE_COMPLETED"; at: string }
  | { type: "DRAFT_SUBMITTED"; text: string; at: string }
  | { type: "MOTIF_KEPT"; at: string }
  | { type: "HAND_RELEASED"; at: string }
  | {
      type: "INTERPRETATION_RECORDED";
      claim: Claim;
      evidence: EvidenceId[];
      at: string;
    }
  | { type: "FILE_DISPOSED"; filing: Filing; at: string }
  | { type: "BRIDGE_CONTINUED"; at: string }
  | { type: "MOTIF_SURFACED"; index: 1 | 2 | 3; x: number; y: number; at: string }
  | { type: "MOTIF_CAPTURED"; at: string }
  | { type: "PAGE_DENIED"; at: string }
  | { type: "WARD_ENTERED"; at: string }
  | { type: "WARD_MOVED"; to: StationId | "yard"; at: string }
  | { type: "STATION_NOTED"; station: StationId; object: string; at: string }
  | { type: "SAME_ACT"; station: StationId; at: string }
  | { type: "WARD_RESOLVED"; at: string }
  | { type: "BOUNDARY_ACKNOWLEDGED"; at: string }
  | { type: "SETTINGS_CHANGED"; settings: Partial<Settings>; at: string }
  | { type: "SESSION_RESET"; sessionId: string; at: string };

export interface StoredSession {
  schemaVersion: number;
  contentVersion: string;
  sessionId: string;
  events: GameEvent[];
  snapshot: GameState | null;
  savedAt: string;
}

import type {
  Claim,
  EvidenceId,
  Filing,
  GameEvent,
  Settings,
  StationId,
} from "@/domain/session/types";

const now = () => new Date().toISOString();

export const commands = {
  start(sessionId: string, at = now()): GameEvent {
    return { type: "SESSION_STARTED", sessionId, at };
  },

  completePrologue(at = now()): GameEvent {
    return { type: "PROLOGUE_COMPLETED", at };
  },

  submitDraft(text: string, at = now()): GameEvent {
    return { type: "DRAFT_SUBMITTED", text, at };
  },

  keepMotif(at = now()): GameEvent {
    return { type: "MOTIF_KEPT", at };
  },

  releaseHand(at = now()): GameEvent {
    return { type: "HAND_RELEASED", at };
  },

  recordInterpretation(claim: Claim, evidence: EvidenceId[], at = now()): GameEvent {
    return { type: "INTERPRETATION_RECORDED", claim, evidence, at };
  },

  disposeFile(filing: Filing, at = now()): GameEvent {
    return { type: "FILE_DISPOSED", filing, at };
  },

  bridgeContinue(at = now()): GameEvent {
    return { type: "BRIDGE_CONTINUED", at };
  },

  surfaceMotif(index: 1 | 2 | 3, x: number, y: number, at = now()): GameEvent {
    return { type: "MOTIF_SURFACED", index, x, y, at };
  },

  captureMotif(at = now()): GameEvent {
    return { type: "MOTIF_CAPTURED", at };
  },

  denyPage(at = now()): GameEvent {
    return { type: "PAGE_DENIED", at };
  },

  acknowledgeBoundary(at = now()): GameEvent {
    return { type: "BOUNDARY_ACKNOWLEDGED", at };
  },

  enterWard(at = now()): GameEvent {
    return { type: "WARD_ENTERED", at };
  },

  moveWard(to: StationId | "yard", at = now()): GameEvent {
    return { type: "WARD_MOVED", to, at };
  },

  noteStation(station: StationId, object: string, at = now()): GameEvent {
    return { type: "STATION_NOTED", station, object, at };
  },

  sameAct(station: StationId, at = now()): GameEvent {
    return { type: "SAME_ACT", station, at };
  },

  resolveWard(at = now()): GameEvent {
    return { type: "WARD_RESOLVED", at };
  },

  changeSettings(settings: Partial<Settings>, at = now()): GameEvent {
    return { type: "SETTINGS_CHANGED", settings, at };
  },

  reset(sessionId: string, at = now()): GameEvent {
    return { type: "SESSION_RESET", sessionId, at };
  },
};

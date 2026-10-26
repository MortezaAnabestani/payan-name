import {
  createInitialState,
  replayEvents,
} from "@/domain/session/reducer";
import {
  CONTENT_VERSION,
  SCHEMA_VERSION,
  type GameEvent,
  type GameState,
  type StoredSession,
} from "@/domain/session/types";

const STORAGE_KEY = "three-drops:session:v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export class LocalSessionRepository {
  load(): StoredSession | null {
    if (!canUseStorage()) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as StoredSession;
      if (
        parsed.schemaVersion !== SCHEMA_VERSION ||
        parsed.contentVersion !== CONTENT_VERSION ||
        !Array.isArray(parsed.events)
      ) {
        return null;
      }

      const initial = createInitialState(
        parsed.sessionId,
        parsed.savedAt,
        parsed.snapshot?.settings,
      );
      const replayed = replayEvents(parsed.events, initial);
      const state =
        parsed.events.length === 0 && parsed.snapshot
          ? parsed.snapshot
          : replayed;

      return {
        ...parsed,
        snapshot: state,
      };
    } catch {
      try {
        window.localStorage.setItem(`${STORAGE_KEY}:corrupt`, raw);
      } catch {
        return null;
      }
      return null;
    }
  }

  save(events: GameEvent[], state: GameState): void {
    if (!canUseStorage()) return;
    const stored: StoredSession = {
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      sessionId: state.sessionId,
      events,
      snapshot: state,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      return;
    }
  }

  clear(): void {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(STORAGE_KEY);
  }

  hasSave(): boolean {
    if (!canUseStorage()) return false;
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  }
}

export function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `td-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

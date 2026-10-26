import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commands } from "@/application/commands";
import {
  createSessionId,
  LocalSessionRepository,
} from "@/adapters/persistence/local-session-repository";
import { createInitialState, reduceEvent } from "@/domain/session/reducer";
import type { GameEvent } from "@/domain/session/types";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const STORAGE_KEY = "three-drops:session:v1";
const T0 = "2026-01-01T00:00:00.000Z";

function makeState() {
  const initial = createInitialState("session-1", T0);
  const events: GameEvent[] = [
    commands.start("session-1", "2026-01-01T00:00:01.000Z"),
    commands.completePrologue("2026-01-01T00:00:02.000Z"),
    commands.submitDraft("سه قطره خون", "2026-01-01T00:00:03.000Z"),
    commands.keepMotif("2026-01-01T00:00:04.000Z"),
  ];
  return { events, state: events.reduce(reduceEvent, initial) };
}

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: new MemoryStorage() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LocalSessionRepository", () => {
  it("round-trips an event log and its snapshot", () => {
    const { events, state } = makeState();
    const repo = new LocalSessionRepository();
    repo.save(events, state);

    const loaded = repo.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.events).toHaveLength(events.length);
    expect(loaded?.snapshot).toEqual(state);
    expect(loaded?.snapshot?.phase).toBe("interpretation");
  });

  it("replays the event log instead of trusting a stale snapshot", () => {
    const { events, state } = makeState();
    const repo = new LocalSessionRepository();
    repo.save(events, state);

    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    raw.snapshot = { ...state, phase: "invitation", attempts: [] };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));

    const loaded = repo.load();
    expect(loaded?.snapshot?.phase).toBe("interpretation");
    expect(loaded?.snapshot?.attempts).toHaveLength(1);
  });

  it("ignores a save from a different schema or content version", () => {
    const { events, state } = makeState();
    const repo = new LocalSessionRepository();
    repo.save(events, state);

    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    raw.schemaVersion = 99;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));

    expect(repo.load()).toBeNull();
  });

  it("quarantines corrupt JSON and returns null", () => {
    const repo = new LocalSessionRepository();
    window.localStorage.setItem(STORAGE_KEY, "{not json");

    expect(repo.load()).toBeNull();
    expect(window.localStorage.getItem(`${STORAGE_KEY}:corrupt`)).toBe("{not json");
  });

  it("clears the save and reports whether one exists", () => {
    const { events, state } = makeState();
    const repo = new LocalSessionRepository();
    expect(repo.hasSave()).toBe(false);

    repo.save(events, state);
    expect(repo.hasSave()).toBe(true);

    repo.clear();
    expect(repo.hasSave()).toBe(false);
    expect(repo.load()).toBeNull();
  });

  it("creates a non-empty session id", () => {
    expect(createSessionId().length).toBeGreaterThan(8);
  });
});

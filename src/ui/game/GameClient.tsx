"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import styles from "@/app/game.module.css";
import {
  createSessionId,
  LocalSessionRepository,
} from "@/adapters/persistence/local-session-repository";
import { AudioEngine } from "@/adapters/audio/audio-engine";
import { commands } from "@/application/commands";
import { ENDINGS } from "@/content/u1";
import { U2_SCENE } from "@/content/u2";
import { U4_RESOLUTION, trayLineFor } from "@/content/u4";
import { WARD_STATIONS_CONTENT } from "@/content/u3";
import { createInitialState, reduceEvent } from "@/domain/session/reducer";
import type {
  Claim,
  DishId,
  EvidenceId,
  Filing,
  GameEvent,
  GameState,
  Settings,
  StationId,
} from "@/domain/session/types";
import { ArchiveSheet } from "./components/ArchiveSheet";
import { BindingScene } from "./components/BindingScene";
import { BoundaryScene } from "./components/BoundaryScene";
import { DeskScene } from "./components/DeskScene";
import { EndingScene } from "./components/EndingScene";
import { MenuScene } from "./components/MenuScene";
import { NoiseScene } from "./components/NoiseScene";
import { Prologue } from "./components/Prologue";
import { TitleScreen } from "./components/TitleScreen";
import { U2ResolutionScene } from "./components/U2ResolutionScene";
import { U3ResolutionScene } from "./components/U3ResolutionScene";
import { U4ResolutionScene } from "./components/U4ResolutionScene";
import { WardScene } from "./components/WardScene";

const initialState = createInitialState("pending", "1970-01-01T00:00:00.000Z");

function reducer(state: GameState, event: GameEvent): GameState {
  return reduceEvent(state, event);
}

function announcementFor(state: GameState): string {
  if (state.phase === "locked") return "کاغذ از دستت افتاد. دو ضرب به در خورد.";
  if (state.phase === "interpretation") return "برگه روی میز است.";
  if (state.phase === "u1Resolved" && state.ending) {
    return `برگه: ${ENDINGS[state.ending].title}`;
  }
  if (state.phase === "noise") {
    return state.u2.surfaced.length > 0
      ? U2_SCENE.surfacedAnnouncement
      : "کاغذی پر از خط‌های درهم روی میز است.";
  }
  if (state.phase === "u2Resolved") {
    return state.u2.outcome === "captured"
      ? U2_SCENE.capturedAnnouncement
      : U2_SCENE.deniedAnnouncement;
  }
  if (state.phase === "ward") {
    if (state.u3.at === "yard") {
      return state.u3.day === 2
        ? "همان حیاط، از نو."
        : "حیاط آسایشگاه؛ چهار در و یک برگه روی سکو.";
    }
    return WARD_STATIONS_CONTENT[state.u3.at].label;
  }
  if (state.phase === "u3Resolved") return "جملهٔ روی برگه محو شد.";
  if (state.phase === "queue") {
    return "سرِ میز ایستگاه نشسته‌ای؛ فهرست هنوز باز نشده است.";
  }
  if (state.phase === "menu") {
    return `فهرست باز است. سینی: ${state.u4.picks} قاشق.`;
  }
  if (state.phase === "tray") return "سینی در دست توست؛ همان مزه، همان سهمیه.";
  if (state.phase === "u4Resolved") {
    return `${U4_RESOLUTION.title} — ${trayLineFor(state.u4.picks, state.u4.done)}`;
  }
  if (state.phase === "boundary") return "ادامه هنوز ساخته نشده است.";
  if (state.phase === "desk" && state.attempts.length > 0) {
    return "برگه ثبت شد.";
  }
  return "";
}

export function GameClient() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const closeArchive = useCallback(() => setArchiveOpen(false), []);
  const openArchive = useCallback(() => setArchiveOpen(true), []);
  const [saved, setSaved] = useState(false);
  const [repo] = useState(() => new LocalSessionRepository());
  const [audio] = useState(() => new AudioEngine());
  const eventsRef = useRef<GameEvent[]>([]);
  const lastScratchRef = useRef(0);
  const lastBrushRef = useRef(0);

  useEffect(() => {
    const stored = repo.load();
    if (stored?.snapshot) {
      eventsRef.current = stored.events;
      dispatch({ type: "HYDRATE", state: stored.snapshot });
    }
    const timer = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(timer);
  }, [repo]);

  useEffect(() => {
    if (!hydrated) return;
    if (state.phase === "invitation" && eventsRef.current.length === 0) return;
    repo.save(eventsRef.current, state);
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 1600);
    return () => window.clearTimeout(timer);
  }, [state, hydrated, repo]);

  useEffect(() => {
    audio.setMuted(state.settings.muted);
  }, [audio, state.settings.muted]);

  useEffect(() => {
    const unlock = () => {
      audio.ensure();
      audio.setMuted(state.settings.muted);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [audio, state.settings.muted]);

  useEffect(() => {
    return () => {
      audio.dispose();
    };
  }, [audio]);

  const send = useCallback((event: GameEvent) => {
    eventsRef.current = [...eventsRef.current, event];
    dispatch(event);
  }, []);

  const startNew = useCallback(() => {
    const at = new Date().toISOString();
    const sessionId = createSessionId();
    const start = commands.start(sessionId, at);
    const started = reduceEvent(
      createInitialState(sessionId, at, state.settings),
      start,
    );
    eventsRef.current = [start];
    dispatch({ type: "HYDRATE", state: started });
    setArchiveOpen(false);
    audio.ensure();
    audio.setMuted(state.settings.muted);
  }, [audio, state.settings]);

  const restart = useCallback(() => {
    if (!window.confirm("از نو شروع کنیم؟ نشستِ همین مرورگر پاک می‌شود.")) return;
    repo.clear();
    startNew();
  }, [repo, startNew]);

  const scratch = useCallback(() => {
    const now = performance.now();
    if (now - lastScratchRef.current < 42) return;
    lastScratchRef.current = now;
    audio.scratch();
  }, [audio]);

  const brush = useCallback(
    (intensity: number) => {
      const now = performance.now();
      if (now - lastBrushRef.current < 42) return;
      lastBrushRef.current = now;
      audio.brush(intensity);
    },
    [audio],
  );

  const dust = useCallback(() => {
    audio.dust();
  }, [audio]);

  const footstep = useCallback(
    (intensity: number, pan: number) => {
      audio.footstep(intensity, pan);
    },
    [audio],
  );

  const knock = useCallback(() => {
    audio.knock();
  }, [audio]);

  const submitDraft = useCallback(
    (text: string) => {
      audio.ensure();
      audio.crumple();
      audio.penDown();
      send(commands.submitDraft(text));
    },
    [audio, send],
  );

  const keepMotif = useCallback(() => {
    audio.motif();
    send(commands.keepMotif());
  }, [audio, send]);

  const releaseHand = useCallback(() => {
    audio.penDown();
    send(commands.releaseHand());
  }, [audio, send]);

  const recordInterpretation = useCallback(
    (claim: Claim, evidence: EvidenceId[]) => {
      if (state.interpretation.recordedAt) audio.scratch();
      else audio.stamp();
      send(commands.recordInterpretation(claim, evidence));
    },
    [audio, send, state.interpretation.recordedAt],
  );

  const disposeFile = useCallback(
    (filing: Filing) => {
      if (filing === "submit") {
        audio.knock();
        audio.hush(2400);
      } else if (filing === "conceal") {
        audio.drawer();
      } else if (filing === "tear") {
        audio.tear();
      } else {
        audio.penDown();
        audio.hush(1600);
      }
      send(commands.disposeFile(filing));
    },
    [audio, send],
  );

  const continueBridge = useCallback(() => {
    audio.dust();
    send(commands.bridgeContinue());
  }, [audio, send]);

  const surfaceNoise = useCallback(
    (index: 1 | 2 | 3, x: number, y: number) => {
      audio.surface();
      send(commands.surfaceMotif(index, x, y));
    },
    [audio, send],
  );

  const capturePhrase = useCallback(() => {
    audio.stamp();
    audio.motif();
    send(commands.captureMotif());
  }, [audio, send]);

  const denyPage = useCallback(() => {
    audio.penDown();
    audio.hush(1800);
    send(commands.denyPage());
  }, [audio, send]);

  const acknowledgeBoundary = useCallback(() => {
    send(commands.acknowledgeBoundary());
  }, [send]);

  const stationSound = useCallback(
    (station: StationId) => {
      if (station === "garden") audio.wind();
      else if (station === "cellar") audio.murmur();
      else if (station === "infirmary") audio.needle();
      else audio.wail();
    },
    [audio],
  );

  const enterWard = useCallback(() => {
    audio.door();
    audio.hush(1400);
    send(commands.enterWard());
  }, [audio, send]);

  const wardMove = useCallback(
    (to: StationId | "yard") => {
      audio.footstep(0.42, to === "yard" ? -0.25 : 0.25);
      if (to !== "yard") audio.door();
      send(commands.moveWard(to));
    },
    [audio, send],
  );

  const wardNote = useCallback(
    (station: StationId, object: string) => {
      stationSound(station);
      send(commands.noteStation(station, object));
    },
    [stationSound, send],
  );

  const wardSameAct = useCallback(
    (station: StationId) => {
      stationSound(station);
      audio.penDown();
      send(commands.sameAct(station));
    },
    [stationSound, audio, send],
  );

  const wardPeek = useCallback(() => {
    audio.brush(0.3);
  }, [audio]);

  const resolveWard = useCallback(() => {
    audio.penDown();
    audio.motif();
    send(commands.resolveWard());
  }, [audio, send]);

  // ---- U4 — صف شام، منو، سینی ----

  const sitInQueue = useCallback(() => {
    audio.door();
    audio.footstep(0.35, -0.1);
    send(commands.joinQueue());
  }, [audio, send]);

  const openMenuBoard = useCallback(() => {
    audio.dust();
    send(commands.openMenu());
  }, [audio, send]);

  const pickDish = useCallback(
    (dish: DishId) => {
      audio.stamp();
      send(commands.pickDish(dish));
    },
    [audio, send],
  );

  // دکمهٔ سینی دو نقش است: پیش از آستانه بی‌اثر (reducer رد می‌کند)،
  // پس از آستانه سینی را می‌گیرد و فاز tray را باز می‌کند.
  const takeTrayStep = useCallback(() => {
    if (state.phase === "menu") {
      audio.crumple();
      send(commands.offerTray());
    } else {
      audio.penDown();
      send(commands.takeTray());
    }
  }, [audio, send, state.phase]);

  const continueFromU4 = useCallback(() => {
    send(commands.acknowledgeBoundary());
  }, [send]);

  const changeSettings = useCallback(
    (patch: Partial<Settings>) => {
      send(commands.changeSettings(patch));
    },
    [send],
  );

  const beginPrologue = useCallback(() => {
    audio.ensure();
    audio.penDown();
    send(commands.completePrologue());
  }, [audio, send]);

  const shellClass = [
    styles.stage,
    state.settings.reduceMotion ? styles.reduceMotion : "",
    state.settings.highContrast ? styles.highContrast : "",
  ]
    .filter(Boolean)
    .join(" ");

  const showTools =
    state.phase !== "u1Resolved" &&
    state.phase !== "u2Resolved" &&
    state.phase !== "u3Resolved" &&
    state.phase !== "u4Resolved" &&
    state.phase !== "boundary";

  return (
    <main
      className={shellClass}
      style={{ "--text-scale": state.settings.textScale } as CSSProperties}
    >
      <div className={styles.grain} aria-hidden="true" />

      {state.phase === "invitation" ? <TitleScreen onStart={startNew} /> : null}

      {state.phase === "prologue" ? (
        <Prologue onBegin={beginPrologue} />
      ) : null}

      {state.phase === "desk" || state.phase === "locked" ? (
        <DeskScene
          state={state}
          onSubmit={submitDraft}
          onKeepMotif={keepMotif}
          onReleaseHand={releaseHand}
          onScratch={scratch}
          onMotif={() => audio.motif()}
          onFootstep={footstep}
          onKnock={knock}
        />
      ) : null}

      {state.phase === "interpretation" ? (
        <BindingScene
          state={state}
          onRecord={recordInterpretation}
          onDispose={disposeFile}
          onFootstep={footstep}
          onKnock={knock}
        />
      ) : null}

      {state.phase === "u1Resolved" ? (
        <EndingScene
          state={state}
          onContinue={continueBridge}
          onRestart={restart}
          onOpenArchive={openArchive}
        />
      ) : null}

      {state.phase === "noise" ? (
        <NoiseScene
          state={state}
          onSurface={surfaceNoise}
          onCapture={capturePhrase}
          onDeny={denyPage}
          onBrush={brush}
          onDust={dust}
        />
      ) : null}

      {state.phase === "u2Resolved" ? (
        <U2ResolutionScene
          state={state}
          onContinue={enterWard}
          onRestart={restart}
          onOpenArchive={openArchive}
        />
      ) : null}

      {state.phase === "ward" ? (
        <WardScene
          state={state}
          onMove={wardMove}
          onNote={wardNote}
          onSameAct={wardSameAct}
          onResolve={resolveWard}
          onPeek={wardPeek}
        />
      ) : null}

      {state.phase === "u3Resolved" ? (
        <U3ResolutionScene
          onContinue={sitInQueue}
          onRestart={restart}
          onOpenArchive={openArchive}
        />
      ) : null}

      {state.phase === "queue" || state.phase === "menu" || state.phase === "tray" ? (
        <MenuScene
          state={state}
          onSit={openMenuBoard}
          onPick={pickDish}
          onTakeTray={takeTrayStep}
        />
      ) : null}

      {state.phase === "u4Resolved" ? (
        <U4ResolutionScene
          onContinue={continueFromU4}
          onRestart={restart}
          onOpenArchive={openArchive}
        />
      ) : null}

      {state.phase === "boundary" ? (
        <BoundaryScene onRestart={restart} onOpenArchive={openArchive} />
      ) : null}

      {showTools ? (
        <div className={styles.deskTools}>
          <button
            type="button"
            className={styles.deskTool}
            onClick={() => changeSettings({ muted: !state.settings.muted })}
            aria-pressed={state.settings.muted}
            aria-label={state.settings.muted ? "صدا را روشن کن" : "صدا را خاموش کن"}
          >
            <span
              className={`${styles.soundDot} ${
                state.settings.muted ? styles.soundDotOff : ""
              }`}
              aria-hidden="true"
            />
            {state.settings.muted ? "بی‌صدا" : "صدا"}
          </button>
          <button
            type="button"
            className={styles.deskTool}
            onClick={openArchive}
            aria-label="پشت جلد: تنظیمات و آرشیو"
          >
            پشت جلد
          </button>
        </div>
      ) : null}

      <span className={styles.saveWhisper} aria-live="polite">
        {saved ? "ذخیره شد" : ""}
      </span>
      <span className={styles.srOnly} aria-live="polite">
        {announcementFor(state)}
      </span>

      {archiveOpen ? (
        <ArchiveSheet
          state={state}
          onChange={changeSettings}
          onRestart={restart}
          onClose={closeArchive}
        />
      ) : null}
    </main>
  );
}

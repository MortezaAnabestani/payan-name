"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import styles from "@/app/game.module.css";
import {
  U3_SCENE,
  WARD_OBJECT_IDS,
  WARD_STATIONS_CONTENT,
} from "@/content/u3";
import {
  CLAIM_SENTENCE,
  STATIONS,
  claimStageFor,
} from "@/domain/session/reducer";
import type { GameState, StationId } from "@/domain/session/types";
import { selectionNext, wardWarmthFor, type WardSpot } from "../scene/ward";
import { ClaimText } from "./ClaimText";

/**
 * U3 — «چرخهٔ آسایشگاه».
 * حیاط با چهار در؛ هر در به همان حیاط باز می‌شود. روز دوم، همان روز است.
 * جملهٔ تفاوت روی برگهٔ سکو با هر کنش همسانی محو می‌شود.
 */
export function WardScene({
  state,
  onMove,
  onNote,
  onSameAct,
  onResolve,
  onPeek,
}: {
  state: GameState;
  onMove: (to: StationId | "yard") => void;
  onNote: (station: StationId, object: string) => void;
  onSameAct: (station: StationId) => void;
  onResolve: () => void;
  onPeek: () => void;
}) {
  const u3 = state.u3;
  const claimStage = claimStageFor(u3.sameActs);
  const at = u3.at;

  const [selection, setSelection] = useState<WardSpot>("garden");
  const [pageOpen, setPageOpen] = useState(false);
  const [interludeSeen, setInterludeSeen] = useState(false);

  const interludeOpen =
    !interludeSeen &&
    u3.day === 2 &&
    u3.loops === 1 &&
    u3.visited.length === 0 &&
    at === "yard";

  const enterStation = useCallback(
    (station: StationId) => {
      setSelection(station);
      onMove(station);
    },
    [onMove],
  );

  const backToYard = useCallback(() => {
    onMove("yard");
  }, [onMove]);

  const openPage = useCallback(() => {
    setPageOpen(true);
    onPeek();
  }, [onPeek]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (pageOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          setPageOpen(false);
        }
        return;
      }
      if (at !== "yard") {
        if (event.key === "Escape") {
          event.preventDefault();
          backToYard();
        }
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSelection((current) => selectionNext(current, -1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setSelection((current) => selectionNext(current, 1));
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (selection === "page") openPage();
        else enterStation(selection);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, pageOpen, selection, enterStation, backToYard, openPage]);

  const warmthVars = {
    "--ward-warmth": wardWarmthFor(u3.loops),
    "--ward-saturate": 1 + u3.loops * 0.3,
  } as CSSProperties;

  if (at !== "yard") {
    const station = WARD_STATIONS_CONTENT[at];
    const objectId = WARD_OBJECT_IDS[at];
    const noted = u3.noted.includes(`${at}:${objectId}`);
    const acted = u3.sameToday.includes(at);
    return (
      <section
        className={`${styles.deskScene} ${styles.wardScene} ${
          styles[`wardPlace_${at}`] ?? ""
        }`}
        style={warmthVars}
        aria-label={station.label}
      >
        <div className={styles.wardPlaceCopy}>
          <p className={styles.sceneWhisper}>{station.introit}</p>
          {noted ? (
            <p className={styles.wardLine}>
              {u3.day === 2 ? station.noteDay2 : station.noteDay1}
            </p>
          ) : null}
          {acted ? <p className={styles.wardLine}>{station.sameLine}</p> : null}
          <div className={styles.wardActs}>
            <button
              type="button"
              className={styles.wardAct}
              disabled={noted}
              onClick={() => onNote(at, objectId)}
            >
              {station.noteLabel}
            </button>
            <button
              type="button"
              className={styles.wardAct}
              disabled={acted}
              onClick={() => onSameAct(at)}
            >
              {station.sameLabel}
            </button>
            <button
              type="button"
              className={styles.wardActBack}
              onClick={backToYard}
            >
              {U3_SCENE.backToYard}
            </button>
          </div>
          <p className={styles.wardNoted} aria-live="polite">
            {noted ? U3_SCENE.noted : ""}
            {noted && acted ? " " : ""}
            {acted ? U3_SCENE.acted : ""}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${styles.deskScene} ${styles.wardScene}`}
      style={warmthVars}
      aria-label={U3_SCENE.yardLabel}
    >
      <div className={styles.wardSky} aria-hidden="true">
        <span className={styles.wardSun} />
      </div>
      <div className={styles.wardHill} aria-hidden="true" />

      <div className={styles.wardDoors}>
        {STATIONS.map((station) => {
          const content = WARD_STATIONS_CONTENT[station];
          const active = selection === station;
          return (
            <button
              key={station}
              type="button"
              className={`${styles.wardDoor} ${
                active ? styles.wardDoorActive : ""
              }`}
              aria-label={`${content.label} — وارد می‌شوم`}
              onClick={() => enterStation(station)}
            >
              <span
                className={`${styles.wardDoorGlyph} ${
                  styles[`wardDoor_${station}`] ?? ""
                }`}
                aria-hidden="true"
              />
              <span className={styles.objectLabel}>{content.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.wardBench}>
        <div
          className={`${styles.wardPage} ${
            selection === "page" ? styles.wardPageActive : ""
          }`}
        >
          <ClaimText
            text={CLAIM_SENTENCE}
            stage={claimStage}
            className={styles.wardClaim}
          />
        </div>
        <button
          type="button"
          className={styles.wardAct}
          onClick={openPage}
          aria-label={U3_SCENE.pageLabel}
        >
          {U3_SCENE.pageLabel}
        </button>
      </div>

      <div className={styles.wardFoot}>
        <p className={styles.noiseWhisper}>
          {u3.day === 2 ? U3_SCENE.yardLineDay2 : U3_SCENE.yardLine}
        </p>
        {u3.done ? (
          <button
            type="button"
            className={styles.continueButton}
            disabled={claimStage < 4}
            onClick={onResolve}
          >
            {U3_SCENE.exitAct}
          </button>
        ) : null}
        {u3.done && claimStage < 4 ? (
          <p className={styles.wardWhisper}>{U3_SCENE.exitWaiting}</p>
        ) : null}
        <p className={styles.noiseWhisper}>{U3_SCENE.whisper}</p>
      </div>

      {interludeOpen ? (
        <div className={styles.wardInterlude} role="dialog" aria-modal="true">
          {U3_SCENE.interludeLines.map((line) => (
            <p key={line} className={styles.wardInterludeLine}>
              {line}
            </p>
          ))}
          <button
            type="button"
            className={styles.continueButton}
            onClick={() => setInterludeSeen(true)}
          >
            {U3_SCENE.interludeAction}
          </button>
        </div>
      ) : null}

      {pageOpen ? (
        <div
          className={styles.wardPageOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPageOpen(false);
          }}
        >
          <div
            className={styles.wardPageCard}
            role="dialog"
            aria-modal="true"
            aria-label={U3_SCENE.pageLabel}
          >
            <p className={styles.wardPageHint}>{U3_SCENE.pageHint}</p>
            <ClaimText
              text={CLAIM_SENTENCE}
              stage={claimStage}
              className={styles.wardClaimLarge}
            />
            <button
              type="button"
              className={styles.coverButton}
              onClick={() => setPageOpen(false)}
            >
              {U3_SCENE.pageClose}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

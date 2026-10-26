"use client";

import { useEffect, type CSSProperties } from "react";
import styles from "@/app/game.module.css";
import type { GameState } from "@/domain/session/types";
import { dropIntensityFor, lampScaleFor } from "../scene/warden";
import { lockedActForKey } from "../scene/keys";
import { PaperSheet } from "./PaperSheet";
import { ThreeDrops } from "./ThreeDrops";
import { Warden } from "./Warden";

export function DeskScene({
  state,
  onSubmit,
  onKeepMotif,
  onReleaseHand,
  onScratch,
  onMotif,
  onFootstep,
  onKnock,
}: {
  state: GameState;
  onSubmit: (text: string) => void;
  onKeepMotif: () => void;
  onReleaseHand: () => void;
  onScratch: () => void;
  onMotif: () => void;
  onFootstep: (intensity: number, pan: number) => void;
  onKnock: () => void;
}) {
  const locked = state.phase === "locked";

  useEffect(() => {
    if (!locked) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const act = lockedActForKey(event);
      if (!act) return;
      event.preventDefault();
      if (act === "keep") onKeepMotif();
      else onReleaseHand();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [locked, onKeepMotif, onReleaseHand]);

  return (
    <section
      className={`${styles.deskScene} ${locked ? styles.deskLocked : ""}`}
      aria-label="اتاق و میز"
    >
      <div
        className={styles.lampPool}
        style={
          {
            "--lamp-scale": lampScaleFor(state.pressure),
            "--pressure": state.pressure / 100,
          } as CSSProperties
        }
        aria-hidden="true"
      />
      <Warden
        pressure={state.pressure}
        phase={state.phase}
        reduceMotion={state.settings.reduceMotion}
        onFootstep={onFootstep}
        onKnock={onKnock}
      />

      <div className={styles.tableTop} aria-hidden="true">
        <span className={styles.tableGrain} />
      </div>

      <div className={styles.deskObjects} aria-hidden="true">
        <div className={styles.drawerObject}>
          <span className={styles.drawerHandle} />
        </div>
        <div className={styles.dossierObject}>
          <span>پرونده</span>
        </div>
      </div>

      <div className={styles.paperStage}>
        <PaperSheet
          state={state}
          onSubmit={onSubmit}
          onScratch={onScratch}
          onMotif={onMotif}
        />

        {locked ? (
          <div className={styles.lockedActs}>
            <p className={styles.lockedLine}>
              دو ضرب به در خورد. کاغذ از دستت می‌افتد.
            </p>
            <div className={styles.lockChoices}>
              <button
                type="button"
                className={styles.keepChoice}
                onClick={onKeepMotif}
                aria-keyshortcuts="K"
              >
                <ThreeDrops
                  className={styles.keepDrops}
                  intensity={dropIntensityFor(
                    state.attempts.length,
                    state.complicity,
                  ) + 0.25}
                />
                <span className={styles.objectLabel}>سه قطره را نگه می‌دارم</span>
              </button>
              <button
                type="button"
                className={styles.releaseChoice}
                onClick={onReleaseHand}
                aria-keyshortcuts="Escape"
              >
                <span className={styles.stand}>
                  <span className={styles.standBase} />
                  <span className={styles.standPen} />
                </span>
                <span className={styles.objectLabel}>
                  قلم را روی قلم‌دان می‌گذارم
                </span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

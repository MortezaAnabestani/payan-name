"use client";

import { useEffect, useRef } from "react";
import styles from "@/app/game.module.css";
import type { Phase } from "@/domain/session/types";
import { footstepIntervalFor, wardenStateFor } from "../scene/warden";

/**
 * ناظم هرگز بدن ندارد: فقط درِ چوبی، خط نور، سایه و قدم.
 * FSM: دور ← نزدیک ← ایستاده ← در می‌زند.
 */
export function Warden({
  pressure,
  phase,
  reduceMotion,
  onFootstep,
  onKnock,
}: {
  pressure: number;
  phase: Phase;
  reduceMotion: boolean;
  onFootstep: (intensity: number, pan: number) => void;
  onKnock: () => void;
}) {
  const state = wardenStateFor(pressure, phase);
  const side = useRef(1);
  const knocked = useRef(false);

  useEffect(() => {
    if (state !== "knocking") {
      knocked.current = false;
      return;
    }
    if (knocked.current) return;
    knocked.current = true;
    onKnock();
  }, [state, onKnock]);

  useEffect(() => {
    if (state !== "near" && state !== "still") return;
    const interval = footstepIntervalFor(pressure);
    const tick = () => {
      side.current *= -1;
      onFootstep(
        state === "still" ? 0.72 : 0.34,
        side.current * (state === "still" ? 0.34 : 0.55),
      );
    };
    const first = window.setTimeout(tick, Math.min(1600, interval / 2));
    const timer = window.setInterval(tick, interval);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [state, pressure, onFootstep]);

  return (
    <div
      className={`${styles.warden} ${styles[`warden_${state}`] ?? ""} ${
        reduceMotion ? styles.wardenStill : ""
      }`}
      data-warden={state}
      aria-hidden="true"
    >
      <div className={styles.doorFrame}>
        <div className={styles.doorPanel}>
          <span className={styles.doorHandle} />
          <span className={styles.doorSeam} />
        </div>
        <span className={styles.doorLight} />
        <span className={styles.doorShadow} />
      </div>
      <span className={styles.corridorGlow} />
    </div>
  );
}

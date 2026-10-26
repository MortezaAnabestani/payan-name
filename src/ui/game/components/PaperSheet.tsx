"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import styles from "@/app/game.module.css";
import { isMotifTyped } from "@/domain/session/reducer";
import type { GameState } from "@/domain/session/types";
import { DecayText } from "./DecayText";
import { SceneCanvas } from "./SceneCanvas";
import { isPenLiftKey } from "../scene/keys";

const DECAY_DELAY = 950;

export function PaperSheet({
  state,
  onSubmit,
  onScratch,
  onMotif,
}: {
  state: GameState;
  onSubmit: (text: string) => void;
  onScratch: () => void;
  onMotif: () => void;
}) {
  const locked = state.phase === "locked";
  const lastAttempt = state.attempts.at(-1);
  const [text, setText] = useState("");
  const [decayed, setDecayed] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const autoLockTimerRef = useRef<number | null>(null);
  const motifSignaled = useRef(false);

  const shownText = locked ? (lastAttempt?.text ?? text) : text;
  const attemptLevel = state.attempts.length;
  const showDecay = decayed || locked;
  const empty = !locked && !shownText.trim();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 260);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
      if (autoLockTimerRef.current) window.clearTimeout(autoLockTimerRef.current);
    };
  }, []);

  const submit = useCallback(() => {
    if (locked) return;
    const value = text.trim();
    if (!value) return;
    if (autoLockTimerRef.current) {
      window.clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = null;
    }
    onSubmit(value);
    setFlash(value);
    setText("");
    setDecayed(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 620);
  }, [locked, onSubmit, text]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value;
    setText(next);
    setDecayed(false);
    onScratch();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (!next.trim()) {
      motifSignaled.current = false;
      return;
    }
    timerRef.current = window.setTimeout(() => {
      setDecayed(true);
      if (isMotifTyped(next) && !motifSignaled.current) {
        motifSignaled.current = true;
        onMotif();
        autoLockTimerRef.current = window.setTimeout(() => {
          autoLockTimerRef.current = null;
          onSubmit(next);
        }, 1400);
      }
    }, DECAY_DELAY);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isPenLiftKey(event)) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className={`${styles.paperWrap} ${empty ? styles.paperWrapEmpty : ""}`}>
      <div
        className={`${styles.paper} ${locked ? styles.paperLocked : ""} ${
          showDecay ? styles.paperDecayed : ""
        }`}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) textareaRef.current?.focus();
        }}
      >
        <SceneCanvas
          className={styles.paperCanvas}
          attempts={attemptLevel}
          complicity={state.complicity}
          motif={state.motifTyped}
          reduceMotion={state.settings.reduceMotion}
        />
        <span className={styles.paperRule} aria-hidden="true" />
        <span className={styles.paperFold} aria-hidden="true" />

        <div className={styles.paperWriting}>
          {showDecay ? (
            <div ref={overlayRef} className={styles.paperOverlay} aria-hidden="true">
              <DecayText
                text={shownText}
                attempt={attemptLevel}
                showResidue={false}
                className={styles.paperDecay}
              />
            </div>
          ) : null}
          <textarea
            ref={textareaRef}
            className={`${styles.paperInput} ${
              showDecay ? styles.paperInputHidden : ""
            }`}
            value={shownText}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            readOnly={locked}
            aria-readonly={locked}
            aria-label="کاغذ"
            aria-describedby="paper-hint"
            aria-keyshortcuts="Control+Enter Meta+Enter"
            spellCheck={false}
            autoComplete="off"
            dir="rtl"
            onScroll={(event) => {
              if (overlayRef.current) {
                overlayRef.current.scrollTop = event.currentTarget.scrollTop;
              }
            }}
          />
        </div>

        <span className={styles.paperEdge} aria-hidden="true" />
      </div>

      {flash ? (
        <div className={styles.crumpleFlash} aria-hidden="true">
          <DecayText text={flash} attempt={attemptLevel} showResidue={false} />
        </div>
      ) : null}

      <button
        type="button"
        className={`${styles.penButton} ${empty ? styles.penInvite : ""}`}
        onClick={submit}
        disabled={locked || !text.trim()}
        aria-label="قلم را زمین بگذار و برگه را ثبت کن"
        aria-keyshortcuts="Control+Enter Meta+Enter"
      >
        <span className={styles.penBody} aria-hidden="true" />
        <span className={styles.penNib} aria-hidden="true" />
        <span className={styles.penLabel}>قلم</span>
      </button>

      <p id="paper-hint" className={styles.srOnly}>
        روی کاغذ بنویس. برای زمین گذاشتن قلم، کنترل و اینتر را بزن.
      </p>

      <div className={styles.crumplePile} aria-hidden="true" data-count={attemptLevel}>
        {Array.from({ length: attemptLevel }).map((_, index) => (
          <span
            key={index}
            className={styles.crumple}
            style={{ transform: `rotate(${(index - 1) * 9}deg)` }}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, type CSSProperties } from "react";
import styles from "@/app/game.module.css";
import {
  CLAIM_OPTIONS,
  EVIDENCE_OPTIONS,
  FILING_OPTIONS,
} from "@/content/u1";
import type {
  Claim,
  EvidenceId,
  Filing,
  GameState,
} from "@/domain/session/types";
import { lampScaleFor } from "../scene/warden";
import { DecayText } from "./DecayText";
import { SceneCanvas } from "./SceneCanvas";
import { ThreeDrops } from "./ThreeDrops";
import { Warden } from "./Warden";

function ClaimIcon({ claim }: { claim: Claim }) {
  if (claim === "self") {
    return (
      <svg viewBox="0 0 90 90" className={styles.claimIcon} aria-hidden="true">
        <path
          d="M30 46V30a5 5 0 0 1 10 0v12-16a5 5 0 0 1 10 0v16-13a5 5 0 0 1 10 0v14-8a5 5 0 0 1 10 0v22c0 15-9 25-23 25-11 0-18-6-22-14l-8-16a5 5 0 0 1 9-5l4 6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (claim === "institution") {
    return (
      <svg viewBox="0 0 90 90" className={styles.claimIcon} aria-hidden="true">
        <path
          d="M20 30h50v42H20zM26 22h38v8H26zM35 42h20M35 52h20M35 62h12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="62" cy="24" r="3" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 90 90" className={styles.claimIcon} aria-hidden="true">
      <path
        d="M45 18c13 4 22 16 22 29 0 12-8 21-18 25 4-8 2-14-2-18-3 8-10 12-18 12-4 0-7-1-10-3 2-5 2-10 0-15-3-8 2-20 14-27 4-2 8-3 12-3Z"
        fill="currentColor"
        opacity="0.5"
      />
      <circle cx="38" cy="50" r="9" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

export function BindingScene({
  state,
  onRecord,
  onDispose,
  onFootstep,
  onKnock,
}: {
  state: GameState;
  onRecord: (claim: Claim, evidence: EvidenceId[]) => void;
  onDispose: (filing: Filing) => void;
  onFootstep: (intensity: number, pan: number) => void;
  onKnock: () => void;
}) {
  const [claim, setClaim] = useState<Claim | null>(state.interpretation.claim);
  const [evidence, setEvidence] = useState<EvidenceId[]>(
    state.interpretation.evidence,
  );
  const recorded = Boolean(
    state.interpretation.claim && state.interpretation.evidence.length > 0,
  );
  const lastAttempt = state.attempts.at(-1);

  function record(nextClaim: Claim | null, nextEvidence: EvidenceId[]) {
    setClaim(nextClaim);
    setEvidence(nextEvidence);
    if (nextClaim && nextEvidence.length > 0) {
      onRecord(nextClaim, nextEvidence);
    }
  }

  function chooseClaim(next: Claim) {
    record(next, evidence);
  }

  function toggleEvidence(id: EvidenceId) {
    const next = evidence.includes(id)
      ? evidence.filter((item) => item !== id)
      : [...evidence, id];
    record(claim, next);
  }

  return (
    <section
      className={`${styles.deskScene} ${styles.bindingScene}`}
      aria-label="گذاشتن برگه و سنجاق‌کردن ردها"
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

      <div className={styles.bindingGrid}>
        <div className={styles.claimColumn}>
          <p className={styles.sceneWhisper}>برگه را کجا می‌گذاری؟</p>
          <div className={styles.claimObjects}>
            {CLAIM_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.claimObject} ${
                  claim === option.value ? styles.claimObjectActive : ""
                }`}
                onClick={() => chooseClaim(option.value)}
                aria-pressed={claim === option.value}
                aria-label={`${option.label} — ${option.note}`}
              >
                <ClaimIcon claim={option.value} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className={`${styles.bindingPaperWrap} ${
            claim ? styles[`paperAt_${claim}`] ?? "" : ""
          }`}
        >
          <div className={styles.bindingPaper}>
            <SceneCanvas
              className={styles.paperCanvas}
              attempts={state.attempts.length}
              complicity={state.complicity}
              motif={state.motifTyped}
              reduceMotion={state.settings.reduceMotion}
            />
            <span className={styles.paperRule} aria-hidden="true" />
            {lastAttempt ? (
              <DecayText
                text={lastAttempt.text}
                attempt={state.attempts.length}
                showResidue={false}
                className={styles.bindingText}
              />
            ) : (
              <ThreeDrops className={styles.bindingDrops} intensity={0.6} />
            )}
            <div className={styles.pins} aria-hidden="true">
              {evidence.map((id, index) => (
                <span
                  key={id}
                  className={styles.pin}
                  style={{ insetInlineStart: `${18 + index * 17}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.evidenceColumn}>
          <p className={styles.sceneWhisper}>چه چیزی روی میز مانده؟</p>
          <div className={styles.traceList}>
            {EVIDENCE_OPTIONS.map((option) => {
              const active = evidence.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.trace} ${active ? styles.traceActive : ""}`}
                  onClick={() => toggleEvidence(option.value)}
                  aria-pressed={active}
                  aria-label={`${option.label} — ${option.note}`}
                >
                  <span className={styles.tracePin} aria-hidden="true" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {recorded ? (
        <div className={styles.filingActs}>
          {FILING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.filingObject} ${
                styles[`filing_${option.value}`] ?? ""
              }`}
              onClick={() => onDispose(option.value)}
              aria-label={`${option.label} — ${option.note}`}
            >
              <span className={styles.filingIcon} aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useState } from "react";
import styles from "@/app/game.module.css";
import { DISH_CONTENT, U4_SCENE } from "@/content/u4";
import {
  CALORIE_QUOTA,
  DISHES,
  U4_THRESHOLD,
  u4TrayAccepted,
} from "@/domain/session/reducer";
import type { DishId, GameState } from "@/domain/session/types";

/**
 * U4 — «منوی بخور و نمیر».
 * صف، سپس فهرست. هر انتخاب نوار سهمیه را یک‌دم پُر و خالی می‌کند؛
 * هیچ پیامدِ افتراقی ثبت نمی‌شود — انتخاب فقط آیین است.
 * بدون HUD؛ همه‌چیز روی خودِ تابلو و سینی است.
 */
export function MenuScene({
  state,
  onSit,
  onPick,
  onTakeTray,
}: {
  state: GameState;
  onSit: () => void;
  onPick: (dish: DishId) => void;
  onTakeTray: () => void;
}) {
  const phase = state.phase;
  const u4 = state.u4;
  const [pickedFlash, setPickedFlash] = useState(0);

  if (phase === "queue") {
    return (
      <section className={styles.menuStage} aria-label={U4_SCENE.queueKicker}>
        <p className={styles.menuKicker}>{U4_SCENE.queueKicker}</p>
        <p className={styles.noiseWhisper}>{U4_SCENE.queueLine}</p>
        <div className={styles.menuActs}>
          <button type="button" className={styles.continueButton} onClick={onSit}>
            {U4_SCENE.queueAct}
          </button>
        </div>
        <p className={styles.menuWhisper}>{U4_SCENE.whisper}</p>
      </section>
    );
  }

  const trayReady = u4TrayAccepted(u4.picks);

  return (
    <section className={styles.menuStage} aria-label={U4_SCENE.menuKicker}>
      <p className={styles.menuKicker}>{U4_SCENE.menuKicker}</p>
      <p className={styles.noiseWhisper}>{U4_SCENE.menuLine}</p>

      <ul className={styles.menuBoard}>
        {DISHES.map((dish) => {
          const content = DISH_CONTENT[dish];
          return (
            <li key={dish} className={styles.menuItemWrap}>
              <button
                type="button"
                className={styles.menuItem}
                onClick={() => {
                  setPickedFlash((n) => n + 1);
                  onPick(dish);
                }}
                aria-describedby={`quota-${dish}`}
              >
                <span className={styles.menuItemLabel}>{content.label}</span>
                <span id={`quota-${dish}`} className={styles.menuItemGloss}>
                  {content.gloss}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div
        className={styles.quotaRow}
        key={pickedFlash}
        role="img"
        aria-label={`${U4_SCENE.quotaBarFull} سهمیه: ${CALORIE_QUOTA} از ${CALORIE_QUOTA}.`}
      >
        <span className={styles.quotaBar} aria-hidden="true">
          <span className={styles.quotaFill} />
        </span>
        <span className={styles.quotaNote}>{U4_SCENE.menuHint}</span>
      </div>

      <ol className={styles.trayList} aria-label="سینی">
        {u4.chosen.map((dish, index) => (
          <li key={`${dish}-${index}`} className={styles.trayLine}>
            {DISH_CONTENT[dish].trayLine}
          </li>
        ))}
      </ol>

      {u4.chosen.length >= DISHES.length ? (
        <p className={styles.menuPickAll}>{U4_SCENE.pickAllLabel}</p>
      ) : null}

      <div className={styles.menuActs}>
        {phase === "menu" ? (
          trayReady ? (
            <button
              type="button"
              className={styles.continueButton}
              onClick={onTakeTray}
            >
              {U4_SCENE.trayOfferAct}
            </button>
          ) : (
            <p className={styles.menuWaiting}>{U4_SCENE.trayWaiting}</p>
          )
        ) : null}
        {phase === "tray" ? (
          <>
            <p className={styles.menuTaken}>{U4_SCENE.trayTakenLine}</p>
            <button
              type="button"
              className={styles.continueButton}
              onClick={onTakeTray}
            >
              سینی را تا تهٔ سالن می‌برم
            </button>
          </>
        ) : null}
      </div>

      <p className={styles.menuThresholdHint} aria-hidden="true">
        {trayReady || u4.picks === 0
          ? ""
          : `${Math.max(0, U4_THRESHOLD - u4.picks)} قاشق دیگر.`}
      </p>
    </section>
  );
}

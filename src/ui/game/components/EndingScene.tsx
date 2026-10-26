import styles from "@/app/game.module.css";
import { ENDINGS } from "@/content/u1";
import { U2_BRIDGE } from "@/content/u2";
import type { GameState } from "@/domain/session/types";

function EndingArt({ ending }: { ending: NonNullable<GameState["ending"]> }) {
  if (ending === "file") {
    return (
      <svg viewBox="0 0 260 260" className={styles.endingArt} aria-hidden="true">
        <rect x="42" y="86" width="176" height="124" fill="#2b2116" />
        <rect x="52" y="72" width="176" height="124" fill="#c9b58f" />
        <path d="M52 72h176v18H52z" fill="#8d2f37" opacity="0.55" />
        <path d="M78 120h92M78 138h112M78 156h72" stroke="#4a3b28" strokeWidth="2" opacity="0.5" />
        <circle cx="188" cy="170" r="9" fill="#7d252d" opacity="0.55" />
        <circle cx="206" cy="184" r="6" fill="#7d252d" opacity="0.4" />
        <circle cx="176" cy="188" r="4" fill="#7d252d" opacity="0.3" />
      </svg>
    );
  }
  if (ending === "paper") {
    return (
      <svg viewBox="0 0 260 260" className={styles.endingArt} aria-hidden="true">
        <rect x="40" y="122" width="180" height="92" fill="#241a12" />
        <rect x="56" y="134" width="148" height="68" fill="#15100b" />
        <rect x="70" y="112" width="120" height="10" fill="#d5c29c" opacity="0.7" />
        <circle cx="178" cy="168" r="4" fill="#b78c4e" />
        <circle cx="70" cy="168" r="10" fill="#7d252d" opacity="0.25" />
        <circle cx="88" cy="182" r="7" fill="#7d252d" opacity="0.2" />
        <circle cx="60" cy="188" r="5" fill="#7d252d" opacity="0.18" />
      </svg>
    );
  }
  if (ending === "ash") {
    return (
      <svg viewBox="0 0 260 260" className={styles.endingArt} aria-hidden="true">
        <path d="M48 178l34-22 18 18-26 26z" fill="#d5c29c" opacity="0.75" />
        <path d="M122 160l26-12 20 20-22 20z" fill="#c9b58f" opacity="0.7" />
        <path d="M176 192l30-14 13 16-24 18z" fill="#d5c29c" opacity="0.55" />
        <path d="M92 202l18 10-16 10z" fill="#bda986" opacity="0.5" />
        <circle cx="160" cy="128" r="8" fill="#7d252d" opacity="0.6" />
        <circle cx="180" cy="144" r="5" fill="#7d252d" opacity="0.45" />
        <circle cx="146" cy="146" r="4" fill="#7d252d" opacity="0.35" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 320 260" className={styles.endingArt} aria-hidden="true">
      <rect x="118" y="34" width="170" height="136" fill="#0a1210" stroke="#5c4f3b" strokeWidth="3" />
      <path d="M132 156V54h142v102" fill="#1a2c25" opacity="0.6" />
      <path d="M203 34v136M118 102h170" stroke="#5c4f3b" strokeWidth="2" opacity="0.6" />
      <ellipse cx="168" cy="140" rx="10" ry="26" fill="#0b1511" />
      <circle cx="168" cy="106" r="8" fill="#0b1511" />
      <ellipse cx="246" cy="142" rx="11" ry="25" fill="#0b1511" />
      <circle cx="246" cy="108" r="8" fill="#0b1511" />
      <path d="M58 170h96v9H58z" fill="#3a2d1e" opacity="0.8" />
    </svg>
  );
}

export function EndingScene({
  state,
  onContinue,
  onRestart,
  onOpenArchive,
}: {
  state: GameState;
  onContinue: () => void;
  onRestart: () => void;
  onOpenArchive: () => void;
}) {
  const ending = ENDINGS[state.ending ?? "silence"];
  return (
    <section className={styles.endingScene} aria-label="برگه">
      <div className={styles.endingRoom} aria-hidden="true">
        <span className={styles.endingDoorLight} />
      </div>
      <div className={styles.endingLayout}>
        <div className={styles.endingCopy}>
          <p className={styles.endingKicker}>{ending.kicker}</p>
          <h1 className={styles.endingTitle}>{ending.title}</h1>
          {ending.body.split("\n\n").map((paragraph) => (
            <p key={paragraph} className={styles.endingParagraph}>
              {paragraph}
            </p>
          ))}
          <p className={styles.endingBridge}>
            {U2_BRIDGE[state.ending ?? "silence"]}
          </p>
          <div className={styles.endingActions}>
            <button type="button" className={styles.continueButton} onClick={onContinue}>
              ادامه
            </button>
            <button type="button" className={styles.coverButton} onClick={onOpenArchive}>
              پشت جلد
            </button>
            <button type="button" className={styles.againButton} onClick={onRestart}>
              از نو
            </button>
          </div>
        </div>
        <div className={styles.endingArtWrap}>
          <EndingArt ending={state.ending ?? "silence"} />
        </div>
      </div>
    </section>
  );
}

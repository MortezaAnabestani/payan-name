import styles from "@/app/game.module.css";
import { U2_RESOLUTION } from "@/content/u2";
import type { GameState } from "@/domain/session/types";

function ResolutionArt({ outcome }: { outcome: "captured" | "denied" }) {
  if (outcome === "captured") {
    return (
      <svg viewBox="0 0 260 260" className={styles.endingArt} aria-hidden="true">
        <rect x="44" y="70" width="176" height="130" fill="#c9b58f" transform="rotate(-1.6 132 135)" />
        <path
          d="M60 96h60M74 116h76M64 136h48M88 156h64"
          stroke="#4a3b28"
          strokeWidth="2"
          opacity="0.35"
        />
        <text
          x="130"
          y="204"
          textAnchor="middle"
          fontSize="17"
          fontWeight="700"
          fill="#5b171f"
        >
          سه قطره خون
        </text>
        <rect x="168" y="148" width="66" height="86" fill="#3a2c1c" transform="rotate(7 201 191)" />
        <rect x="174" y="142" width="66" height="86" fill="#57452c" transform="rotate(7 207 185)" />
        <path d="M186 168h40M186 184h40M186 200h26" stroke="#d5c29c" strokeWidth="2" opacity="0.6" transform="rotate(7 207 185)" />
        <circle cx="76" cy="216" r="5" fill="#7d252d" opacity="0.5" />
        <circle cx="94" cy="228" r="3.6" fill="#7d252d" opacity="0.38" />
        <circle cx="66" cy="232" r="2.8" fill="#7d252d" opacity="0.3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 260 260" className={styles.endingArt} aria-hidden="true">
      <rect x="44" y="70" width="176" height="130" fill="#e8dbc0" transform="rotate(1.4 132 135)" />
      <rect x="56" y="82" width="152" height="106" fill="none" stroke="#4a3b28" strokeWidth="1.4" opacity="0.25" />
      <circle cx="150" cy="160" r="4.6" fill="#7d252d" opacity="0.4" />
      <circle cx="170" cy="172" r="3.4" fill="#7d252d" opacity="0.3" />
      <circle cx="136" cy="176" r="2.6" fill="#7d252d" opacity="0.24" />
      <path d="M96 96c18-10 40-10 58 0" stroke="#4a3b28" strokeWidth="1.6" opacity="0.2" fill="none" />
    </svg>
  );
}

export function U2ResolutionScene({
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
  const outcome = state.u2.outcome ?? "denied";
  const resolution = U2_RESOLUTION[outcome];
  return (
    <section className={styles.endingScene} aria-label="برگه">
      <div className={styles.endingRoom} aria-hidden="true">
        <span className={styles.endingDoorLight} />
      </div>
      <div className={styles.endingLayout}>
        <div className={styles.endingCopy}>
          <p className={styles.endingKicker}>{resolution.kicker}</p>
          <h1 className={styles.endingTitle}>{resolution.title}</h1>
          {resolution.body.split("\n\n").map((paragraph) => (
            <p key={paragraph} className={styles.endingParagraph}>
              {paragraph}
            </p>
          ))}
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
          <ResolutionArt outcome={outcome} />
        </div>
      </div>
    </section>
  );
}

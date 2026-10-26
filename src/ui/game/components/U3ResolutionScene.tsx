import styles from "@/app/game.module.css";
import { U3_RESOLUTION } from "@/content/u3";

export function U3ResolutionScene({
  onContinue,
  onRestart,
  onOpenArchive,
}: {
  onContinue: () => void;
  onRestart: () => void;
  onOpenArchive: () => void;
}) {
  return (
    <section className={styles.endingScene} aria-label="برگه">
      <div className={styles.endingRoom} aria-hidden="true">
        <span className={styles.endingDoorLight} />
      </div>
      <div className={styles.endingLayout}>
        <div className={styles.endingCopy}>
          <p className={styles.endingKicker}>{U3_RESOLUTION.kicker}</p>
          <h1 className={styles.endingTitle}>{U3_RESOLUTION.title}</h1>
          {U3_RESOLUTION.body.split("\n\n").map((paragraph) => (
            <p key={paragraph} className={styles.endingParagraph}>
              {paragraph}
            </p>
          ))}
          <div className={styles.endingActions}>
            <button
              type="button"
              className={styles.continueButton}
              onClick={onContinue}
            >
              ادامه
            </button>
            <button
              type="button"
              className={styles.coverButton}
              onClick={onOpenArchive}
            >
              پشت جلد
            </button>
            <button
              type="button"
              className={styles.againButton}
              onClick={onRestart}
            >
              از نو
            </button>
          </div>
        </div>
        <div className={styles.endingArtWrap}>
          <svg viewBox="0 0 320 260" className={styles.endingArt} aria-hidden="true">
            <rect x="52" y="70" width="216" height="140" fill="#241a11" />
            <rect x="52" y="70" width="216" height="52" fill="#2c4a6e" opacity="0.55" />
            <circle cx="108" cy="96" r="16" fill="#c9a86a" opacity="0.7" />
            <path
              d="M76 210v-64h34v64M140 210v-64h34v64M204 210v-64h34v64"
              fill="none"
              stroke="#b78c4e"
              strokeWidth="2"
              opacity="0.6"
            />
            <path d="M52 210h216" stroke="#b78c4e" strokeWidth="2" opacity="0.5" />
            <rect x="118" y="128" width="84" height="54" fill="#e8dbc0" transform="rotate(-2 160 155)" />
            <path d="M132 146h56M138 162h44" stroke="#4a3b28" strokeWidth="2" opacity="0.5" />
            <path
              d="M118 96c26-12 58-12 84 0"
              fill="none"
              stroke="#e0b56e"
              strokeWidth="1.4"
              opacity="0.4"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

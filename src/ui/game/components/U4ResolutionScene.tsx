import styles from "@/app/game.module.css";
import { U4_RESOLUTION } from "@/content/u4";

export function U4ResolutionScene({
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
          <p className={styles.endingKicker}>{U4_RESOLUTION.kicker}</p>
          <h1 className={styles.endingTitle}>{U4_RESOLUTION.title}</h1>
          {U4_RESOLUTION.body.split("\n\n").map((paragraph) => (
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
            {/* سینیِ فلزی با سه ظرف یکسان — همان مزه برای همه */}
            <rect x="40" y="150" width="240" height="14" rx="3" fill="#3a2c1c" />
            <rect x="40" y="150" width="240" height="4" fill="#b78c4e" opacity="0.5" />
            <path
              d="M78 150v-26h44v26M138 150v-34h44v34M198 150v-26h44v26"
              fill="#241a11"
              stroke="#b78c4e"
              strokeWidth="2"
              opacity="0.75"
            />
            <ellipse cx="100" cy="124" rx="22" ry="6" fill="#c9a86a" opacity="0.55" />
            <ellipse cx="160" cy="116" rx="22" ry="6" fill="#e8dbc0" opacity="0.5" />
            <ellipse cx="220" cy="124" rx="22" ry="6" fill="#9a8a6c" opacity="0.55" />
            {/* بخار بی‌تفاوت */}
            <path
              d="M100 108c-4-10 4-14 0-24M160 100c-4-10 4-14 0-24M220 108c-4-10 4-14 0-24"
              fill="none"
              stroke="#e0b56e"
              strokeWidth="1.4"
              opacity="0.35"
            />
            {/* خط صاف افق سالن — صف‌ها یکی‌اند */}
            <path d="M20 196h280" stroke="#b78c4e" strokeWidth="2" opacity="0.4" />
            <path d="M20 214h280" stroke="#b78c4e" strokeWidth="1" opacity="0.2" />
          </svg>
        </div>
      </div>
    </section>
  );
}

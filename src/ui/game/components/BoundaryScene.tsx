import styles from "@/app/game.module.css";

/**
 * دروازهٔ پایان برش: صادقانه می‌گوید ادامه ساخته نشده است.
 * هیچ برچسب فاز/نظری روی سطح نمی‌آید.
 */
export function BoundaryScene({
  onRestart,
  onOpenArchive,
}: {
  onRestart: () => void;
  onOpenArchive: () => void;
}) {
  return (
    <section className={styles.endingScene} aria-label="ادامه">
      <div className={styles.endingRoom} aria-hidden="true">
        <span className={styles.endingDoorLight} />
      </div>
      <div className={styles.endingLayout}>
        <div className={styles.endingCopy}>
          <p className={styles.endingKicker}>ادامه</p>
          <h1 className={styles.endingTitle}>هنوز ساخته نشده</h1>
          <p className={styles.endingParagraph}>
            تا همین‌جا ساخته شده است: یک شب، یک کاغذ، و یک روزِ آسایشگاه که دو
            بار آمد.
          </p>
          <p className={styles.endingParagraph}>
            ادامهٔ راه — حسن، خوراک‌های چاپی و کسانی که هنوز نیامده‌اند — در گام
            بعد ساخته می‌شود. می‌توانی از اول برگردی، یا پشت جلد را بگشایی و
            متن منبع را بخوانی.
          </p>
          <div className={styles.endingActions}>
            <button type="button" className={styles.coverButton} onClick={onOpenArchive}>
              پشت جلد
            </button>
            <button type="button" className={styles.againButton} onClick={onRestart}>
              از نو
            </button>
          </div>
        </div>
        <div className={styles.endingArtWrap}>
          <svg viewBox="0 0 320 260" className={styles.endingArt} aria-hidden="true">
            <rect x="60" y="96" width="200" height="120" fill="#241a11" />
            <rect x="74" y="108" width="172" height="96" fill="#c9b58f" transform="rotate(-1.2 160 156)" />
            <path d="M92 132h80M104 152h96M88 172h60" stroke="#4a3b28" strokeWidth="2" opacity="0.35" />
            <text x="176" y="204" textAnchor="middle" fontSize="15" fontWeight="700" fill="#5b171f" transform="rotate(-1.2 176 204)">
              سه قطره خون
            </text>
            <path d="M36 96c40-34 208-34 248 0" stroke="#b78c4e" strokeWidth="1.5" fill="none" opacity="0.3" />
            <circle cx="160" cy="70" r="26" fill="#1a130c" stroke="#b78c4e" strokeWidth="1.2" opacity="0.7" />
            <path d="M160 34v10M160 96v10M124 70h10M186 70h10" stroke="#b78c4e" strokeWidth="1.4" opacity="0.5" />
          </svg>
        </div>
      </div>
    </section>
  );
}

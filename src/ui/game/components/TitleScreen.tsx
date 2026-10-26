import styles from "@/app/game.module.css";
import { ThreeDrops } from "./ThreeDrops";

export function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className={styles.titleScene} aria-label="سه قطره خون">
      <div className={styles.titleRoom} aria-hidden="true">
        <span className={styles.titleDoorLight} />
        <span className={styles.titleLamp} />
        <span className={styles.titleTable} />
      </div>
      <div className={styles.titleContent}>
        <div className={styles.titleBook}>
          <span className={styles.bookEdge} aria-hidden="true" />
          <ThreeDrops className={styles.titleDrops} intensity={0.55} />
          <p className={styles.titleKicker}>اتاق جدا</p>
          <h1 className={styles.gameTitle}>سه قطره خون</h1>
          <p className={styles.gameSubtitle}>شبی که کاغذ را آوردند</p>
          <button type="button" className={styles.startButton} onClick={onStart}>
            پشت میز می‌نشینم
          </button>
        </div>
      </div>
    </section>
  );
}

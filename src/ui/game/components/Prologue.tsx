import styles from "@/app/game.module.css";
import { PROLOGUE_LINES } from "@/content/u1";

export function Prologue({ onBegin }: { onBegin: () => void }) {
  return (
    <section className={styles.prologueScene} aria-label="پیش‌درآمد">
      <div className={styles.prologueRoom} aria-hidden="true">
        <span className={styles.prologueDoorLight} />
        <span className={styles.prologueTableEdge} />
      </div>
      <div className={styles.prologueCopy}>
        {PROLOGUE_LINES.map((line, index) => (
          <p
            key={line}
            className={styles.prologueLine}
            style={{ animationDelay: `${index * 520}ms` }}
          >
            {line}
          </p>
        ))}
        <button
          type="button"
          className={styles.prologueSit}
          onClick={onBegin}
          style={{ animationDelay: `${PROLOGUE_LINES.length * 520}ms` }}
          aria-label="چهارپایه را بکش و پشت میز بنشین"
        >
          <span className={styles.sitStool} aria-hidden="true">
            <span className={styles.sitStoolTop} />
            <span className={styles.sitStoolLegA} />
            <span className={styles.sitStoolLegB} />
          </span>
        </button>
      </div>
    </section>
  );
}

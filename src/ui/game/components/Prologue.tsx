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
          className={styles.prologueAction}
          onClick={onBegin}
          style={{ animationDelay: `${PROLOGUE_LINES.length * 520}ms` }}
        >
          پشت میز می‌نشینم
        </button>
      </div>
    </section>
  );
}

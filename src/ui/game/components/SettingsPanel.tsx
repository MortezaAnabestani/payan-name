import styles from "@/app/game.module.css";
import type { Settings } from "@/domain/session/types";

export function SettingsPanel({
  settings,
  onChange,
  onRestart,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onRestart: () => void;
}) {
  return (
    <div className={styles.settingsBlock}>
      <div className={styles.settingsGrid}>
        <label className={styles.toggleRow}>
          <span>
            <strong>صدا</strong>
            <small>همهمهٔ اتاق، قدم‌ها و صدای قلم.</small>
          </span>
          <input
            type="checkbox"
            checked={!settings.muted}
            onChange={(event) => onChange({ muted: !event.target.checked })}
          />
        </label>
        <label className={styles.toggleRow}>
          <span>
            <strong>کاهش حرکت</strong>
            <small>لرزش کاغذ و حرکت لکه‌ها را می‌خواباند.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(event) => onChange({ reduceMotion: event.target.checked })}
          />
        </label>
        <label className={styles.toggleRow}>
          <span>
            <strong>کنتراست بالا</strong>
            <small>لبه‌ها و نوشته پررنگ‌تر می‌شوند.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(event) => onChange({ highContrast: event.target.checked })}
          />
        </label>
        <label className={styles.selectRow}>
          <span>
            <strong>اندازهٔ نوشته</strong>
            <small>اندازهٔ متن روی کاغذ و روایت.</small>
          </span>
          <select
            value={settings.textScale}
            onChange={(event) =>
              onChange({
                textScale: Number(event.target.value) as Settings["textScale"],
              })
            }
          >
            <option value={1}>معمولی</option>
            <option value={1.15}>بزرگ</option>
            <option value={1.3}>بزرگ‌تر</option>
          </select>
        </label>
      </div>
      <div className={styles.modalActions}>
        <button type="button" className={styles.dangerButton} onClick={onRestart}>
          شروع از نو
        </button>
        <p className={styles.modalNote}>
          نشست در همین مرورگر می‌ماند. «شروع از نو» آن را پاک می‌کند.
        </p>
      </div>
    </div>
  );
}

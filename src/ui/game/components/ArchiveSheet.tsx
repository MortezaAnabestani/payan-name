import styles from "@/app/game.module.css";
import { U1 } from "@/content/u1";
import { MOTIF_STATE_LINE, U2 } from "@/content/u2";
import { U3, claimLineFor } from "@/content/u3";
import { claimStageFor } from "@/domain/session/reducer";
import type { GameState, Settings } from "@/domain/session/types";
import { Modal } from "./Modal";
import { SettingsPanel } from "./SettingsPanel";

export function ArchiveSheet({
  state,
  onChange,
  onRestart,
  onClose,
}: {
  state: GameState;
  onChange: (patch: Partial<Settings>) => void;
  onRestart: () => void;
  onClose: () => void;
}) {
  const u1Seen =
    state.phase === "u1Resolved" ||
    state.phase === "noise" ||
    state.phase === "u2Resolved" ||
    state.phase === "boundary";
  const u2Seen = state.phase === "u2Resolved" || state.phase === "boundary";
  const u3Seen = state.phase === "u3Resolved" || state.phase === "boundary";
  const wardSeen = state.phase === "ward" || u3Seen;

  return (
    <Modal title="پشت جلد" onClose={onClose}>
      <SettingsPanel
        settings={state.settings}
        onChange={onChange}
        onRestart={onRestart}
      />

      <section className={styles.archiveSection}>
        <h3 className={styles.archiveHeading}>متن منبع</h3>
        {u1Seen ? (
          <>
            <p className={styles.archiveMeta}>
              «سه قطره خون» صادق هدایت — سطر {U1.source.lines}، جمله‌های{" "}
              {U1.source.sentences}.
            </p>
            <blockquote className={styles.archiveQuote}>
              {U1.source.quote}
            </blockquote>
          </>
        ) : (
          <p className={styles.archiveMeta}>
            این برگه پس از پایان باز می‌شود. تا آن‌وقت، فقط همان چیزی را داری که
            روی کاغذ مانده است.
          </p>
        )}
        {u2Seen ? (
          <>
            <p className={styles.archiveMeta}>
              سطر {U2.source.lines}، جمله‌های {U2.source.sentences}.
            </p>
            <blockquote className={styles.archiveQuote}>
              {U2.source.quote}
            </blockquote>
          </>
        ) : null}
        {u3Seen ? (
          <>
            <p className={styles.archiveMeta}>
              سطر {U3.source.lines}، جمله‌های {U3.source.sentences}.
            </p>
            <blockquote className={styles.archiveQuote}>
              {U3.source.quote}
            </blockquote>
          </>
        ) : null}
        {u1Seen ? (
          <p className={styles.archiveMeta}>
            {MOTIF_STATE_LINE[state.motifOwner]}
          </p>
        ) : null}
        {wardSeen ? (
          <p className={styles.archiveMeta}>
            {claimLineFor(claimStageFor(state.u3.sameActs))}
          </p>
        ) : null}
      </section>

      <p className={styles.archiveFooter}>
        شناسهٔ نشست: {state.sessionId.slice(0, 8)} — نگه‌داری محلی.
      </p>
    </Modal>
  );
}

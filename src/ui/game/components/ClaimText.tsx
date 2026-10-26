import type { CSSProperties, ReactNode } from "react";
import styles from "@/app/game.module.css";
import { charDecay } from "../scene/decay";

/**
 * جملهٔ روی برگهٔ U3: با هر پلهٔ کنش همسانی، محو‌تر می‌شود.
 * stage: ۰ = دست‌نخورده، ۴ = محو کامل (با attempt سنگین‌تر رندر می‌شود).
 */
export function ClaimText({
  text,
  stage,
  className,
}: {
  text: string;
  stage: number;
  className?: string;
}) {
  const attempt = stage >= 4 ? 6 : stage;
  const chars = Array.from(text);
  const nodes: ReactNode[] = chars.map((char, index) => {
    if (char === " ") {
      return <span key={`space-${index}`}> </span>;
    }
    const seed = index + attempt * 97 + text.length * 13;
    const values = charDecay(seed, attempt);
    const style = {
      "--drift": `${values.drift}px`,
      "--fall": `${values.fall}px`,
      "--tilt": `${values.tilt}deg`,
      "--ink": `${values.ink}`,
      "--blur": `${values.blur}px`,
    } as CSSProperties;
    return (
      <span key={`${char}-${index}`} className={styles.decayChar} style={style}>
        {char}
      </span>
    );
  });

  return (
    <div className={`${styles.decayWrap} ${styles.claimWrap} ${className ?? ""}`}>
      <p
        className={`${styles.decayText} ${styles.claimText}`}
        aria-hidden="true"
        data-claim-stage={stage}
      >
        {nodes}
      </p>
      <span className={styles.srOnly}>{text}</span>
    </div>
  );
}

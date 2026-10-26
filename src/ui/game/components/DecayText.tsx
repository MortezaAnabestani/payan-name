import type { CSSProperties, ReactNode } from "react";
import styles from "@/app/game.module.css";
import { MOTIF } from "@/domain/session/reducer";
import { charDecay, motifRange, readableMask } from "../scene/decay";

export function DecayText({
  text,
  attempt,
  showResidue = true,
  className,
}: {
  text: string;
  attempt: number;
  showResidue?: boolean;
  className?: string;
}) {
  const chars = Array.from(text);
  const readable = readableMask(text);
  const hasMotif = motifRange(text) !== null;
  const nodes: ReactNode[] = [];

  let index = 0;
  while (index < chars.length) {
    const char = chars[index];
    if (readable[index]) {
      let end = index;
      while (end < chars.length && readable[end] && chars[end] !== "\n") {
        end += 1;
      }
      nodes.push(
        <span key={`motif-${index}`} className={styles.decayReadable}>
          {chars.slice(index, end).join("")}
        </span>,
      );
      index = end;
      continue;
    }

    if (char === "\n") {
      nodes.push(<br key={`break-${index}`} />);
    } else if (char === " ") {
      nodes.push(<span key={`space-${index}`}> </span>);
    } else {
      const seed = index + attempt * 97 + text.length * 13;
      const values = charDecay(seed, attempt);
      const style = {
        "--drift": `${values.drift}px`,
        "--fall": `${values.fall}px`,
        "--tilt": `${values.tilt}deg`,
        "--ink": `${values.ink}`,
        "--blur": `${values.blur}px`,
      } as CSSProperties;
      nodes.push(
        <span key={`${char}-${index}`} className={styles.decayChar} style={style}>
          {char}
        </span>,
      );
    }
    index += 1;
  }

  return (
    <div className={`${styles.decayWrap} ${className ?? ""}`}>
      <p className={styles.decayText} aria-hidden="true">
        {nodes}
      </p>
      <span className={styles.srOnly}>{text}</span>
      {showResidue && !hasMotif ? (
        <p className={styles.motifResidue}>{MOTIF}</p>
      ) : null}
    </div>
  );
}

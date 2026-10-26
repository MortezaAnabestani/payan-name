export interface CharDecay {
  drift: number;
  fall: number;
  tilt: number;
  ink: number;
  blur: number;
}

export function noise(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function motifRange(text: string): [number, number] | null {
  const match = text.match(/(?:سه|3)[\s\u200c]*قطره[ٔ\s\u200c]*خون/);
  if (!match || match.index === undefined) return null;
  return [match.index, match.index + match[0].length];
}

export function readableMask(text: string): boolean[] {
  const range = motifRange(text);
  const chars = Array.from(text);
  return chars.map(
    (_, index) =>
      range !== null && index >= range[0] && index < range[1],
  );
}

export function charDecay(seed: number, attempt: number): CharDecay {
  return {
    drift: (noise(seed) - 0.5) * (8 + attempt * 4),
    fall: (noise(seed + 3.1) - 0.5) * (6 + attempt * 3),
    tilt: (noise(seed + 5.7) - 0.5) * (8 + attempt * 3),
    ink: Math.max(0.12, 0.62 - attempt * 0.12 + noise(seed) * 0.18),
    blur: 0.2 + noise(seed + 8.4) * 1.4 + attempt * 0.18,
  };
}

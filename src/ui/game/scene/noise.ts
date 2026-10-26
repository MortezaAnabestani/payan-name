/**
 * موتور میدان نویز U2 («فیلتر معکوس»).
 * خالص و قطعی: هیچ DOM/زمان/تصادفی جهانی در منطق نیست؛ همه‌چیز از seed و nonce می‌آید.
 * قاعدهٔ پیمان تفسیری: هر پاک‌کردن، نویزِ تازه تولید می‌کند — نرخ ثابت و بی‌پیام خطا.
 */

export interface StrokePoint {
  x: number;
  y: number;
}

export interface NoiseCell {
  /** مختصات نرمال‌شده در [0,1] نسبت به کاغذ. */
  x: number;
  y: number;
  glyph: string;
  ink: number;
  tilt: number;
  scale: number;
}

export interface MotifMark {
  index: 1 | 2 | 3;
  x: number;
  y: number;
}

export interface NoiseField {
  cols: number;
  rows: number;
  seed: number;
  cells: NoiseCell[];
  /** مجموع جوهر در آغاز؛ مبنای خوانایی. */
  baseInk: number;
  /** آخرین نگارهٔ ثبت‌شده روی میدان (جدیدترین ظهور). */
  motif: MotifMark | null;
  /** مسیر آخرین ضربهٔ برس؛ برای بازتولید نویز بیرون از همان ناحیه. */
  lastStroke: StrokePoint[];
}

export const U2_CONFIG = {
  cols: 24,
  rows: 30,
  density: 0.72,
  wipeRadius: 0.085,
  regenFraction: 0.12,
  /** آستانه‌های ظهور عبارت بر حسب تعداد ضربهٔ برس. */
  surfaceStrokes: [5, 12, 22] as const,
  /** اگر خوانایی از این حد بگذرد، کاغذ «سفید» شمرده می‌شود. */
  blankReadability: 0.8,
  keyboardStep: 0.055,
  strokeHalfWidth: 0.09,
  candidates: [
    { x: 0.68, y: 0.24 },
    { x: 0.3, y: 0.52 },
    { x: 0.52, y: 0.78 },
  ],
  bounds: { minX: 0.16, maxX: 0.85, minY: 0.14, maxY: 0.86 },
  glyphs:
    "ا ب پ ت ث ج چ ح خ د ذ ر ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن و ه ی".split(" "),
} as const;

function noise(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function cellSeed(seed: number, index: number): number {
  return seed * 0.0001 + index * 7.31;
}

export function createField(seed: number): NoiseField {
  const { cols, rows, density, bounds, glyphs } = U2_CONFIG;
  const cells: NoiseCell[] = [];
  let inkTotal = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const base = cellSeed(seed, index);
      if (noise(base) > density) continue;

      const x = clamp01(
        bounds.minX +
          (col / Math.max(1, cols - 1)) * (bounds.maxX - bounds.minX) +
          (noise(base + 1.7) - 0.5) * 0.02,
      );
      const y = clamp01(
        bounds.minY +
          (row / Math.max(1, rows - 1)) * (bounds.maxY - bounds.minY) +
          (noise(base + 3.3) - 0.5) * 0.02,
      );
      const ink = 0.32 + noise(base + 5.1) * 0.5;
      cells.push({
        x,
        y,
        glyph: glyphs[Math.floor(noise(base + 9.4) * glyphs.length) % glyphs.length],
        ink,
        tilt: (noise(base + 11.8) - 0.5) * 14,
        scale: 0.85 + noise(base + 13.6) * 0.5,
      });
      inkTotal += ink;
    }
  }

  return {
    cols,
    rows,
    seed,
    cells,
    baseInk: Math.max(1, inkTotal),
    motif: null,
    lastStroke: [],
  };
}

function distanceToStroke(
  cell: NoiseCell,
  stroke: readonly StrokePoint[],
): number {
  let best = Number.POSITIVE_INFINITY;
  for (const point of stroke) {
    const dx = cell.x - point.x;
    const dy = cell.y - point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < best) best = distance;
  }
  return best;
}

/** ضربهٔ برس: جوهر سلول‌های زیر برس را پاک می‌کند. نویز تازه در regenerate می‌آید. */
export function wipe(field: NoiseField, stroke: readonly StrokePoint[]): NoiseField {
  if (stroke.length === 0) return field;
  const radius = U2_CONFIG.wipeRadius;
  const cells = field.cells.map((cell) => {
    if (cell.ink <= 0) return cell;
    if (distanceToStroke(cell, stroke) > radius) return cell;
    return { ...cell, ink: 0 };
  });
  return { ...field, cells, lastStroke: [...stroke] };
}

/** نویز تازه: بخشی از نویزِ پاک‌شده، بیرون از ناحیهٔ ضربه، از نو می‌روید. */
export function regenerate(field: NoiseField, nonce: number): NoiseField {
  const radius = U2_CONFIG.wipeRadius;
  const destroyed = field.cells.filter(
    (cell) =>
      cell.ink <= 0 && distanceToStroke(cell, field.lastStroke) <= radius,
  ).length;
  const quota = Math.round(destroyed * U2_CONFIG.regenFraction);
  if (quota <= 0) return field;

  const cells = [...field.cells];
  let placed = 0;
  for (let attempt = 0; attempt < quota * 24 && placed < quota; attempt += 1) {
    const pick = Math.floor(
      noise(nonce * 3.7 + attempt * 2.13 + field.seed * 0.0001) * cells.length,
    );
    const cell = cells[pick];
    if (!cell || cell.ink >= 0.85) continue;
    if (distanceToStroke(cell, field.lastStroke) <= radius * 1.2) continue;
    cells[pick] = {
      ...cell,
      ink: 0.55 + noise(nonce + attempt * 5.7) * 0.35,
      glyph: U2_CONFIG.glyphs[
        Math.floor(noise(nonce + attempt * 9.1) * U2_CONFIG.glyphs.length) %
          U2_CONFIG.glyphs.length
      ],
    };
    placed += 1;
  }
  return { ...field, cells };
}

export function readability(field: NoiseField): number {
  const inkTotal = field.cells.reduce((sum, cell) => sum + cell.ink, 0);
  return clamp01(1 - inkTotal / field.baseInk);
}

export function isBlank(field: NoiseField): boolean {
  return readability(field) >= U2_CONFIG.blankReadability;
}

export function surfacedCountFor(strokes: number): 0 | 1 | 2 | 3 {
  let count = 0;
  for (const threshold of U2_CONFIG.surfaceStrokes) {
    if (strokes >= threshold) count += 1;
  }
  return count as 0 | 1 | 2 | 3;
}

/** سه نقطهٔ نامزدِ ظهور — متغیر محدود: هر کدام در یک منطقهٔ متفاوت، ترتیب با seed. */
export function candidatePoints(seed: number): [StrokePoint, StrokePoint, StrokePoint] {
  const { candidates, bounds } = U2_CONFIG;
  const jittered = candidates.map((point, index) => ({
    x: clamp01(point.x + (noise(seed + index * 3.1) - 0.5) * 0.06),
    y: clamp01(point.y + (noise(seed + index * 5.3) - 0.5) * 0.06),
  })) as [StrokePoint, StrokePoint, StrokePoint];

  for (let index = jittered.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(noise(seed + 101 + index * 7.7) * (index + 1));
    [jittered[index], jittered[swap]] = [jittered[swap], jittered[index]];
  }

  return jittered.map((point) => ({
    x: Math.min(bounds.maxX, Math.max(bounds.minX, point.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, point.y)),
  })) as [StrokePoint, StrokePoint, StrokePoint];
}

export function placeMotif(
  field: NoiseField,
  index: 1 | 2 | 3,
  x: number,
  y: number,
): NoiseField {
  const expected = field.motif ? field.motif.index + 1 : 1;
  if (index !== expected || index < 1 || index > 3) return field;
  return {
    ...field,
    motif: { index, x: clamp01(x), y: clamp01(y) },
  };
}

/** ضربهٔ کیبوردی: خط افقی کوتاه حول نشانگر برس. */
export function strokeFromCursor(cursor: StrokePoint): StrokePoint[] {
  const half = U2_CONFIG.strokeHalfWidth;
  const points: StrokePoint[] = [];
  const steps = 5;
  for (let step = 0; step <= steps; step += 1) {
    points.push({
      x: clamp01(cursor.x - half + (step / steps) * half * 2),
      y: clamp01(cursor.y),
    });
  }
  return points;
}

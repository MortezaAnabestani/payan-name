/**
 * معادل‌های کیبوردی کنش‌های میز.
 * - Ctrl/⌘ + Enter: گذاشتن قلم (ثبت برگه)
 * - Escape: برداشتن دست از کاغذ (در حالت قفل، رهاکردن)
 * - K: نگه‌داشتن موتیف در حالت قفل
 * - کلیدهای جهت + فاصله: برسِ کاغذِ درهم (U2)
 */
export interface KeyLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export function isPenLiftKey(event: KeyLike): boolean {
  return event.key === "Enter" && Boolean(event.ctrlKey || event.metaKey);
}

export function lockedActForKey(event: KeyLike): "keep" | "release" | null {
  if (event.key === "k" || event.key === "K") return "keep";
  if (event.key === "Escape") return "release";
  return null;
}

export function brushMoveForKey(event: KeyLike): { dx: number; dy: number } | null {
  if (event.key === "ArrowLeft") return { dx: -1, dy: 0 };
  if (event.key === "ArrowRight") return { dx: 1, dy: 0 };
  if (event.key === "ArrowUp") return { dx: 0, dy: -1 };
  if (event.key === "ArrowDown") return { dx: 0, dy: 1 };
  return null;
}

export function isBrushStrokeKey(event: KeyLike): boolean {
  return event.key === " " || event.key === "Spacebar" || event.key === "Enter";
}

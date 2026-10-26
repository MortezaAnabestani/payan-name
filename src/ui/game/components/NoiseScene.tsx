"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import styles from "@/app/game.module.css";
import { U2_SCENE } from "@/content/u2";
import { MOTIF } from "@/domain/session/reducer";
import type { GameState } from "@/domain/session/types";
import {
  U2_CONFIG,
  candidatePoints,
  createField,
  hashSeed,
  isBlank,
  placeMotif,
  readability,
  regenerate,
  strokeFromCursor,
  surfacedCountFor,
  wipe,
  type NoiseField,
  type StrokePoint,
} from "../scene/noise";
import { brushMoveForKey, isBrushStrokeKey } from "../scene/keys";

/**
 * U2 — کاغذِ درهم («فیلتر معکوس»).
 * هر پاک‌کردن، نویز تازه تولید می‌کند؛ عبارت «سه قطره خون» در سه نقطهٔ نامزد
 * (متغیر محدود، ترتیب با seed) خوانا می‌شود. بدون HUD؛ همه‌چیز روی خود کاغذ است.
 */
export function NoiseScene({
  state,
  onSurface,
  onCapture,
  onDeny,
  onBrush,
  onDust,
}: {
  state: GameState;
  onSurface: (index: 1 | 2 | 3, x: number, y: number) => void;
  onCapture: () => void;
  onDeny: () => void;
  onBrush: (intensity: number) => void;
  onDust: () => void;
}) {
  const seed = useMemo(() => hashSeed(state.sessionId), [state.sessionId]);
  const points = useMemo(() => candidatePoints(seed), [seed]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<NoiseField | null>(null);
  const marksAtMountRef = useRef(state.u2.surfaced);
  const marksRef = useRef(state.u2.surfaced.length);
  const strokesRef = useRef(
    state.u2.surfaced.length > 0
      ? U2_CONFIG.surfaceStrokes[state.u2.surfaced.length - 1]
      : 0,
  );
  const strokeActive = useRef(false);
  const lastMovePaint = useRef(0);
  const strokeNonce = useRef(0);
  const rafRef = useRef(0);
  const cursorRef = useRef<StrokePoint | null>(null);

  const [cursorVisible, setCursorVisible] = useState(false);
  const [blankReady, setBlankReady] = useState(false);
  const [flash, setFlash] = useState(false);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const field = fieldRef.current;
    if (!canvas || !field) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    context.clearRect(0, 0, width, height);
    const family = getComputedStyle(document.body).fontFamily || "serif";
    const calmSurface = readability(field);

    // خط‌های درهم زیر حروف: با پاک‌شدن کم‌رنگ می‌شوند.
    const lineAlpha = Math.max(0.05, 0.2 * (1 - calmSurface));
    context.strokeStyle = `rgba(40, 34, 23, ${lineAlpha})`;
    context.lineWidth = 1 * dpr;
    for (let index = 0; index < 22; index += 1) {
      const sx = ((seed % 97) + index * 53) % 997;
      const a = ((sx * 13) % 1000) / 1000;
      const b = ((sx * 29) % 1000) / 1000;
      const c = ((sx * 47) % 1000) / 1000;
      const d = ((sx * 71) % 1000) / 1000;
      const x = a * width;
      const y = b * height;
      context.beginPath();
      context.moveTo(x, y);
      context.quadraticCurveTo(
        x + (c - 0.5) * width * 0.22,
        y + (d - 0.5) * height * 0.1,
        x + (d - 0.5) * width * 0.34,
        y + (c - 0.5) * height * 0.16,
      );
      context.stroke();
    }

    // ریزحروف پراکنده.
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (const cell of field.cells) {
      if (cell.ink <= 0.02) continue;
      context.save();
      context.translate(cell.x * width, cell.y * height);
      context.rotate((cell.tilt * Math.PI) / 180);
      context.font = `${Math.round(13 * cell.scale * dpr)}px ${family}`;
      context.fillStyle = `rgba(43, 36, 24, ${Math.min(0.85, cell.ink)})`;
      context.fillText(cell.glyph, 0, 0);
      context.restore();
    }

    // عبارت: رشتهٔ واحد تا شکل‌دهی فارسی کامل بماند.
    if (field.motif) {
      const x = field.motif.x * width;
      const y = field.motif.y * height;
      context.save();
      context.direction = "rtl";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `700 ${Math.round(19 * dpr)}px ${family}`;
      if (!state.settings.reduceMotion) {
        context.shadowColor = "rgba(183, 120, 74, 0.75)";
        context.shadowBlur = 14 * dpr;
      } else {
        context.shadowColor = "rgba(183, 120, 74, 0.4)";
        context.shadowBlur = 6 * dpr;
      }
      context.fillStyle = "#5b171f";
      context.fillText(MOTIF, x, y);
      context.restore();
    }

    // نشانگر برس کیبوردی.
    const cursor = cursorRef.current;
    if (cursor) {
      context.save();
      context.strokeStyle = "rgba(183, 140, 78, 0.85)";
      context.lineWidth = 1.5 * dpr;
      context.setLineDash([4 * dpr, 4 * dpr]);
      context.beginPath();
      context.arc(
        cursor.x * width,
        cursor.y * height,
        U2_CONFIG.wipeRadius * Math.min(width, height),
        0,
        Math.PI * 2,
      );
      context.stroke();
      context.restore();
    }
  }, [seed, state.settings.reduceMotion]);

  const paintRef = useRef(paint);
  useEffect(() => {
    paintRef.current = paint;
  }, [paint]);

  const requestPaint = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      paintRef.current();
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let field = createField(seed);
    for (const mark of marksAtMountRef.current) {
      field = placeMotif(field, mark.index, mark.x, mark.y);
    }
    fieldRef.current = field;
    paintRef.current();

    const observer = new ResizeObserver(() => paintRef.current());
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [seed]);

  useEffect(() => {
    marksRef.current = Math.max(marksRef.current, state.u2.surfaced.length);
  }, [state.u2.surfaced.length]);

  const finishStroke = useCallback(() => {
    const field = fieldRef.current;
    if (!field) return;
    strokeNonce.current += 1;
    fieldRef.current = regenerate(field, strokeNonce.current);
    strokesRef.current += 1;
    onDust();

    const count = surfacedCountFor(strokesRef.current);
    if (count > marksRef.current) {
      const index = (marksRef.current + 1) as 1 | 2 | 3;
      const point = points[index - 1];
      fieldRef.current = placeMotif(fieldRef.current, index, point.x, point.y);
      marksRef.current = index;
      onSurface(index, point.x, point.y);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1900);
    }

    if (!blankReady && isBlank(fieldRef.current)) {
      setBlankReady(true);
    }
    paintRef.current();
  }, [blankReady, onDust, onSurface, points]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>): StrokePoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  };

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    strokeActive.current = true;
    const point = pointFromEvent(event);
    if (fieldRef.current) {
      fieldRef.current = wipe(fieldRef.current, [point]);
    }
    onBrush(0.45);
    requestPaint();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!strokeActive.current || !fieldRef.current) return;
    const now = performance.now();
    if (now - lastMovePaint.current < 24) return;
    lastMovePaint.current = now;
    const point = pointFromEvent(event);
    fieldRef.current = wipe(fieldRef.current, [point]);
    onBrush(0.55);
    requestPaint();
  }

  function handlePointerEnd() {
    if (!strokeActive.current) return;
    strokeActive.current = false;
    finishStroke();
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLCanvasElement>) {
    const move = brushMoveForKey(event);
    if (move) {
      event.preventDefault();
      const current = cursorRef.current ?? { x: 0.5, y: 0.5 };
      const next = {
        x: Math.min(1, Math.max(0, current.x + move.dx * U2_CONFIG.keyboardStep)),
        y: Math.min(1, Math.max(0, current.y + move.dy * U2_CONFIG.keyboardStep)),
      };
      cursorRef.current = next;
      setCursorVisible(true);
      requestPaint();
      return;
    }
    if (isBrushStrokeKey(event)) {
      event.preventDefault();
      const current = cursorRef.current ?? { x: 0.5, y: 0.5 };
      cursorRef.current = current;
      setCursorVisible(true);
      if (fieldRef.current) {
        fieldRef.current = wipe(fieldRef.current, strokeFromCursor(current));
      }
      onBrush(0.7);
      finishStroke();
    }
  }

  const capturable = state.u2.surfaced.length >= 3;

  useEffect(() => {
    if (!capturable) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        onCapture();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [capturable, onCapture]);

  return (
    <section className={`${styles.deskScene} ${styles.noiseScene}`} aria-label="کاغذ درهم">
      <div
        className={styles.lampPool}
        style={{ "--lamp-scale": 0.9, "--pressure": 0.32 } as CSSProperties}
        aria-hidden="true"
      />
      <div className={styles.tableTop} aria-hidden="true">
        <span className={styles.tableGrain} />
      </div>

      <div className={styles.noiseStage}>
        <div
          className={`${styles.noisePaperWrap} ${
            flash ? styles.noisePaperFlash : ""
          }`}
        >
          <div className={styles.paper}>
            <span className={styles.paperRule} aria-hidden="true" />
            <span className={styles.paperFold} aria-hidden="true" />
            <canvas
              ref={canvasRef}
              className={`${styles.noiseCanvas} ${
                cursorVisible ? styles.noiseCanvasKeyboard : ""
              }`}
              tabIndex={0}
              aria-label={U2_SCENE.paperLabel}
              aria-describedby="noise-hint"
              aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Space"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <p className={styles.noiseWhisper}>{U2_SCENE.whisper}</p>

        <div className={styles.noiseActs}>
          {blankReady ? (
            <button
              type="button"
              className={styles.denyChoice}
              onClick={onDeny}
              aria-label={U2_SCENE.denyAct}
            >
              <span className={styles.blankMark} aria-hidden="true" />
              <span className={styles.objectLabel}>{U2_SCENE.denyAct}</span>
            </button>
          ) : null}
          {capturable ? (
            <button
              type="button"
              className={styles.notebookChoice}
              onClick={onCapture}
              aria-keyshortcuts="K"
              aria-label={`${U2_SCENE.captureAct} — ${U2_SCENE.notebookAria}`}
            >
              <span className={styles.notebookGlyph} aria-hidden="true" />
              <span className={styles.objectLabel}>{U2_SCENE.captureAct}</span>
            </button>
          ) : null}
        </div>
      </div>

      <p id="noise-hint" className={styles.srOnly}>
        {U2_SCENE.hint}
      </p>
    </section>
  );
}

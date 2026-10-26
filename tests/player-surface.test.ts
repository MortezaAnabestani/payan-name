import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CLAIM_OPTIONS,
  ENDINGS,
  EVIDENCE_OPTIONS,
  FILING_OPTIONS,
  PROLOGUE_LINES,
} from "@/content/u1";
import {
  MOTIF_STATE_LINE,
  U2_BRIDGE,
  U2_RESOLUTION,
  U2_SCENE,
} from "@/content/u2";
import {
  U3_RESOLUTION,
  U3_SCENE,
  WARD_STATIONS_CONTENT,
  claimLineFor,
} from "@/content/u3";

const css = readFileSync(
  new URL("../src/app/game.module.css", import.meta.url),
  "utf8",
);

function ruleFor(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ""
  );
}

const BANNED = [
  "رساله",
  "توسعه",
  "پروژه",
  "موتیف",
  "نشانه‌شناسی",
  "عاملیت",
  "روایت‌زاد",
  "بازهٔ کاراکتری",
  "برش عمودی",
  "واحد ۱",
  "فرم",
  "چک‌باکس",
  "ثبت در پرونده",
];

function surfaceText(): string {
  return [
    ...PROLOGUE_LINES,
    ...CLAIM_OPTIONS.flatMap((option) => [option.label, option.note]),
    ...EVIDENCE_OPTIONS.flatMap((option) => [option.label, option.note]),
    ...FILING_OPTIONS.flatMap((option) => [option.label, option.note]),
    ...Object.values(ENDINGS).flatMap((ending) => [
      ending.kicker,
      ending.title,
      ending.body,
    ]),
    ...Object.values(U2_SCENE),
    ...Object.values(U2_BRIDGE),
    ...Object.values(U2_RESOLUTION).flatMap((resolution) => [
      resolution.kicker,
      resolution.title,
      resolution.body,
    ]),
    ...Object.values(MOTIF_STATE_LINE),
    ...Object.values(U3_SCENE).flatMap((value) =>
      Array.isArray(value) ? value : [value],
    ),
    ...Object.values(U3_RESOLUTION),
    ...Object.values(WARD_STATIONS_CONTENT).flatMap((station) => [
      station.label,
      station.introit,
      station.noteLabel,
      station.noteDay1,
      station.noteDay2,
      station.sameLabel,
      station.sameLine,
    ]),
    claimLineFor(0),
    claimLineFor(4),
  ].join("\n");
}

describe("player-facing surface", () => {
  it("does not expose theory or engineering vocabulary", () => {
    const text = surfaceText();
    for (const word of BANNED) {
      expect(text, `should not contain ${word}`).not.toContain(word);
    }
  });

  it("keeps the source excerpt out of the playable surface", () => {
    const text = surfaceText();
    expect(text).not.toContain("دیروز بود که اطاقم را جدا کردند");
    expect(text).not.toContain("حالا که دقت میکنم");
    expect(text).not.toContain("نسیم آرامی بوی");
    expect(text).not.toContain("مردهان عجیب");
  });

  it("renders decayed letters in normal inline flow to preserve Persian joining", () => {
    const block = ruleFor(".decayChar");
    expect(block).toContain("display: inline;");
    expect(block).not.toContain("inline-block");
    expect(block).toContain("position: relative;");
  });

  it("centers fixed action rows with margins, not an overridden transform", () => {
    for (const selector of [".filingActs", ".lockedActs"]) {
      const block = ruleFor(selector);
      expect(block, selector).not.toContain("translateX(-50%)");
      expect(block, selector).toContain("margin-inline: auto;");
      expect(block, selector).toMatch(/right: 0;/);
      expect(block, selector).toMatch(/left: 0;/);
    }
  });

  it("keeps narrow-screen filing actions in flow so they cannot cover evidence", () => {
    const narrow = css.slice(css.indexOf("@media (max-width: 820px)"));
    expect(narrow).toMatch(/\.filingActs\s*\{[^}]*position:\s*static;/);
    expect(narrow).toMatch(/\.bindingGrid\s*\{[^}]*min-height:\s*0;/);
  });
});

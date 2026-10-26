export type UnitType = "paratext" | "core" | "support" | "catalyst";
export type UnitLevel = 1 | 2 | 3 | 4 | 5;
export type UnitRendererKind = "text" | "canvas" | "audio" | "composite";

export interface UnitSource {
  readonly lines: string;
  readonly sentences: string;
  readonly quote: string;
  readonly charStart: number;
  readonly charEnd: number;
}

export interface UnitDefinition {
  readonly id: string;
  readonly order: number;
  readonly chapterId: string;
  readonly title: string;
  readonly type: UnitType;
  readonly source: UnitSource;
  readonly expectation: string;
  readonly intervention: string;
  readonly dominant: string;
  /** پیرامتن (G1) سطح ندارد؛ مقدار null فقط برای paratext مجاز است. */
  readonly level: UnitLevel | null;
  readonly technique: string;
  readonly motifs: readonly string[];
  readonly relations: readonly string[];
  readonly programmableObject: string;
  readonly freeSpace: readonly string[];
  readonly renderer: { readonly kind: UnitRendererKind; readonly key: string };
}

// ---------------------------------------------------------------------------
// engines/score/meta — chant identity resolution from parsed GABC
// ---------------------------------------------------------------------------
import type { ChantType, Score } from "./types.js";
import type { ModeData } from "../temper/data/modes.js";
import { MODES } from "../temper/modes.js";
import { inferChantType, inferMode } from "./infer.js";

export interface ChantMeta {
  mode: number | null;
  modeAlias: string | null;
  family: string | null;
  type: "authentic" | "plagal" | null;
  final: number | null;
  tenor: number | null;
  molle: boolean;
  hexachord: "durum" | "naturale" | "molle" | null;
  office: ChantType | null;
  incipit: string | null;
}

export interface ChantMetaOptions {
  mode?: number;
  office?: ChantType;
}

export function computeMeta(ir: Score, options: ChantMetaOptions = {}): ChantMeta {
  const modeNum = options.mode ?? inferMode(ir);
  const modeData: ModeData | undefined = modeNum !== undefined ? MODES.get(modeNum) : undefined;
  const office = options.office ?? inferChantType(ir) ?? null;

  return {
    mode: modeData?.mode ?? null,
    modeAlias: modeData?.alias ?? null,
    family: modeData?.maneria ?? null,
    type: modeData?.type ?? null,
    final: modeData?.final ?? null,
    tenor: modeData?.tenor ?? null,
    molle: modeData?.hexachords[0] === "molle",
    hexachord: modeData?.hexachords[0] ?? null,
    office,
    incipit: collectIncipit(ir),
  };
}

function collectIncipit(ir: Score, maxSyllables = 6): string | null {
  const parts: string[] = [];
  outer: for (const phrase of ir.phrases) {
    for (const syl of phrase.syllables) {
      const text = syl.lyric.replace(/-+$/, "").trim();
      if (text) {
        parts.push(text);
        if (parts.length >= maxSyllables) break outer;
      }
    }
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

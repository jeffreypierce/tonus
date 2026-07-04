// ---------------------------------------------------------------------------
// engines/score/emitters/musicxml — MusicXML 4.0 partwise document emitter
// ---------------------------------------------------------------------------
// Consumes a score's tabula rows. Each row already carries the step name
// (spn), accidental, ornament flags, ictus, neume, and lyric, so a MusicXML
// document is rendered directly from the flat surface — no phrase-tree walk.
import type { ChantTabulaRow } from "../tabula.js";
import type { Chant } from "../../chant/types.js";

export interface MusicXmlOpts {
  /** Emit the arsis/thesis shape + index as an other-notation annotation. */
  emitWeights?: boolean;
}

export interface MusicXmlEmitResult {
  xml: string;
  diagnostics: { message: string }[];
}

// ── XML helpers ──

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function elem(tag: string, content: string): string {
  return `<${tag}>${content}</${tag}>`;
}

// ── Pitch / accidental from a tabula row ──

function xmlStep(row: ChantTabulaRow): string {
  // spn is e.g. "D4", "Bb3" — the first character is the step letter.
  return row.spn[0] ?? "C";
}

function xmlAccidentalGlyph(row: ChantTabulaRow): string | null {
  // Only an explicitly-marked accidental prints a glyph.
  if (row.accidentalSource !== "explicit") return null;
  if (row.accidental === -1) return "flat";
  if (row.accidental === 1) return "sharp";
  return "natural";
}

// ── Rendering ──

interface RenderContext {
  emitWeights: boolean;
}

const BARLINE_STYLE: Record<string, string> = {
  ",": "dashed", "`": "dotted", ";": "normal", ":": "light-light", "::": "light-heavy",
};

function computeSyllabic(lyric: string): "single" | "begin" | "middle" | "end" {
  const s = lyric.startsWith("-"), e = lyric.endsWith("-");
  if (!s && !e) return "single";
  if (!s && e) return "begin";
  if (s && e) return "middle";
  return "end";
}

interface NoteFlags {
  /** First note of a multi-note neume figure — opens the slur. */
  slurStart: boolean;
  /** Last note of a multi-note neume figure — closes the slur. */
  slurStop: boolean;
  /** First note of the syllable — carries the lyric and the neume-type label. */
  syllableStart: boolean;
}

function renderNote(row: ChantTabulaRow, flags: NoteFlags, ctx: RenderContext): string {
  const lines: string[] = [`      <note>`];

  lines.push(`        <pitch>`);
  lines.push(`          ${elem("step", xmlStep(row))}`);
  if (row.accidental !== 0) lines.push(`          ${elem("alter", String(row.accidental))}`);
  lines.push(`          ${elem("octave", String(row.octave))}`);
  lines.push(`        </pitch>`);
  lines.push(`        ${elem("duration", "4")}`);
  lines.push(`        ${elem("type", "eighth")}`);

  const glyph = xmlAccidentalGlyph(row);
  if (glyph) lines.push(`        ${elem("accidental", glyph)}`);
  if (row.quilisma) lines.push(`        ${elem("notehead", "diamond")}`);

  const notations: string[] = [];
  // Slurs bind a single neume figure (pes, clivis, torculus …), so a syllable
  // built of several figures shows one arc per figure.
  if (flags.slurStart) notations.push(`          <slur type="start" number="1"/>`);
  if (flags.slurStop) notations.push(`          <slur type="stop" number="1"/>`);
  if (row.ictus) {
    notations.push(`          <articulations>`, `            <accent/>`, `          </articulations>`);
  }
  const technical: string[] = [];
  if (row.quilisma) technical.push(`            <other-technical>quilisma</other-technical>`);
  if (row.liquescent) technical.push(`            <other-technical>liquescent</other-technical>`);
  if (row.strophicus) technical.push(`            <other-technical>strophicus</other-technical>`);
  if (technical.length) {
    notations.push(`          <technical>`, ...technical, `          </technical>`);
  }
  if (flags.syllableStart && row.neume.type !== "punctum") {
    notations.push(`          <other-notation type="start">${xmlEscape(row.neume.type)}</other-notation>`);
  }
  if (ctx.emitWeights) {
    notations.push(`          <other-notation type="start">shape:${row.rhythmicShape} index:${row.rhythmicIndex}</other-notation>`);
  }
  if (notations.length) {
    lines.push(`        <notations>`, ...notations, `        </notations>`);
  }

  if (flags.syllableStart) {
    const syllabic = computeSyllabic(row.lyric);
    const clean = row.lyric.replace(/^-+/, "").replace(/-+$/, "").trim();
    lines.push(`        <lyric number="1">`, `          ${elem("syllabic", syllabic)}`,
      `          ${elem("text", xmlEscape(clean))}`, `        </lyric>`);
  }

  lines.push(`      </note>`);
  return lines.join("\n");
}

function renderMeasure(
  rows: ChantTabulaRow[], measureNumber: number, isFirst: boolean, ctx: RenderContext,
): string {
  const lines: string[] = [`    <measure number="${measureNumber}">`];
  if (isFirst) {
    lines.push(
      `      <attributes>`, `        ${elem("divisions", "8")}`,
      `        <key>`, `          ${elem("fifths", "0")}`, `        </key>`,
      `        <time symbol="cut">`, `          ${elem("beats", "4")}`,
      `          ${elem("beat-type", "4")}`, `        </time>`,
      `        <clef>`, `          ${elem("sign", "G")}`,
      `          ${elem("line", "2")}`, `        </clef>`, `      </attributes>`,
    );
  }

  // Walk the phrase's rows. The lyric attaches at each syllable start; slurs
  // bind each neume figure (a syllable may hold several), so they are grouped
  // by (syllableIndex, neumeGroup) and only drawn when a figure has >1 note.
  const sameFigure = (a: ChantTabulaRow, b: ChantTabulaRow) =>
    a.syllableIndex === b.syllableIndex && a.neumeGroup === b.neumeGroup;

  for (let k = 0; k < rows.length; k++) {
    const row = rows[k];
    const prev = rows[k - 1];
    const next = rows[k + 1];

    const figureStart = !prev || !sameFigure(prev, row);
    const figureEnd = !next || !sameFigure(next, row);
    const figureIsMulti = !(figureStart && figureEnd); // >1 note in this figure
    const syllableStart = !prev || prev.syllableIndex !== row.syllableIndex;

    lines.push(renderNote(row, {
      slurStart: figureIsMulti && figureStart,
      slurStop: figureIsMulti && figureEnd,
      syllableStart,
    }, ctx));
  }

  const divisio = rows[rows.length - 1]?.divisio ?? "::";
  const style = BARLINE_STYLE[divisio] ?? "normal";
  lines.push(`      <barline location="right">`, `        <bar-style>${style}</bar-style>`, `      </barline>`);
  lines.push(`    </measure>`);
  return lines.join("\n");
}

function renderScore(
  rows: ChantTabulaRow[], chant: Chant, ctx: RenderContext,
): string {
  const parts: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN"`,
    `  "http://www.musicxml.org/dtds/partwise.dtd">`,
    `<score-partwise version="4.0">`,
  ];

  if (chant.incipit) {
    parts.push(`  <work>`, `    ${elem("work-title", xmlEscape(chant.incipit))}`, `  </work>`);
  }

  parts.push(`  <identification>`);
  parts.push(`    <encoding>`);
  parts.push(`      ${elem("software", "tonus")}`, `    </encoding>`, `  </identification>`);

  for (const text of [
    chant.mode ? `Mode ${chant.mode}` : null,
    chant.office,
  ]) {
    if (text) parts.push(`  <credit page="1">`, `    ${elem("credit-words", xmlEscape(text))}`, `  </credit>`);
  }

  // Group rows into measures by phrase index.
  const measures: string[] = [];
  let i = 0;
  let measureNumber = 1;
  while (i < rows.length) {
    const phraseIndex = rows[i].phraseIndex;
    let j = i;
    while (j < rows.length && rows[j].phraseIndex === phraseIndex) j++;
    measures.push(renderMeasure(rows.slice(i, j), measureNumber, measureNumber === 1, ctx));
    measureNumber++;
    i = j;
  }

  parts.push(
    `  <part-list>`, `    <score-part id="P1">`, `      ${elem("part-name", "Chant")}`,
    `    </score-part>`, `  </part-list>`, `  <part id="P1">`,
    ...measures,
    `  </part>`, `</score-partwise>`,
  );

  return parts.join("\n");
}

/**
 * Emit a MusicXML 4.0 partwise document from a score's tabula rows plus the
 * source chant (for titling). Returns `{ xml, diagnostics }`.
 */
export function toMusicXML(
  rows: ChantTabulaRow[], chant: Chant, options: MusicXmlOpts = {},
): MusicXmlEmitResult {
  const diagnostics: { message: string }[] = [];
  const ctx: RenderContext = { emitWeights: options.emitWeights ?? false };
  const xml = rows.length
    ? renderScore(rows, chant, ctx)
    : renderScore([], chant, ctx);
  return { xml, diagnostics };
}

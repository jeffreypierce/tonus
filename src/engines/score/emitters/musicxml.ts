// ---------------------------------------------------------------------------
// engines/score/emitters/musicxml — MusicXML document emitter
// ---------------------------------------------------------------------------
import type { Score, Note, Neume, Phrase } from "../types.js";
import type { ModeData } from "../../temper/data/modes.js";
import { MODES } from "../../temper/modes.js";
import { inferMode } from "../infer.js";
export interface MusicXmlEmitOptions {
  mode?: number;
  emitWeights?: boolean;
}

export interface MusicXmlEmitResult {
  xml: string;
  diagnostics: { message: string }[];
}

export function toMusicXML(ir: Score, options: MusicXmlEmitOptions = {}): MusicXmlEmitResult {
  const diagnostics: { message: string }[] = [];
  const xml = renderScore(ir, { ...options, diagnostics });
  return { xml, diagnostics };
}

// ── XML helpers ──

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function elem(tag: string, content: string): string {
  return `<${tag}>${content}</${tag}>`;
}

// ── Pitch from Note ──

function xmlStep(note: Note): string {
  // spn is e.g. "D4", "Bb3" — first char is the step letter
  return note.pitch.spn[0];
}

function xmlAccidentalGlyph(note: Note): string | null {
  if (note.context.accidentalSource !== "explicit") return null;
  if (note.pitch.acc === -1) return "flat";
  if (note.pitch.acc === 1) return "sharp";
  return "natural";
}

// ── Rendering ──

interface RenderContext {
  modeData: ModeData | undefined;
  diagnostics: { message: string }[];
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

function renderNote(
  note: Note, lyric: string, isFirst: boolean, isLast: boolean,
  isMultiNote: boolean, neume: Neume, ctx: RenderContext,
): string {
  const lines: string[] = [`      <note>`];

  lines.push(`        <pitch>`);
  lines.push(`          ${elem("step", xmlStep(note))}`);
  if (note.pitch.acc !== 0) lines.push(`          ${elem("alter", String(note.pitch.acc))}`);
  lines.push(`          ${elem("octave", String(note.pitch.oct))}`);
  lines.push(`        </pitch>`);
  lines.push(`        ${elem("duration", "4")}`);
  lines.push(`        ${elem("type", "eighth")}`);

  const glyph = xmlAccidentalGlyph(note);
  if (glyph) lines.push(`        ${elem("accidental", glyph)}`);
  if (note.context.quilisma) lines.push(`        ${elem("notehead", "diamond")}`);

  const notations: string[] = [];
  if (isMultiNote && isFirst) notations.push(`          <slur type="start" number="1"/>`);
  if (isMultiNote && isLast) notations.push(`          <slur type="stop" number="1"/>`);
  if (note.context.ictus) {
    notations.push(`          <articulations>`, `            <accent/>`, `          </articulations>`);
  }
  const technical: string[] = [];
  if (note.context.quilisma) technical.push(`            <other-technical>quilisma</other-technical>`);
  if (note.context.liquescent) technical.push(`            <other-technical>liquescent</other-technical>`);
  if (note.context.strophicus) technical.push(`            <other-technical>strophicus</other-technical>`);
  if (technical.length) {
    notations.push(`          <technical>`, ...technical, `          </technical>`);
  }
  if (isFirst && neume.type !== "punctum") {
    notations.push(`          <other-notation type="start">${xmlEscape(neume.type)}</other-notation>`);
  }
  if (ctx.emitWeights) {
    notations.push(`          <other-notation type="start">arsis:${note.performance.arsis} thesis:${note.performance.thesis}</other-notation>`);
  }
  if (notations.length) {
    lines.push(`        <notations>`, ...notations, `        </notations>`);
  }

  if (isFirst) {
    const syllabic = computeSyllabic(lyric);
    const clean = lyric.replace(/^-+/, "").replace(/-+$/, "").trim();
    lines.push(`        <lyric number="1">`, `          ${elem("syllabic", syllabic)}`,
      `          ${elem("text", xmlEscape(clean))}`, `        </lyric>`);
  }

  lines.push(`      </note>`);
  return lines.join("\n");
}

function renderMeasure(phrase: Phrase, index: number, isFirst: boolean, ctx: RenderContext): string {
  const lines: string[] = [`    <measure number="${index + 1}">`];
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
  for (const syl of phrase.syllables) {
    for (let i = 0; i < syl.notes.length; i++) {
      lines.push(renderNote(syl.notes[i], syl.lyric, i === 0, i === syl.notes.length - 1,
        syl.notes.length > 1, syl.neume, ctx));
    }
  }
  const divisio = phrase.divisio?.divisio ?? "::";
  const style = BARLINE_STYLE[divisio] ?? "normal";
  lines.push(`      <barline location="right">`, `        <bar-style>${style}</bar-style>`, `      </barline>`);
  lines.push(`    </measure>`);
  return lines.join("\n");
}

function renderScore(ir: Score, options: MusicXmlEmitOptions & { diagnostics: { message: string }[] }): string {
  const modeNum = options.mode ?? inferMode(ir);
  const modeData = modeNum !== undefined ? MODES.get(modeNum) : undefined;
  const ctx: RenderContext = { modeData, diagnostics: options.diagnostics, emitWeights: options.emitWeights ?? false };

  const c = ir.chant;
  const parts: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN"`,
    `  "http://www.musicxml.org/dtds/partwise.dtd">`,
    `<score-partwise version="4.0">`,
  ];

  if (c.incipit) {
    parts.push(`  <work>`, `    ${elem("work-title", xmlEscape(c.incipit))}`, `  </work>`);
  }

  parts.push(`  <identification>`);
  parts.push(`    <encoding>`);
  parts.push(`      ${elem("software", "tonus")}`, `    </encoding>`, `  </identification>`);

  for (const text of [
    modeData ? `Mode ${modeData.mode} (${modeData.alias})` : null,
    c.office,
  ]) {
    if (text) parts.push(`  <credit page="1">`, `    ${elem("credit-words", xmlEscape(text))}`, `  </credit>`);
  }

  parts.push(
    `  <part-list>`, `    <score-part id="P1">`, `      ${elem("part-name", "Chant")}`,
    `    </score-part>`, `  </part-list>`, `  <part id="P1">`,
    ...ir.phrases.map((phrase, i) => renderMeasure(phrase, i, i === 0, ctx)),
    `  </part>`, `</score-partwise>`,
  );

  return parts.join("\n");
}

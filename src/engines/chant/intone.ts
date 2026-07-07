// ---------------------------------------------------------------------------
// engines/chant/intone — GABC generation for psalm verses sung to psalm tones
// ---------------------------------------------------------------------------
// Psalmody structure follows the Liber Usualis rules [biblio: liber-usualis]:
// each verse is intonation → tenor (reciting note) → mediation → final cadence,
// with the flex a subdivision of a long first half. The intonation is sung on
// the first verse only (unless repeated, as in the Magnificat) — see the
// `intonation` option; `inDirectum` recites straight through with no mediant.
import { syllabifyPhrase } from "./syllabify.js";
import { getTone, getDifferentia } from "../../data/tones.js";
import { midiToGabc } from "../temper/gabc.js";
import type { PsalmVerse } from "./types.js";

const DEFAULT_CLEF = "c4";
const CLEF = `(${DEFAULT_CLEF}) `;

function midiListToLetters(midis: number[], clef: string): string[] {
  return midis.map((m) => midiToGabc(m, clef));
}

function buildHalf(
  syllables: string[],
  tenor: string,
  cadenceNotes: string[],
  prefixNotes?: string[],
): string {
  if (syllables.length === 0) return "";

  const nonSpace = syllables.filter((s) => s !== " ");
  let noteAssignment: string[];

  if (prefixNotes && prefixNotes.length > 0) {
    noteAssignment = [];
    const total = nonSpace.length;
    const pfxLen = Math.min(prefixNotes.length, total);
    const cadLen = Math.min(cadenceNotes.length, total - pfxLen);
    const midLen = total - pfxLen - cadLen;
    for (let i = 0; i < pfxLen; i++) noteAssignment.push(prefixNotes[i]);
    for (let i = 0; i < midLen; i++) noteAssignment.push(tenor);
    for (let i = 0; i < cadLen; i++) noteAssignment.push(cadenceNotes[i]);
  } else {
    noteAssignment = [];
    const total = nonSpace.length;
    const cadLen = Math.min(cadenceNotes.length, total);
    const midLen = total - cadLen;
    for (let i = 0; i < midLen; i++) noteAssignment.push(tenor);
    for (let i = 0; i < cadLen; i++) noteAssignment.push(cadenceNotes[i]);
  }

  let noteIdx = 0;
  const tokens: string[] = [];
  for (const syl of syllables) {
    if (syl === " ") {
      tokens.push(" ");
    } else {
      const note = noteAssignment[noteIdx++] ?? tenor;
      tokens.push(`(${note})${syl}`);
    }
  }

  return tokens.join("");
}

export interface IntoneOpts {
  mode?: number;
  differentia?: string;
  intonation?: boolean;
  /** Sing in directum: recite straight through to the termination, no mediant. */
  inDirectum?: boolean;
  /** Use the tone's ornamented mediant for solemn occasions, where it has one. */
  solemn?: boolean;
}

export function intone(text: string | PsalmVerse, opts: IntoneOpts = {}): string {
  let rawText: string;
  if (typeof text === "object") {
    rawText = `${text.half1} * ${text.half2}`;
  } else {
    rawText = text;
  }

  const clef = DEFAULT_CLEF;
  const mode = opts.mode ?? 8;
  const tone = getTone(mode);
  const diff = getDifferentia(tone, opts.differentia);

  const tenorLetter = midiToGabc(tone.tenor, clef);
  const mediant = opts.solemn && tone.solemnMediant ? tone.solemnMediant : tone.mediant;
  const mediantLetters = midiListToLetters(mediant, clef);
  const terminationLetters = midiListToLetters(diff.termination, clef);
  const intonationLetters = midiListToLetters(tone.intonation, clef);

  // In directum ignores the verse's mediant split: the whole verse recites to
  // the termination as one phrase (a psalm sung with no antiphon framing).
  const starIdx = opts.inDirectum ? -1 : rawText.indexOf(" * ");

  if (starIdx === -1) {
    const text = opts.inDirectum ? rawText.replace(" * ", " ") : rawText;
    const syllables = syllabifyPhrase(text.trim());
    const body = buildHalf(syllables, tenorLetter, terminationLetters);
    return CLEF + body + "(::)";
  }

  const half1Text = rawText.slice(0, starIdx).trim();
  const half2Text = rawText.slice(starIdx + 3).trim();

  const half1Sylls = syllabifyPhrase(half1Text);
  const half2Sylls = syllabifyPhrase(half2Text);

  const useIntonation = opts.intonation !== false;

  const h1 = buildHalf(
    half1Sylls,
    tenorLetter,
    mediantLetters,
    useIntonation ? intonationLetters : undefined,
  );
  const h2 = buildHalf(half2Sylls, tenorLetter, terminationLetters);

  return `${CLEF}${h1}(:) ${h2}(::)`;
}

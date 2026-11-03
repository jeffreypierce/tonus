// ---------------------------------------------------------------------------
// engines/chant/intone — GABC generation for psalm verses sung to psalm tones
// ---------------------------------------------------------------------------
// Psalmody structure follows the Liber Usualis rules [biblio: liber-usualis]:
// each verse is intonation → tenor (reciting note) → mediation → final cadence,
// with the flex a subdivision of a long first half. The intonation is sung on
// the first verse only (unless repeated, as in the Magnificat) — the caller
// says which verse that is through the `intonation` option (psalm.ts decides);
// `inDirectum` recites straight through with no mediant.
//
// THE POINTING IS BY SYLLABLE COUNT, NOT BY ACCENT. Each cadence takes as many
// syllables from the end of its half-verse as the tone has notes, one note to a
// syllable. The books point the cadences to the word accents instead — a
// mediant of one accent waits for the last accented syllable, adding a note of
// preparation before a dactyl — and the tone table carries no accent shape
// (PsalmTone holds a flat note list per cadence), so that pointing cannot be
// derived here. Where the final words are spondees the two agree; before a
// proparoxytone they do not. Accent-aware pointing is open design work.
//
// The texts carry the breviary's marks, which are directions, not syllables:
// † (and DO's ‡, where two numbered verses were joined) is the FLEX, + the sign
// of the cross at the Benedictus, Magnificat and Nunc dimittis, and an inline
// "(2)" the number of the verse a joined verse absorbed. All are stripped
// before syllabification; the flex is sung (tone.flex), the others are not.
import { syllabifyPhrase } from "./syllabify.js";
import { getTone, getDifferentia } from "../temper/data/tones.js";
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
      // TEXT FIRST, then its notes — `syl(note)`, which is what GABC means and
      // what every corpus chant encodes. Emitted the other way round, each
      // whitespace-separated word opened with an empty-text syllable that took
      // syllableIndex 0, so the word's real first syllable never scored
      // wordStart and the renderer hyphenated between every pair: a whole verse
      // set as a single word. The word-aware metrics read the same lie.
      tokens.push(`${syl}(${note})`);
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

// The flex marks, and the marks that are not sung at all.
const FLEX_MARK = /\s*[†‡]\s*/;
function unsungMarksOut(text: string): string {
  return text
    .replace(/\(\d+[a-z]?\)/g, " ")   // an absorbed verse's number, "(2)"
    .replace(/(^|\s)\+(?=\s|$)/g, " ") // the sign of the cross
    .replace(/\s+/g, " ")
    .trim();
}

export function intone(text: string | PsalmVerse, opts: IntoneOpts = {}): string {
  let rawText: string;
  if (typeof text === "object") {
    rawText = `${text.half1} * ${text.half2}`;
  } else {
    rawText = text;
  }
  rawText = unsungMarksOut(rawText);

  const clef = DEFAULT_CLEF;
  const mode = opts.mode ?? 8;
  const tone = getTone(mode);
  const diff = getDifferentia(tone, opts.differentia);

  // An ending with its own tone body (4A, 4A*) sings over that body; every
  // other ending takes the tone's. The peregrinus recites its second half on
  // its second tenor.
  const tenor = diff.tenor ?? tone.tenor;
  const tenorLetter = midiToGabc(tenor, clef);
  const secondTenorLetter = midiToGabc(tone.secondTenor ?? tenor, clef);
  const plainMediant = diff.mediant ?? tone.mediant;
  const mediant = opts.solemn && tone.solemnMediant ? tone.solemnMediant : plainMediant;
  const mediantLetters = midiListToLetters(mediant, clef);
  const terminationLetters = midiListToLetters(diff.termination, clef);
  const intonationLetters = midiListToLetters(diff.intonation ?? tone.intonation, clef);
  const flexLetters = midiListToLetters(diff.flex ?? tone.flex, clef);
  const useIntonation = opts.intonation !== false;

  // A half-verse, its flex members first. Each member before a flex mark
  // recites and drops on the flex (the tone's flex notes on its last
  // syllables, counted like every cadence here); the last member carries the
  // half's own cadence. The intonation opens the first member only.
  const sing = (half: string, cadence: string[], intoned: boolean, recto = tenorLetter): string => {
    const members = half.split(FLEX_MARK).filter((m) => m.trim());
    return members.map((m, i) => {
      const last = i === members.length - 1;
      const sylls = syllabifyPhrase(m.trim());
      const prefix = intoned && i === 0 ? intonationLetters : undefined;
      return buildHalf(sylls, recto, last ? cadence : flexLetters, prefix);
    }).join("(,) ");
  };

  // In directum ignores the verse's mediant split and its flex: the whole
  // verse recites to the termination as one phrase (a psalm sung with no
  // antiphon framing).
  if (opts.inDirectum) {
    const flat = rawText.replace(" * ", " ").replace(new RegExp(FLEX_MARK.source, "g"), " ");
    return CLEF + buildHalf(syllabifyPhrase(flat.trim()), tenorLetter, terminationLetters) + "(::)";
  }

  const starIdx = rawText.indexOf(" * ");
  if (starIdx === -1) {
    return CLEF + sing(rawText, terminationLetters, false) + "(::)";
  }

  const h1 = sing(rawText.slice(0, starIdx).trim(), mediantLetters, useIntonation);
  const h2 = sing(rawText.slice(starIdx + 3).trim(), terminationLetters, false, secondTenorLetter);

  return `${CLEF}${h1}(:) ${h2}(::)`;
}

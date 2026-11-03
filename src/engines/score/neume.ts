// ---------------------------------------------------------------------------
// engines/score/neume — neume classification from parsed notes
// ---------------------------------------------------------------------------
import type { Neume, NeumeShape, Note } from "./types.js";
import { classifyShape, type Direction } from "../temper/neume.js";

const LIQUESCENT_FORM: Partial<Record<NeumeShape, NeumeShape>> = {
  pes: "epiphonus",
  clivis: "cephalicus",
  climacus: "ancus",
};

function toDirection(delta: number): Direction {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "unison";
}

export function classifyNeume(notes: Note[]): Neume {
  const hasQuilisma = notes.some((n) => n.context.quilisma);
  const hasLiquescent = notes.some((n) => n.context.liquescent);
  const hasStrophicus = notes.some((n) => n.context.strophicus);

  const intervals: number[] = [];
  for (let i = 1; i < notes.length; i++) {
    intervals.push(notes[i].pitch.midi - notes[i - 1].pitch.midi);
  }

  const dirs = intervals.map(toDirection);
  let type = classifyShape(dirs);
  // Salicus: "a neume with at least three ascending notes in which the
  // next-to-last is an oriscus" [biblio: cardine-semiology, ch. 16]. The
  // ORISCUS is what makes it one — not the editorial ictus.
  //
  // RULED 2026-08-04 (Jeffrey): adopt Cardine's definition for DETECTION, not
  // only for the prolongation. This is a second doctrine call beyond the
  // original ruling and was ratified on its own terms, because it decides what
  // the word `salicus` denotes everywhere in tonus — the neume type, the
  // always-arsic override, the chironomia track, any caller reading
  // `neume.type`.
  //
  // This detection was previously keyed on the Solesmes ictus (GABC `'`) on
  // the second-to-last note, which is a different thing and a much larger set.
  // Measured over the shelf (the seven books, 7,709 chants, 2026-11-03), 616
  // syllables read as salici against 5,418 as scandici, so the ictus rule
  // claimed a set several times the real one. An ictus-marked ascent with no
  // oriscus IS a scandicus that Solesmes marked for rhythm; the mark survives
  // on `context.ictus` for anyone reading it. Bevenot calls the conflation "a
  // trap" [biblio: cardine-semiology].
  //
  // (The figures here have been re-measured three times as the parser was
  // corrected: the phantom accidental notes, then the `!` cut read as a figure
  // boundary and the oriscus scapus `O` read as no oriscus. The shape of the
  // finding has survived each; the figures have not, and are dated.)
  //
  // The LIMIT of this, stated because it is easy to mistake for a bug: tonus
  // sees only what the transcription marks. Bevenot's own example — the mode-6
  // Requiem introit's fa-sol-la — carries the Solesmes ictus and NO oriscus in
  // GregoBase (gregobase:766, on "ae" and "do"), so it reads here as a
  // scandicus. He is reading the manuscripts; we are reading a printed edition
  // that resolved the oriscus away. Recovering those needs the MSS, not a rule
  // change: a guess dressed as a measurement is worse than the gap.
  const allAscending = dirs.length >= 2 && dirs.every((d) => d === "up");
  if (allAscending && notes[notes.length - 2]!.context.oriscus) {
    type = "salicus";
  }

  // The liquescent figures take their name from the last note's half-note:
  // "the Epiphonus becomes a Podatus, the Cephalicus a Clivis" when the
  // syllable is sung in full, and the ancus is the climacus whose lower notes
  // "may be liquescent, at any rate the last of them" [biblio: liber-usualis,
  // preface]. Only the deminutive (`~`) counts. The augmented `<`/`>` is
  // gregorio's auctus, which the Liber's table does not name, so a pes or clivis
  // carrying it keeps its name (ruled 2026-10-22). A one-note `>` is the
  // Antiphonale Monasticum's punctum liquescens, a simple note, and stays a
  // punctum.
  //
  // Only the last note counts. The Liber's half-note "is found only at the end
  // of a syllable", and the corpus agrees: all 4,521 such figures end their
  // syllable. The salicus cannot clash, because it ends rising.
  if (notes[notes.length - 1]?.context.liquescence === "deminutive") {
    type = LIQUESCENT_FORM[type] ?? type;
  }
  return { type, intervals, hasQuilisma, hasLiquescent, hasStrophicus };
}

/**
 * The syllable's figures, each classified in its own right.
 *
 * GABC marks figure boundaries (`/`, `//`, `/0`, `/[n]`; the cut `!` and the
 * fusion `@` part none) and the parser records them as
 * `context.neumeGroup`, but classification read the whole syllable, so a
 * three-figure melisma was named once and the name was almost always
 * "compound" — two of every three compounds the corpus reported. A syllable is
 * not a neume; it carries neumes.
 *
 * THE SALICUS IS CLASSIFIED AT SYLLABLE SCOPE, DELIBERATELY, and the exception
 * is the point rather than an oversight. Its rule reads the oriscus on the
 * next-to-last note of an ascent (see `classifyNeume` above), and a salicus
 * may be written across a spacing separator — the oriscus in one figure, the
 * summit in the next (8 of the shelf's 616, 2026-11-03; the `!` cut, which
 * once made most of them, parts no figure). Splitting first would sever them,
 * narrowing Cardine's definition by refactoring rather than by ruling. The
 * ascent is the neume; where the scribe broke the figure is a separate fact.
 */
export function classifyFigures(notes: Note[]): Neume[] {
  if (notes.length === 0) return [];

  const whole = classifyNeume(notes);
  if (whole.type === "salicus") return [whole];

  const figures: Note[][] = [];
  let group = -1;
  for (const note of notes) {
    if (note.context.neumeGroup !== group) {
      figures.push([]);
      group = note.context.neumeGroup;
    }
    figures[figures.length - 1]!.push(note);
  }
  return figures.map(classifyNeume);
}

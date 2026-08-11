// ---------------------------------------------------------------------------
// engines/score/neume — neume classification from parsed notes
// ---------------------------------------------------------------------------
import type { Neume, Note } from "./types.js";
import { classifyShape, type Direction } from "../temper/neume.js";

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
  // Measured over the sung corpus today: 302 salici against 2,960 scandici, so
  // the old rule claimed roughly 3,262 groups where 302 are real — and of that
  // wider set only 9.4% carry an oriscus at all. An ictus-marked ascent with no
  // oriscus IS a scandicus that Solesmes marked for rhythm; the mark survives
  // on `context.ictus` for anyone reading it. Bevenot calls the conflation "a
  // trap" [biblio: cardine-semiology].
  //
  // (This paragraph read 2,795 / 36 / 226 until 2026-08-11. Those came from
  // working/qa-sweep/salicus-before.json, a run over 2,887 chants and 28,498
  // phrases — a corpus that predates the accidental fix in `parse.ts`, which
  // was emitting a phantom note at every accidental and inflating every count
  // downstream. The shape of the finding survived re-measurement; the figures
  // did not.)
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
  return { type, intervals, hasQuilisma, hasLiquescent, hasStrophicus };
}

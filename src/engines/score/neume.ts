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

  let type = classifyShape(intervals.map(toDirection));
  // Salicus: three ascending notes with ictus on the middle note (distinguishes
  // from scandicus, which has no middle ictus). GABC marks it with `'` on the
  // middle note.
  if (type === "scandicus" && notes.length === 3 && notes[1]!.context.ictus) {
    type = "salicus";
  }
  return { type, intervals, hasQuilisma, hasLiquescent, hasStrophicus };
}

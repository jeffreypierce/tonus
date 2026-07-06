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
  // Salicus: an ascending run whose ictus (GABC `'`) marks it apart from a plain
  // scandicus. The ictus sits on the second-to-last ascending note — the middle
  // note of a three-note salicus, the penultimate of a longer one (Suñol).
  const allAscending = dirs.length >= 2 && dirs.every((d) => d === "up");
  if (allAscending && notes[notes.length - 2]!.context.ictus) {
    type = "salicus";
  }
  return { type, intervals, hasQuilisma, hasLiquescent, hasStrophicus };
}

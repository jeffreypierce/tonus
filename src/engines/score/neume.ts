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

  const type = classifyShape(intervals.map(toDirection));
  return { type, intervals, hasQuilisma, hasLiquescent, hasStrophicus };
}

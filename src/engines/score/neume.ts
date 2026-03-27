// ---------------------------------------------------------------------------
// engines/score/neume — neume shape classification from interval patterns
// ---------------------------------------------------------------------------
import type { Neume, NeumeShape } from "./types.js";

interface HasPitch { midi: number }
interface HasOrnaments { quilisma?: boolean; liquescent?: boolean; strophicus?: boolean }

function pitch(n: HasPitch): number {
  return n.midi;
}

export function classifyNeume(notes: (HasPitch & HasOrnaments)[]): Neume {
  const hasQuilisma = notes.some((n) => n.quilisma);
  const hasLiquescent = notes.some((n) => n.liquescent);
  const hasStrophicus = notes.some((n) => n.strophicus);

  if (notes.length === 0) {
    return { type: "punctum", intervals: [], hasQuilisma, hasLiquescent, hasStrophicus };
  }

  const intervals: number[] = [];
  for (let i = 1; i < notes.length; i++) {
    intervals.push(pitch(notes[i]) - pitch(notes[i - 1]));
  }

  const type = classifyByIntervals(intervals);
  return { type, intervals, hasQuilisma, hasLiquescent, hasStrophicus };
}

type Dir = "U" | "D" | "S";

function toDir(interval: number): Dir {
  if (interval > 0) return "U";
  if (interval < 0) return "D";
  return "S";
}

function classifyByIntervals(intervals: number[]): NeumeShape {
  const n = intervals.length;
  if (n === 0) return "punctum";

  const dirs = intervals.map(toDir);

  if (n === 1) {
    if (dirs[0] === "U" || dirs[0] === "S") return "pes";
    return "clivis";
  }

  if (n === 2) {
    const [d0, d1] = dirs;
    if (d0 === "U" && d1 === "D") return "torculus";
    if (d0 === "D" && d1 === "U") return "porrectus";
    if (d0 === "U" && (d1 === "U" || d1 === "S")) return "scandicus";
    if (d0 === "D" && (d1 === "D" || d1 === "S")) return "climacus";
    if (d0 === "S") return dirs[1] === "U" ? "pes" : "clivis";
    return "compound";
  }

  if (n === 3) {
    const [d0, d1, d2] = dirs;
    if (d0 === "U" && d1 === "D" && d2 === "U") return "torculus resupinus";
    if (d0 === "D" && d1 === "U" && d2 === "D") return "porrectus flexus";
    if (d0 === "U" && d1 === "U" && d2 === "D") return "scandicus flexus";
    if (d0 === "D" && d1 === "D" && d2 === "U") return "climacus resupinus";
    if (d0 === "U" && d1 === "D" && d2 === "D") return "pes subpunctis";
    return "compound";
  }

  if (n >= 4) {
    if (dirs[0] === "U" && dirs.slice(1).every((d) => d === "D")) return "pes subpunctis";
    return "compound";
  }

  return "compound";
}

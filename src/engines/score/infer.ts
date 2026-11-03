// ---------------------------------------------------------------------------
// engines/score/infer — mode inference from parsed GABC
// ---------------------------------------------------------------------------
// A chant whose header names no mode is read for one: its closing note picks
// the maneria, its compass about that note the authentic or plagal mode.
import type { ScoreIR } from "./types.js";
import { MODES } from "../temper/modes.js";

// The compass of each mode about its final, in semitones below and above:
// authentic, a tone below to the octave; plagal, a fourth below to a fifth.
const AUTHENTIC_FRAME = [2, 12] as const;
const PLAGAL_FRAME = [5, 7] as const;

export function inferMode(ir: ScoreIR): number | undefined {
  const headerMode = parseInt(ir.chant.mode ?? "", 10);
  if (headerMode >= 1 && headerMode <= 8) return headerMode;

  const midis: number[] = [];
  for (const phrase of ir.phrases) {
    for (const syl of phrase.syllables) {
      for (const note of syl.notes) midis.push(note.pitch.midi);
    }
  }
  if (midis.length === 0) return undefined;

  // The finalis is the last note of the chant — the fundamental assumption of
  // modal analysis: a chant comes to rest on its mode's final [biblio:
  // liber-usualis]. That pitch class picks the maneria (mode pair).
  const finalisPc = ((midis[midis.length - 1] % 12) + 12) % 12;

  const candidates: number[] = [];
  for (const [num, data] of MODES) {
    if (data.final === finalisPc) candidates.push(num);
  }
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  // Within a maneria the two modes differ by their compass about the final:
  // the authentic runs from the final (or the tone below it) up to the octave,
  // the plagal from about a fourth below the final to a fifth above it
  // [biblio: sunol-textbook]. The melody's own lowest and highest notes are
  // set against each frame, and the nearer frame names the mode; a tie reads
  // authentic. The frames are the treatise's, in semitones; nothing here is
  // tuned to a corpus. The mean pitch, which this read once, sits below the
  // final in almost no plagal chant, and so named nearly every one authentic.
  const finalisStep = midis[midis.length - 1]!;
  const below = finalisStep - Math.min(...midis);
  const above = Math.max(...midis) - finalisStep;
  const off = (frame: readonly [number, number]) =>
    Math.abs(below - frame[0]) + Math.abs(above - frame[1]);

  const authentic = candidates.filter((n) => MODES.get(n)?.type === "authentic");
  const plagal = candidates.filter((n) => MODES.get(n)?.type === "plagal");

  if (plagal.length > 0 && (authentic.length === 0 || off(PLAGAL_FRAME) < off(AUTHENTIC_FRAME)))
    return plagal[0];
  return (authentic[0] ?? plagal[0])!;
}

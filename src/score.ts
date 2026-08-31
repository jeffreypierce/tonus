// ---------------------------------------------------------------------------
// tonus/score — what a Score is made of
// ---------------------------------------------------------------------------
// `notatio` stays on the root namespace and still returns a Score, so the
// common case — parse a chant, read its phrases — needs nothing from here. This
// entry holds the STRUCTURE: the note, the syllable, the phrase, the rhythmic
// vocabulary, the cadence and modulation records, and the measurement sub-
// objects a Metrics is built from.
//
// They came off the root index because they are not answers, they are the
// grain of one answer. Ten of the ninety-seven names it carried were reachable
// only by holding a Score already, which meant a reader scanning the index for
// what tonus DOES had to step over the anatomy of one return value to find the
// next verb. That is the density, and this is where it goes.
//
// Nothing is hidden by the move: every name below is exported here, and the
// types a verb hands back — Score, Cadence, Modulation, Metrics — stay on the
// root as well, because the root's own signatures name them.

export type {
  Score,
  ScoreOpts,
  PondusInput,
  PondusOpts,
  AccentusInput,
  AccentusOpts,
  Cadence,
  CadenceTarget,
  CadenceApproach,
  Modulation,
} from "./engines/score/api.js";

// The grain of a Score — the note and its neighbours.
export type {
  Note,
  Performance,
  Phrase,
  Syllable,
  LyricRun,
  RestEvent,
  ParseError,
  ArsisThesis,
  RhythmicType,
  CompoundBeat,
} from "./engines/score/types.js";

// The flat projection every emitter and analysis pass walks.
export type { ChantTabulaRow } from "./engines/score/tabula.js";

// What a Metrics is built from.
export type {
  Metrics,
  RhythmicProfile,
  NoteRange,
  CadenceDistribution,
} from "./engines/score/metrics.js";

// What an Imprint is built from. The Imprint itself stays on the root — it
// rides every Score and every Harmony, and is the one summary computed the same
// way from a chant and from a sky.
export type {
  Imprint,
  Attractor,
  VowelAttractor,
  ModalAffinity,
} from "./engines/imprint.js";

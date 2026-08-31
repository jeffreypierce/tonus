// ---------------------------------------------------------------------------
// tonus/inscriptio — the drawing entry point
// ---------------------------------------------------------------------------
// The rendering boundary, made addressable: `score` analyzes, `inscriptio`
// draws. Everything reachable from here consumes a Score and produces SVG plus
// the geometry contract; nothing here is read by an analysis pass.
//
// The root namespace still carries `inscriptio` — the export law puts verbs on
// the namespace, and this module does not repeal it. What the entry adds is a
// place to hold the drawing surface ON ITS OWN, so a caller who only wants a
// picture imports one name and reads one type list rather than the library's
// ninety-seven.
//
// It also surfaces four types the root index never exported: Theme and
// ThemeColors (which an `opts.theme` caller had to spell out by hand) and
// TrackName / TrackData (the same for `opts.tracks`). Reachable through the
// signature, nameable nowhere — which is the drift this entry exists to stop.
//
// ChantTabulaRow and Score ride along because they are the OTHER HALF of the
// geometry contract: geometry[i] and tabula[i] are the same note, and a caller
// holding one without the other cannot use either.

export { inscriptio } from "./engines/score/inscriptio.js";

export type {
  InscriptioOpts,
  Inscriptio,
  NoteGeometry,
  FontSpec,
  FontSlot,
  FontEmbed,
  Theme,
  ThemeColors,
  TrackName,
  TrackData,
} from "./engines/score/inscriptio.js";

export type { ChantTabulaRow } from "./engines/score/tabula.js";
export type { Score } from "./engines/score/api.js";

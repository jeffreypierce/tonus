// ---------------------------------------------------------------------------
// engines/score/phrasing — performance-shaping profiles
// ---------------------------------------------------------------------------

import type { Note, PhrasingProfile, PhrasingType } from "./types.js";

export type { PhrasingProfile } from "./types.js";

export interface ShapedNote extends Note {
  shapedDuration: number;
}

export interface BuildPhrasingOptions {
  overrides?: Partial<PhrasingProfile>;
}

export const PHRASING_PROFILES: Record<PhrasingType, PhrasingProfile> = {
  recitative: {
    curve: 0.1,
    accent: 0.5,
    cadence: 0.1,
    ritard: 0.25,
    ritardNotes: 2,
    ritardCurve: 1.6,
    finisBoost: 1.5,
    baseVelocity: 0.65,
    contourVel: 0.08,
    contourDur: 0.05,
    velSpread: 0.35,
    ictusBoost: 1.06,
    lean: 0.1,
    rush: 0.1,
  },
  lyrical: {
    curve: 0.35,
    accent: 0.8,
    cadence: 0.15,
    ritard: 0.4,
    ritardNotes: 3,
    ritardCurve: 1.6,
    finisBoost: 1.5,
    baseVelocity: 0.68,
    contourVel: 0.18,
    contourDur: 0.11,
    velSpread: 0.5,
    ictusBoost: 1.08,
    lean: 0.3,
    rush: 0.3,
  },
  solemn: {
    curve: 0.5,
    accent: 1,
    cadence: 0.2,
    ritard: 0.5,
    ritardNotes: 4,
    ritardCurve: 1.6,
    finisBoost: 1.5,
    baseVelocity: 0.71,
    contourVel: 0.22,
    contourDur: 0.13,
    velSpread: 0.55,
    ictusBoost: 1.12,
    lean: 0.45,
    rush: 0.4,
  },
};

export function buildPhrasing(
  type: PhrasingType = "lyrical",
  options: BuildPhrasingOptions = {},
): PhrasingProfile {
  const base = PHRASING_PROFILES[type] ?? PHRASING_PROFILES.lyrical;
  return {
    ...base,
    ...(options.overrides ?? {}),
  };
}

const VELOCITY_MIN = 0.1;
const VELOCITY_MAX = 1.0;
const VELOCITY_SPREAD_MULTIPLIER = 2;
const VELOCITY_CENTER = 0.5;

const DURATION_BASE_FACTOR = 0.85;
const DURATION_ARSIS_FACTOR = 0.25;
const DURATION_ARCH_FACTOR = 0.2;
const DURATION_MIN = 0.2;
const DURATION_MAX = 4.0;

const CADENCE_VELOCITY_FACTOR = 0.5;
const CADENCE_DURATION_FACTOR = 0.6;

// The phrasing-side reading of the divisio (bar-line) hierarchy. This is the
// same bar hierarchy tabulated canonically in ../../../docs/api/score.md and
// weighted for analysis by metrics.ts's cadenceWeight ladder — but here the
// weights differ on purpose:
// this is a *shaping* factor, so the virgula (`) gets 0 (a breath, no cadential
// stress), where the analytic ladder still counts it. Do not unify the three.
const DIVISIO_STRENGTH: Record<string, number> = {
  "::": 1.0,
  ":": 0.7,
  ";": 0.7,
  ",": 0.4,
  "`": 0.0,
};

function getDivisioStrength(divisio: string | undefined): number {
  if (!divisio) return 0;
  return DIVISIO_STRENGTH[divisio] ?? 0;
}

export type PhrasingInputEvent =
  | (Note & { type?: "note" })
  | { type: "rest"; divisio: string; duration: number };

// LEAN AND RUSH: the phrasing one level down. A sung melisma is not a row of
// equal notes: a few are the real notes and the rest are runs between them,
// and a sung cadence leans into the note before the final and releases on
// it. `realNotes` marks the real ones in a phrase; the shaping then leans
// into those by `lean` and rushes the rest by `rush`. In a syllable of fewer
// than MELISMA_MIN notes nothing is marked, so syllabic chant is untouched
// apart from the cadence.
const MELISMA_MIN = 4;
const LEAN_VELOCITY = 0.18;
const LEAN_DURATION = 0.22;
const RUSH_VELOCITY = 0.18;
const RUSH_DURATION = 0.3;
const RELEASE_VELOCITY = 0.12;

type Role = "real" | "passing" | "release" | null;

function realNotes(
  notes: Note[], closing: string | undefined, tenorPc?: number, finalPc?: number,
  syllableOf?: ReadonlyMap<Note, unknown>,
): Role[] {
  const roles: Role[] = notes.map(() => null);
  // The melismas: the notes of one syllable. A syllable is known by identity
  // where the caller gives it; `context.syllableIndex` counts within a word and
  // restarts at 0, so a run of monosyllables ("et in te") would read as one
  // melisma by it, and serves only when no identity is given.
  const key = (n: Note): unknown => syllableOf?.get(n) ?? n.context.syllableIndex;
  let start = 0;
  for (let i = 1; i <= notes.length; i++) {
    const same = i < notes.length && key(notes[i]) === key(notes[start]);
    if (same) continue;
    const n = i - start;
    if (n >= MELISMA_MIN) {
      for (let k = start; k < i; k++) {
        const m = notes[k].pitch.midi;
        const first = k === start, last = k === i - 1;
        const prev = k > start ? notes[k - 1].pitch.midi : m;
        const next = k < i - 1 ? notes[k + 1].pitch.midi : m;
        const turn = (m > prev && m >= next) || (m < prev && m <= next);
        const pc = notes[k].pitch.pc;
        const onTenor = typeof tenorPc === "number" && pc === tenorPc;
        const onFinal = typeof finalPc === "number" && pc === finalPc;
        roles[k] = first || last || turn || onTenor || onFinal ? "real" : "passing";
      }
    }
    start = i;
  }
  // the cadence: a phrase closing on a bar whose last note is approached by step
  if (notes.length >= 2 && getDivisioStrength(closing) > 0) {
    const a = notes[notes.length - 2].pitch.midi, b = notes[notes.length - 1].pitch.midi;
    const step = Math.abs(a - b);
    if (step >= 1 && step <= 2) {
      roles[notes.length - 2] = "real";
      roles[notes.length - 1] = "release";
    }
  }
  return roles;
}

export function applyPhrasing(
  events: PhrasingInputEvent[],
  profile: PhrasingProfile,
  tenorPc?: number,
  finalPc?: number,
  /** Each note's syllable, by any key unique to it — see realNotes. */
  syllableOf?: ReadonlyMap<Note, unknown>,
): ShapedNote[] {
  const shaped: ShapedNote[] = [];

  type PhraseNote = {
    ev: (typeof events)[number];
    nextDivisio: string | undefined;
  };
  const phrases: PhraseNote[][] = [];
  let currentPhrase: PhraseNote[] = [];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.type === "rest") {
      if (currentPhrase.length > 0) {
        const last = currentPhrase[currentPhrase.length - 1];
        currentPhrase[currentPhrase.length - 1] = {
          ...last,
          nextDivisio: ev.divisio,
        };
        phrases.push(currentPhrase);
        currentPhrase = [];
      }
    } else {
      currentPhrase.push({ ev, nextDivisio: undefined });
    }
  }
  if (currentPhrase.length > 0) phrases.push(currentPhrase);

  for (let p = 0; p < phrases.length; p++) {
    const noteEntries = phrases[p];
    if (noteEntries.length === 0) continue;

    let minArsis = Infinity,
      maxArsis = -Infinity;
    let minStep = Infinity,
      maxStep = -Infinity;

    for (const { ev } of noteEntries) {
      // ev is always a Note here (rest events never enter currentPhrase)
      const note = ev as Note;
      const arsis = note.context.weight;
      if (arsis < minArsis) minArsis = arsis;
      if (arsis > maxArsis) maxArsis = arsis;
      const midi = note.pitch.midi;
      if (midi < minStep) minStep = midi;
      if (midi > maxStep) maxStep = midi;
    }

    const arsisSpan = maxArsis - minArsis || 1;
    const stepSpan = maxStep - minStep || 1;
    const roles = realNotes(
      noteEntries.map((e) => e.ev as Note),
      noteEntries[noteEntries.length - 1].nextDivisio,
      tenorPc, finalPc, syllableOf,
    );

    noteEntries.forEach(({ ev, nextDivisio }, order) => {
      const note = ev as Note;
      const arsis = note.context.weight;
      const arsisRelative = (arsis - minArsis) / arsisSpan;
      const contourRelative = (note.pitch.midi - minStep) / stepSpan;

      // A raised-cosine (Hann) window over the phrase: 0 at the ends, 1 at the
      // middle, so each phrase swells and subsides — the Solesmes grand rythme,
      // the phrase-arch [biblio: mocquereau-nombre]. `t` is the note's fractional
      // position through the phrase.
      const t = (order + 0.5) / (noteEntries.length + 0.0001);
      const arch = 0.5 - 0.5 * Math.cos(2 * Math.PI * t);

      // Blend the note's intrinsic arsic weight against its positional arch;
      // `curve` is the mix knob (0 = follow the note's own weight, 1 = follow the
      // phrase arch). The result is then re-centred on 0.5 and spread by velSpread.
      let velocity = arsisRelative * (1 - profile.curve) + arch * profile.curve;
      velocity += (contourRelative - VELOCITY_CENTER) * profile.contourVel;
      velocity =
        VELOCITY_CENTER +
        (velocity - VELOCITY_CENTER) *
          (profile.velSpread * VELOCITY_SPREAD_MULTIPLIER);
      velocity *= profile.accent;

      const divisioStrength = getDivisioStrength(nextDivisio);
      velocity *=
        1 - profile.cadence * divisioStrength * CADENCE_VELOCITY_FACTOR;

      const role = roles[order];
      if (role === "real") velocity *= 1 + profile.lean * LEAN_VELOCITY;
      else if (role === "passing") velocity *= 1 - profile.rush * RUSH_VELOCITY;
      else if (role === "release") velocity *= 1 - profile.lean * RELEASE_VELOCITY;

      const finalVelocity = Math.max(
        VELOCITY_MIN,
        Math.min(VELOCITY_MAX, velocity * profile.baseVelocity),
      );

      // The duration arch is one-sided: it rises with the velocity arch over
      // the first half and then HOLDS. The grand rythme's subsiding is a
      // lightening, not a hurrying — a symmetric window here made every phrase
      // accelerate into its cadence.
      const durArch = t < 0.5 ? arch : 1;
      const baseDur = note.performance.duration;
      let durFactor =
        DURATION_BASE_FACTOR +
        arsisRelative * DURATION_ARSIS_FACTOR +
        durArch * DURATION_ARCH_FACTOR;
      durFactor += (contourRelative - VELOCITY_CENTER) * profile.contourDur;
      if (note.context.ictus) durFactor *= profile.ictusBoost;
      durFactor += profile.cadence * divisioStrength * CADENCE_DURATION_FACTOR;

      // The rallentando into the close. The cadence term above lengthens only
      // the one note before the bar, so without a window a full close was held
      // no longer than a comma, and an ictus two notes earlier often outlasted
      // the final note. The window covers the phrase's last `ritardNotes` (or
      // all of a shorter phrase), rising 0 → 1 toward the bar along a power
      // curve; the divisio ladder grades it, so a comma leans, a double bar
      // broadens, a breath moves nothing. The piece's own last bar is not just
      // another double bar. A ritard is a tempo scaling, so it multiplies.
      const closing = noteEntries[noteEntries.length - 1].nextDivisio;
      const span = Math.min(
        Math.max(1, Math.round(profile.ritardNotes)),
        noteEntries.length,
      );
      const tail = order - (noteEntries.length - span);
      if (tail >= 0) {
        const ramp = ((tail + 1) / span) ** profile.ritardCurve;
        const finis =
          p === phrases.length - 1 && closing === "::" ? profile.finisBoost : 1;
        durFactor *=
          1 + profile.ritard * getDivisioStrength(closing) * finis * ramp;
      }

      if (role === "real") durFactor *= 1 + profile.lean * LEAN_DURATION;
      else if (role === "passing") durFactor *= 1 - profile.rush * RUSH_DURATION;

      const shapedDuration = Math.max(
        DURATION_MIN,
        Math.min(DURATION_MAX, baseDur * durFactor),
      );

      shaped.push({
        ...note,
        performance: {
          ...note.performance,
          velocity: finalVelocity,
        },
        shapedDuration,
      });
    });
  }

  return shaped;
}

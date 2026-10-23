// ---------------------------------------------------------------------------
// engines/score/ictus — the rhythmic ictus, placed by the Liber's rules
// ---------------------------------------------------------------------------
// The ictus (the rhythmic step, the alighting point) is placed per SECTION,
// the notes between two bars, because the Liber's rules reach across syllables
// and words [biblio: liber-usualis, Rules for Interpretation §VI]:
//
//   1. every note with the vertical episema;
//   2. every sustained note: the first of a distropha, tristropha, bivirga,
//      pressus or oriscus pair ("the first of the two notes forming the double
//      note"), a dotted note, the note before a quilisma;
//   3. any note that begins a group. This holds "only when it does not clash
//      with rules 1 or 2", and it "is dislodged by a Pressus, or Oriscus, or by
//      the vertical episema".
//
// Then the spacing. The ictus falls "on every second or third note ... Hence
// the impossibility of two such falls occurring in immediate succession,
// unless, of course, the first be a note of double value". Where more than
// three notes pass between two ictus, "an ictus of subdivision": 2+2, then 2+3
// or 3+2, "according to what seems to be suggested by the melody or text". In
// syllabic passages the Liber gives two methods: count back two by two from the
// last certain ictus, or follow the words, "preferring, first the endings of
// the words, secondly the accented syllables, while avoiding as much as
// possible the weak penultimate syllables". RULED 2026-10-22: the word method
// decides, and the count-back breaks its ties.
//
// The word accent places no ictus by itself. The Liber calls it "light, lifted
// up", and it only scores a subdivision. A horizontal episema over a single
// note "generally receives the ictus". Over a group it lengthens the group, and
// the group's own rhythm places the ictus (RULED 2026-10-22).
//
// The Antiphonale Monasticum fills one gap. It stars both notes of a dotted
// clivis (Regulæ, II a), so a group start keeps its ictus before its own dotted
// note.

import type { ParsedNote } from "./types.js";

/** Why a note may carry an ictus, as parseNeume read it from the notation and
 *  the lyric. */
export interface IctusFacts {
  /** Vertical episema ('). */
  sign: boolean;
  /** Horizontal episema (_). */
  episema: boolean;
  /** Mora vocis: 1 dot, 2 double dot. */
  mora: number;
  /** First note of a stropha run (ss / sss / vv / vvv). */
  strophaHead: boolean;
  /** Any note of a stropha run. */
  strophic: boolean;
  quilisma: boolean;
  /** First note of a melismatic syllable, or the note after a separator other
   *  than `!` and `@`. */
  groupStart: boolean;
  /** The syllable cell. Two notes on one pitch in one cell form a double note.
   *  Across cells they are recitation. */
  cell: number;
  step: number;
  /** First note of its syllable. */
  syllableFirst: boolean;
  /** The syllable ends its word. */
  wordEnd: boolean;
  /** The syllable bears the word's stress (marked, or the first of two). */
  stressed: boolean;
  /** The weak penultimate of a proparoxytone. */
  weakPenult: boolean;
  /** The duration before the ictus boost and the clamp. */
  rawDuration: number;
}

export interface IctusShape {
  ictusBoost: number;
  durationMin: number;
  durationMax: number;
}

// Scores for an ictus of subdivision on a syllable's first note, in the
// Liber's order: word endings first, accents second, weak penultimates avoided.
// The values only rank; the count-back breaks a tie.
const WORD_END = 4;
const STRESSED = 2;
const SYLLABLE = 1;
const WEAK_PENULT = -3;

/**
 * Place the ictus on every note of `notes` (rests mark the sections), then set
 * each note's duration: the raw duration, boosted on an ictus, clamped.
 */
export function assignIctus(
  events: ReadonlyArray<ParsedNote | { type: "rest" }>,
  facts: ReadonlyMap<ParsedNote, IctusFacts>,
  shape: IctusShape,
): void {
  let section: ParsedNote[] = [];
  const flush = () => {
    if (section.length) placeSection(section, section.map((n) => facts.get(n)!));
    section = [];
  };
  for (const e of events) {
    if (e.type === "rest") flush();
    else if (facts.has(e as ParsedNote)) section.push(e as ParsedNote);
  }
  flush();

  for (const [note, f] of facts) {
    const d = note.ictus ? f.rawDuration * shape.ictusBoost : f.rawDuration;
    note.duration = Math.max(shape.durationMin, Math.min(shape.durationMax, d));
  }
}

function placeSection(notes: ParsedNote[], f: IctusFacts[]): void {
  const n = notes.length;
  // Two notes on one pitch in one syllable, neither a stropha, are a double
  // note (pressus, oriscus pair). A run of them is one, held on its first.
  const unison = (i: number) =>
    i + 1 < n && f[i]!.cell === f[i + 1]!.cell && f[i]!.step === f[i + 1]!.step &&
    !f[i]!.strophic && !f[i + 1]!.strophic;
  const insideUnison = (i: number) => i > 0 && unison(i - 1);
  const opensUnison = (i: number) => unison(i) && !insideUnison(i);
  // A note of double value may be followed directly by another ictus.
  const double = (i: number) => f[i]!.mora > 0 || unison(i) || f[i]!.strophaHead;
  const units = (i: number) => (f[i]!.mora > 0 ? 2 : 1);

  // A horizontal episema over a group is the group's lengthening, not one
  // ictus per note. Only a stroke over a single note places one.
  const episemaRun = (i: number) =>
    f[i]!.episema &&
    ((i > 0 && f[i - 1]!.episema && f[i - 1]!.cell === f[i]!.cell) ||
      (i + 1 < n && f[i + 1]!.episema && f[i + 1]!.cell === f[i]!.cell));

  // Rules 1 and 2: the certain ictus. `dislodges` marks the ones a group start
  // just before them must yield to. The dot does not (the AM's dotted clivis),
  // nor does the lone horizontal episema ("generally").
  const ictus = new Array<boolean>(n).fill(false);
  const certain = new Array<boolean>(n).fill(false);
  const dislodges = new Array<boolean>(n).fill(false);
  for (let i = 0; i < n; i++) {
    const x = f[i]!;
    const beforeQuilisma = i + 1 < n && f[i + 1]!.quilisma && f[i + 1]!.cell === x.cell;
    if (x.sign || x.strophaHead || beforeQuilisma || opensUnison(i)) {
      certain[i] = true;
      dislodges[i] = true;
    } else if (x.mora > 0 || (x.episema && !episemaRun(i))) {
      certain[i] = true;
    }
  }
  // The quilisma is the light note, and the inside of a double note is held.
  // Neither takes an ictus unless the edition writes one.
  const barred = (i: number) => !f[i]!.sign && (f[i]!.quilisma || insideUnison(i));
  for (let i = 0; i < n; i++) if (certain[i] && !barred(i)) ictus[i] = true;

  // Rule 3, yielding to rules 1 and 2 on either side. Before a certain ictus
  // that dislodges, the group start gives way. After a certain ictus that is
  // not of double value, it gives way too: no two ictus in succession.
  for (let i = 0; i < n; i++) {
    if (ictus[i] || !f[i]!.groupStart || barred(i)) continue;
    if (i + 1 < n && dislodges[i + 1] && ictus[i + 1]) continue;
    if (i > 0 && ictus[i - 1] && certain[i - 1] && !double(i - 1)) continue;
    ictus[i] = true;
  }
  // A group of one note (a lone punctum between figures) gives way to the
  // group that follows it directly.
  for (let i = 0; i + 1 < n; i++) {
    if (ictus[i] && !certain[i] && ictus[i + 1] && !certain[i + 1] && !double(i)) ictus[i] = false;
  }

  subdivide(n, ictus, barred, units, f);
  for (let i = 0; i < n; i++) notes[i]!.ictus = ictus[i]!;
}

/**
 * The ictus of subdivision. Between two ictus, and before the first and after
 * the last, the notes are cut into beats of two or three units. Each beat
 * begins with an ictus. A note of double value (the dot) counts two. One unit
 * may stand before a section's first ictus as its upbeat.
 */
function subdivide(
  n: number,
  ictus: boolean[],
  barred: (i: number) => boolean,
  units: (i: number) => number,
  f: IctusFacts[],
): void {
  const score = (i: number) => {
    const x = f[i]!;
    if (!x.syllableFirst) return 0;
    return SYLLABLE + (x.wordEnd ? WORD_END : 0) + (x.stressed ? STRESSED : 0) +
      (x.weakPenult ? WEAK_PENULT : 0);
  };
  const marks = ictus.flatMap((v, i) => (v ? [i] : []));

  if (marks.length === 0) {
    // No certain ictus at all: the whole section is one run, closed by the bar.
    fill(0, n, true, ictus, barred, units, score);
    return;
  }
  fill(0, marks[0]!, true, ictus, barred, units, score);
  for (let k = 0; k < marks.length; k++) {
    const a = marks[k]!;
    const b = k + 1 < marks.length ? marks[k + 1]! : n;
    let total = 0;
    for (let i = a; i < b; i++) total += units(i);
    if (total > 3) fill(a, b, false, ictus, barred, units, score);
  }
}

interface Cut { score: number; beats: number[] } // beats in units, last first

/**
 * Cut notes [a, b) into beats of 2 or 3 units. When `lead` is false, a already
 * carries the ictus and opens the first beat. When it is true, the run leads
 * into the section's first ictus (or the bar): one unit may stand as an
 * upbeat, and every beat start is chosen. Prefer the text score, then the
 * count-back (twos nearest the following ictus).
 */
function fill(
  a: number,
  b: number,
  lead: boolean,
  ictus: boolean[],
  barred: (i: number) => boolean,
  units: (i: number) => number,
  score: (i: number) => number,
): void {
  if (b - a < 2 && lead) return;
  // best[i]: the best cut of [i, b) into beats, each opening at its first note.
  const best = new Map<number, Cut | null>();
  best.set(b, { score: 0, beats: [] });
  const span = (i: number, len: number) => {
    let u = 0, j = i;
    while (j < b && u < len) u += units(j++);
    return u === len ? j : -1;
  };
  for (let i = b - 1; i >= a; i--) {
    let pick: Cut | null = null;
    for (const len of [2, 3]) {
      const j = span(i, len);
      if (j < 0) continue;
      const rest = best.get(j);
      if (!rest) continue;
      const fixed = i === a && !lead;
      if (!fixed && barred(i)) continue;
      const cand: Cut = {
        score: (fixed ? 0 : score(i)) + rest.score,
        beats: [...rest.beats, len],
      };
      if (!pick || better(cand, pick)) pick = cand;
    }
    best.set(i, pick);
  }
  let start = a;
  let chosen = best.get(a) ?? null;
  if (lead && units(a) === 1) {
    const up = best.get(a + 1) ?? null;
    if (up && (!chosen || better(up, chosen))) { chosen = up; start = a + 1; }
  }
  if (!chosen) return; // nothing fits (a barred note in the way): leave it
  // Walk the cut forward and set the beat starts.
  let i = start;
  for (const len of [...chosen.beats].reverse()) {
    ictus[i] = true;
    let u = 0;
    while (u < len) u += units(i++);
  }
}

/** Higher text score wins. On a tie, the count-back: compare the beats from
 *  the end, twos first. */
function better(x: Cut, y: Cut): boolean {
  if (x.score !== y.score) return x.score > y.score;
  for (let k = 0; k < Math.min(x.beats.length, y.beats.length); k++) {
    if (x.beats[k] !== y.beats[k]) return x.beats[k]! < y.beats[k]!;
  }
  return x.beats.length > y.beats.length;
}

// ---------------------------------------------------------------------------
// engines/score/parse — GABC notation parser
// ---------------------------------------------------------------------------
// GABC (the Gregorio project's plain-text chant notation) encodes a melody as
// lyric syllables, each followed by a parenthesized note group: `Pu(g)er(gh)`.
// The parser is built around that pairing because it is what makes the encoding
// tractable — text and neumes stay aligned syllable by syllable, so syllables,
// neumes, and metrics reconstruct without images. Pitch letters (a–m) have no
// absolute value; they are read against the clef declaration (c1–c4, f1–f4),
// which fixes where `do`/`fa` sit on the staff — hence CLEF_OFFSETS below. The
// note group is where every performance mark lives (episema, quilisma,
// liquescent, dot) and the syllable boundary is where lyric-driven accent
// is recovered; the parser walks group by group and reads each into IR events.
//
// The rhythm/ictus model was designed from the Liber Usualis "Rules for
// Interpretation" [biblio: liber-usualis]; the rules below are its.
//
// The ictus (the rhythmic footfall) follows the Liber's three rules, its spacing
// and its subdivision. Those reach across syllables and words, so this file
// only records each note's facts (marks, group starts, the word around it).
// ictus.ts places the ictus for each section between two bars.
//
// Accidental scope follows the Liber: a flat holds for the rest of the word, or
// until the next bar line (even a quarter-bar), and is cancelled by a natural —
// so `bmolle` resets at word and bar boundaries. The neume taxonomy (punctum,
// virga, podatus, clivis, scandicus, salicus, climacus, torculus, porrectus and
// their compounds) and the liquescent/quilisma/pressus treatments are the
// Liber's; each is classified where it is read below.
import type {
  ArticulationProfile,
  LyricRun,
  ParseOptions,
  ParsedNote,
  ParseResult,
  RestEvent,
  WrittenShape,
  Liquescence,
  Signum,
} from "./types.js";
import { buildArticulation } from "./articulation.js";
import { assignIctus, type IctusFacts } from "./ictus.js";
import { createLyricDecoder } from "./lyric.js";
import { detectVowelAccent } from "../chant/syllabify.js";

// Constants
// `oct` anchors the staff onto the gamut, which is an absolute frame: guido.ts
// fixes Γ at midi 43. At oct 3 a chant read an octave below that anchor, so
// most of the corpus sat at or under the gamut's floor.
const DEFAULT_OPTIONS: Required<Pick<ParseOptions, "oct" | "useVowelAccent">> =
  {
    oct: 4,
    useVowelAccent: true,
  };

// Per-clef diatonic-step offset. A GABC clef names the staff line it sits on
// (c1–c4, f1–f4; the `b` variants also declare a flat), which fixes which pitch
// the letters a–m read as. The value is subtracted from the letter's position
// when anchoring it onto the gamut (see `pos` below), so the same letter reads
// higher or lower depending on the clef in force.
const CLEF_OFFSETS = new Map<string, number>([
  ["c1", -3],
  ["c2", -1],
  ["c3", 1],
  ["c4", 3],
  ["f1", 1],
  ["f2", 3],
  ["f3", 5],
  ["f4", 7],
  ["cb1", -3],
  ["cb2", -1],
  ["cb3", 1],
  ["cb4", 3],
  ["fb1", 1],
  ["fb2", 3],
  ["fb3", 5],
  ["fb4", 7],
]);

const DIVISIO_DURATIONS = new Map<RestEvent["divisio"], number>([
  [",", 0.54],
  ["`", 0.33],
  [";", 0.8],
  [":", 1.1],
  ["::", 1.8],
]);

const STAFF_STEPS = [0, 2, 4, 5, 7, 9, 11] as const;

const SYLLABLES_REGEX = /(?=.)((?:[^(])*)(?:\(?([^)]*)\)?)?/g;
const NOTATIONS_REGEX =
  /z0|z|Z|::|:|[,;][1-6]?|`|[cf][1-4]|cb[1-4]|fb[1-4]|\/\[-?[\d.]+\]|\/0|\/+|@| |\!|-?[a-mA-M][oOwWvVrRsxy#~\+><_\.'012345]*(?:\[[^\]]*\]?)*|\{([^}]+)\}?/g;

/** GABC's separators inside a syllable's notes: `!` cuts the glyph with no
 *  space, `/` adds the small space between elements, `//` the larger one,
 *  `/0` half the small one, `/[n]` n times it (n may be negative). A run of
 *  three or four slashes is read as its slashes. Each parts the figure. */
const SEPARATOR = /^(?:!|\/+|\/0|\/\[-?[\d.]+\])$/;

// Types
type AccidentalValue = -1 | 0 | 1;

interface IntermNote {
  step: number;
  degree: number;
  lyric: string;
  runs?: LyricRun[];
  keepWithPrev?: boolean;
  syllableIndex: number;
  cell: number;
  neumeGroup: number;
  separator: string | null;
  staffLetter: string;      // raw GABC pitch letter a–m (drives staff position)
  clef: string;             // the active clef, for the renderer's position math
  shape: WrittenShape;      // the written notehead shape (gregorio S_* vocabulary)
  ictus: boolean;
  ictusSign: boolean;       // the written vertical episema / ictus mark (')
  episema: boolean;         // the written horizontal episema (_) — distinct from ictus
  accidental: AccidentalValue;
  accidentalSource: "none" | "state" | "explicit";
  /**
   * The accidental SIGN to draw before this note, when a GABC accidental token
   * precedes it. Distinct from `accidental`, which is this note's own
   * alteration: `fe(jx)cit(ih)` draws a flat before the I while the flat itself
   * governs J. Where the sign is printed and which degree it alters are two
   * different facts, and conflating them is how the emitter came to depend on a
   * phantom note.
   */
  accidentalSign?: AccidentalValue;
  quilisma: boolean;
  liquescent: boolean;
  strophicus: boolean;
  oriscus: boolean;
  liquescence: Liquescence | null;
  oriscusDirection: "ascending" | "descending" | null;
  hollow: boolean;
  signum: Signum | null;
  mora: 0 | 1 | 2; // mora vocis count: 0 none, 1 dot '.', 2 double dot '..'
  _weight: number;
  _durWeight: number;
  /** First note of a stropha run (ss / vv) — the run's ictus. */
  _strophaHead: boolean;
  /** Begins a group (the Liber's rule 3): a melismatic syllable's first note,
   *  or the note after a separator other than `!` and `@`. */
  _groupStart: boolean;
}

// GABC r1–r5, the signs gregorio prints over a note.
const SIGNA: Readonly<Record<string, Signum>> = Object.freeze({
  "1": "accentus",
  "2": "accentusReversus",
  "3": "circulus",
  "4": "semicirculus",
  "5": "semicirculusReversus",
});

// An oriscus written without o0/o1 points at the next pitch that differs from
// its own: up is ascending, down (or nothing after it) descending. Gregorio's
// rule (gabc_determine_oriscus_orientation), run over the whole score because
// the next pitch is often in the next syllable.
function orientOrisci(events: ParseResult["events"]): void {
  const notes = events.filter((e) => e.type === "note");
  notes.forEach((n, i) => {
    if (!n.oriscus || n.oriscusDirection) return;
    const next = notes.slice(i + 1).find((m) => m.step !== n.step);
    n.oriscusDirection = next && next.step > n.step ? "ascending" : "descending";
  });
}

// Helpers
function initialAccidentalState(clef: string): Map<number, AccidentalValue> {
  const state = new Map<number, AccidentalValue>();
  if (clef.includes("b")) state.set(6, -1); // B-flat key signature
  return state;
}

function isLineBreak(token: string): boolean {
  // GABC's explicit break: `z` a line break, `Z` a page break, `z0` a break
  // that suppresses the custos. tonus paginates nothing, so all three mean the
  // same thing here — end the system.
  return token === "z" || token === "Z" || token === "z0";
}

function isSkippable(token: string): boolean {
  return (
    token === " " ||
    token === "\r" ||
    token.startsWith("{") ||
    token.includes("+")
  );
}

/**
 * GABC's repetition shorthand writes two or three notes on one pitch as one
 * token: `hss`/`hsss` are strophae, `hvv`/`hvvv` virgae. Read as one token they
 * were one note, and 664 runs on the shelf lost their repeats. Unrolled here so
 * every later step sees one token per note: the head keeps the shorthand (the
 * strophicus weighting reads it, once, as before), modifiers after the run go to
 * the last note (`hsss<` liquesces on the third), and the repeats are returned
 * so they carry the `strophicus` flag without the weighting a second time.
 * The same pass takes out `@`, the fusion sign, and returns the notes it joins.
 */
function unrollRepeats(tokens: string[]): { notation: string[]; repeats: Set<number>; fused: Set<number> } {
  const notation: string[] = [];
  const repeats = new Set<number>();
  const fused = new Set<number>();
  for (const token of tokens) {
    // `@` fuses the glyph before it to the glyph after (gregorio). It is no
    // break, so it leaves the token stream; the note after it carries it.
    if (token === "@") { fused.add(notation.length); continue; }
    const m = /^(-?)([a-mA-M])([^sv[]*?)(s{2,3}|v{2,3})(.*)$/.exec(token ?? "");
    if (!m) { notation.push(token); continue; }
    const [, dash, letter, before, run, after] = m;
    const n = run!.length;
    notation.push(dash! + letter! + before! + run!);
    for (let k = 1; k < n; k++) {
      repeats.add(notation.length);
      notation.push(letter! + run![0]! + (k === n - 1 ? after! : ""));
    }
  }
  return { notation, repeats, fused };
}

// parseNeume
function parseNeume(
  written: string[],
  context: {
    lyric: string;
    runs?: LyricRun[];
    keepWithPrev?: boolean;
    clef: string;
    oct: number;
    syllableIndex: number;
    cell: number;
    accent: boolean;
    accidentalState: Map<number, AccidentalValue>;
    /** Carries a pending accidental SIGN across syllables — see below. */
    pending: { acc: AccidentalValue | null };
    profile: ArticulationProfile;
    /** Collects each note's ictus facts for the section pass. */
    facts: Map<ParsedNote, IctusFacts>;
  },
): ParseResult["events"] {
  const { lyric, runs, keepWithPrev, clef, oct, syllableIndex, cell, accent, accidentalState, pending, profile, facts } =
    context;
  const weights = profile.weights;
  const ruleGain = profile.ruleGain ?? 1.0;
  const contourScale = profile.contourScale ?? 0.2;
  const neumeArch = profile.neumeArch ?? 0.5;
  const durArch = profile.durArch ?? 0.08;

  // bmolle: set from clef key sig, updated by x/y modifiers within tokens
  let bmolle = clef.includes("b");


  const { notation, repeats, fused } = unrollRepeats(written);

  // Count note tokens for initio/melisma detection
  const noteTokenCount = notation.filter((t) =>
    /^-?[a-mA-M]/.test(t ?? ""),
  ).length;

  const breaks: number[] = [];
  const breakKinds: string[] = [];
  const intermed: IntermNote[] = [];
  // neumeGroup: 0-based index of the neume figure within this syllable. GABC
  // glyph separators (!, /, //) start a new figure; MusicXML slurs each figure.
  let neumeGroup = 0;

  notation.forEach((rawToken, i) => {
    if (!rawToken || rawToken.length < 1) return;

    // Break markers — end the current neume figure, begin the next.
    if (SEPARATOR.test(rawToken)) {
      breaks.push(i);
      breakKinds.push(rawToken);
      neumeGroup++;
      return;
    }

    let token = rawToken;
    let w = 0;
    let durWeight = 0;
    let strophaHead = false;
    let groupStart = false;
    let isQuilisma = false;
    let isLiquescent = false;
    let isStrophicus = false;
    let isOriscus = false;
    let mora: 0 | 1 | 2 = 0;

    // Dash prefix (weak note)
    if (token[0] === "-") {
      token = token.slice(1);
      w += weights.dashWeight; // negative weight
      durWeight += weights.dashDuration;
    }

    const rawLetter = token[0];
    const letter = rawLetter?.toLowerCase();
    if (!letter) return;
    const pitchOffset = letter.charCodeAt(0) - "a".charCodeAt(0);
    if (pitchOffset < 0 || pitchOffset > 12) return;
    // An uppercase pitch letter is a punctum inclinatum (the small diamond).
    const isInclinatum = rawLetter !== letter;

    const clefOffset = CLEF_OFFSETS.get(clef) ?? 0;
    const pos = pitchOffset - 6 - clefOffset;
    const octave = Math.floor(pos / 7) + oct + 1;
    const degree = ((pos % 7) + 7) % 7;
    const baseStep = STAFF_STEPS[degree];

    // The written marks after the pitch letter, with gregorio's bracketed
    // attributes removed. A bracket is an address, not a mark: `_[oh:h]`
    // places an episema and `[alt:IV.]` sets text, and read raw their letters
    // were an oriscus (4,839 false ones on the shelf) and a mora (9).
    const marks = token.slice(1).replace(/\[[^\]]*\]?/g, "");
    let explicitAccidental: AccidentalValue | null = null;

    if (marks.includes("x")) {
      bmolle = true;
      explicitAccidental = -1;
      accidentalState.set(degree, -1);
    } else if (marks.includes("y")) {
      bmolle = false;
      explicitAccidental = 0;
      accidentalState.set(degree, 0);
    } else if (marks.includes("#")) {
      explicitAccidental = 1;
      accidentalState.set(degree, 1);
    }

    // An accidental is a MARK, not a note. `fx` says "F is flat from here" and
    // is drawn as a flat sign on the F line — nothing is sung at that moment.
    // The state above is its whole effect, so the token ends here.
    //
    // It used to fall through and emit a note at the flattened pitch, which is
    // why `A(fxfg)` returned three notes for two and duplicated the pitch: the
    // marker sounded, then the F it governs sounded again. 1337 markers across
    // 426 Graduale chants — 0.97% of every note in the book was a phantom, with
    // a wrong pitch, inflating counts and inventing an interval of a unison
    // before each one.
    //
    // The token is the mark alone: a bare pitch letter plus x/y/#. A letter
    // carrying an accidental AND other modifiers is still a real note (nothing
    // in the corpus writes one, but the reading is the safe one).
    if (explicitAccidental !== null && /^[a-mA-M][xy#]$/.test(token)) {
      // The SIGN still belongs on the page — a flat is drawn before the note it
      // governs, which is where the books put it. The mark had been riding the
      // phantom note itself; with that gone it is handed to the next real note,
      // which is both correct notation and what the emitters already expect
      // (they key the glyph off `accidentalSource === "explicit"`).
      pending.acc = explicitAccidental;
      return;
    }

    // Apply bmolle to B (degree 6 = B natural step 11 → B-flat step 10)
    let step = baseStep;
    if (bmolle && degree === 6) step -= 1;
    // Apply chromatic accidentals from state (on top of bmolle)
    const stateAccidental = accidentalState.get(degree) ?? 0;
    const activeAccidental = explicitAccidental ?? stateAccidental;
    // If bmolle already lowered B, don't double-apply flat from state
    if (!(bmolle && degree === 6 && activeAccidental === -1)) {
      step += activeAccidental;
    }
    step += octave * 12;

    // A sign handed over by a preceding accidental token is drawn AT this note,
    // whatever its degree. A GABC accidental is a key-signature mark, not an
    // alteration of the note beside it: `gx` says "G is flat for the rest of the
    // word" and the books print the flat where it is written, then sing on.
    // Measured across 693 corpus markers, only 11% are immediately followed by
    // the same letter — so requiring the degrees to agree (my first attempt)
    // suppressed the sign in nine cases out of ten.
    const inheritedSign = pending.acc;
    if (inheritedSign !== null) pending.acc = null;
    const inherited = inheritedSign !== null;

    const accidentalSource: "none" | "state" | "explicit" =
      explicitAccidental !== null || inherited
        ? "explicit"
        : accidentalState.has(degree)
          ? "state"
          : "none";

    // Ictus markers (' and _). Both signal the rhythmic footfall (weight
    // unchanged), but they are DISTINCT written marks the renderer must draw
    // apart: ' is the vertical episema (ictus mark), _ the horizontal episema.
    const hasIctusSign = marks.includes("'");
    const hasEpisema = marks.includes("_");
    if (hasIctusSign || hasEpisema) {
      w += weights.ictusWeight;
      durWeight += weights.ictusDuration;
    }

    // Mora vocis — the GABC dot '.' lengthens THIS note (a held note before a
    // pause). A double dot '..' is the double mora (a stronger lengthening at a
    // major cadence); it adds to this note's duration, not the neume's first
    // note — the dots belong to the note that carries them. (The horizontal
    // episema is '_', handled with the ictus markers above.)
    if (marks.includes(".")) {
      w += weights.episemaWeight;
      durWeight += weights.episemaDuration;
      mora = 1;
      if (marks.includes("..")) {
        mora = 2;
        durWeight += weights.episemaDoubleDuration;
      }
    }

    // Strophicus (ss or vv = repeated/tremolo notes)
    if (marks.includes("ss") || marks.includes("vv")) {
      w += weights.strophicusWeight;
      durWeight += weights.strophicusDuration;
      strophaHead = true;
      isStrophicus = true;
      if (marks.includes("sss") || marks.includes("vvv")) {
        durWeight += weights.strophicusTripleDuration;
      }
    }
    if (repeats.has(i)) isStrophicus = true;

    // Quilisma (w = wavy ornamental note; boosts preceding note)
    if (marks.toLowerCase().includes("w")) {
      const prev = intermed.length > 0 ? intermed[intermed.length - 1] : null;
      if (prev) prev._weight += weights.quilismaPrevWeight;
      w += weights.quilismaWeight; // reduces this note's weight
      isQuilisma = true;
    }

    // First note of the syllable (initio debilis treatment). In a melisma it
    // begins a group, the Liber's rule 3. The word accent weights its syllable
    // but places no ictus: the Liber calls it "light, lifted up", and the
    // ictus pass reads it only to choose a subdivision (ictus.ts).
    if (i === 0) {
      w += weights.initioWeight;
      if (noteTokenCount > 1) {
        groupStart = true;
        w += weights.initioMelismaWeight;
        durWeight += weights.initioMelismaDuration;
      }
    }
    if (accent) w += weights.accentWeight;

    // Liquescent (softened ending: ~, <, >)
    if (
      marks.includes("~") ||
      marks.includes("<") ||
      marks.includes(">")
    ) {
      w += weights.liquescentWeight;
      durWeight += weights.liquescentDuration;
      isLiquescent = true;
    }

    // Upper case = light/weak note
    if (token[0] === token[0]?.toUpperCase()) {
      w += weights.uppercaseWeight;
      durWeight += weights.uppercaseDuration;
    }

    // Oriscus (o = soft, light note taken slightly faster; the rhythmic
    // support falls on the note before it). Suñol, Textbook Ch. V.
    if (marks.includes("o")) {
      w += weights.oriscusWeight;
      durWeight += weights.oriscusDuration;
      isOriscus = true;
      const before = intermed.length > 0 ? intermed[intermed.length - 1] : null;
      if (before) before._weight += weights.oriscusPrevWeight;
    }

    // Repercussion (same pitch as previous note)
    const prev = intermed.length > 0 ? intermed[intermed.length - 1] : null;
    if (prev && step === prev.step) {
      prev._weight += weights.repercussionPrevWeight;
      prev._durWeight += weights.repercussionPrevDuration;
      if (marks.includes("o")) {
        prev._weight += weights.repercussionOriscusWeight;
      }
    }

    // Written note shape (gregorio's S_* vocabulary, simplified) — what the
    // renderer draws. Priority: the inclinatum diamond and the ornamental
    // shapes win over the plain punctum/virga forms.
    //
    // The r family is read the way gregorio's lexer reads it: r alone empties
    // the note (cavum), R draws it between two vertical lines, r0 does both,
    // and r1–r5 are signs printed over a FULL note. Testing for a bare "r"
    // made gr1 a hollow head, which is the one thing its accent does not say.
    const hollow = /r(?![1-8])/.test(marks);
    const signum = SIGNA[/r([1-5])/.exec(marks)?.[1] ?? ""] ?? null;
    let shape: WrittenShape = "punctum";
    if (isInclinatum) shape = "inclinatum";
    else if (isQuilisma) shape = "quilisma";
    // A lone s is gregorio's stropha too. The shape is what is written, not
    // the analytical `strophicus` flag, which the bivirga `vv` also sets: a
    // repeated virga is drawn as virgae.
    else if (marks.includes("s")) shape = "strophicus";
    else if (marks.includes("V")) shape = "virgaReversa";
    else if (marks.includes("v")) shape = "virga";
    else if (isOriscus) shape = "oriscus";
    else if (marks.includes("R") || marks.includes("r0")) shape = "lineaPunctum";

    const liquescence: Liquescence | null = !isLiquescent ? null
      : marks.includes("~") ? "deminutive"
      : marks.includes("<") ? "ascending"
      : "descending";
    // o0 / o1 write the orientation; a bare o leaves it to the next pitch,
    // resolved after the syllable's notes are known (below).
    const oriscusDirection: "ascending" | "descending" | null = !isOriscus ? null
      : marks.includes("o1") ? "ascending"
      : marks.includes("o0") ? "descending"
      : null;

    intermed.push({
      step,
      degree,
      lyric,
      runs,
      keepWithPrev,
      syllableIndex,
      cell,
      neumeGroup,
      separator: fused.has(i) ? "@" : null,
      staffLetter: letter,
      clef,
      shape,
      ictus: false,
      ictusSign: hasIctusSign,
      episema: hasEpisema,
      accidental: activeAccidental as AccidentalValue,
      ...(inheritedSign !== null ? { accidentalSign: inheritedSign } : {}),
      ...(explicitAccidental !== null ? { accidentalSign: explicitAccidental } : {}),
      accidentalSource,
      quilisma: isQuilisma,
      liquescent: isLiquescent,
      strophicus: isStrophicus,
      oriscus: isOriscus,
      liquescence,
      oriscusDirection,
      hollow,
      signum,
      mora,
      _weight: w,
      _durWeight: durWeight,
      _strophaHead: strophaHead,
      _groupStart: groupStart,
    });
  });

  // Apply break markers to corresponding notes
  breaks.forEach((b, bi) => {
    const idx = b - bi;
    const target = intermed[idx];
    if (target) {
      target.separator = breakKinds[bi]!;
      // `!` cuts a glyph and keeps the neume: gregorio sets the pieces as one
      // figure, and strokes.ts reads them so. So it begins no group and takes
      // no group-start ictus. It was the largest source of ictus the Liber
      // forbids: 12,999 of them, 5,349 on the quilisma itself.
      if (target.separator === "!") return;
      target._weight += weights.breakWeight;
      target._groupStart = true;
    }
  });

  // A figure that is one liquescent note is the punctum liquescens, and it is
  // drawn out a little (see punctumLiquescensDuration). Whether a note stands
  // alone is known only once the syllable's figures are, so it is read here.
  const figureSize = new Map<number, number>();
  for (const n of intermed) figureSize.set(n.neumeGroup, (figureSize.get(n.neumeGroup) ?? 0) + 1);
  for (const n of intermed) {
    if (n.liquescent && figureSize.get(n.neumeGroup) === 1) {
      n._durWeight += weights.punctumLiquescensDuration;
    }
  }

  // Finalization pass: arch + melodic contour + tanh saturation
  const result: ParseResult["events"] = intermed.map((note, idx) => {
    const t = (idx + 0.5) / (intermed.length + 0.0001);
    const arch = Math.sin(Math.PI * t);

    // Melodic contour: peak/valley emphasis
    const prev = intermed[idx - 1];
    const next = intermed[idx + 1];
    let contour = 0;
    if (prev && next) {
      if (note.step > prev.step && note.step > next.step) {
        contour = 0.4 * (contourScale / 0.2); // melodic peak
      } else if (note.step < prev.step && note.step < next.step) {
        contour = -0.3 * (contourScale / 0.2); // melodic valley
      }
    }

    const weight =
      profile.weightBase +
      profile.weightGain *
        ruleGain *
        Math.tanh((note._weight + contour) / profile.weightSaturation) +
      arch * neumeArch;

    // The ictus boost and the clamp wait for the ictus, which is placed per
    // section once every syllable is read (ictus.ts).
    let duration =
      profile.durationBase * (1 + profile.durationGain * Math.tanh(note._durWeight));
    duration *= 1 + arch * durArch;

    const event: ParsedNote = {
      type: "note" as const,
      step: note.step,
      lyric: note.lyric,
      runs: note.runs,
      keepWithPrev: note.keepWithPrev,
      syllableIndex: note.syllableIndex,
      cell: note.cell,
      neumeGroup: note.neumeGroup,
      separator: note.separator,
      // Tonic word-accent of this note's syllable (Latin accentuation), the same
      // boolean the articulation weighting reads above — surfaced as data so the
      // tabula carries it (accent stats, prose-cursus). Syllable-wide constant.
      accent,
      staffLetter: note.staffLetter,
      clef: note.clef,
      shape: note.shape,
      ictus: note.ictus,
      ictusSign: note.ictusSign,
      episema: note.episema,
      weight,
      duration,
      accidental: note.accidental,
      ...(note.accidentalSign !== undefined ? { accidentalSign: note.accidentalSign } : {}),
      accidentalSource: note.accidentalSource,
      quilisma: note.quilisma,
      liquescent: note.liquescent,
      strophicus: note.strophicus,
      oriscus: note.oriscus,
      liquescence: note.liquescence,
      oriscusDirection: note.oriscusDirection,
      hollow: note.hollow,
      signum: note.signum,
      mora: note.mora,
    };
    facts.set(event, {
      sign: note.ictusSign,
      episema: note.episema,
      mora: note.mora,
      strophaHead: note._strophaHead,
      strophic: note.strophicus,
      quilisma: note.quilisma,
      groupStart: note._groupStart,
      cell: note.cell,
      step: note.step,
      syllableFirst: idx === 0,
      wordEnd: false,
      stressed: false,
      weakPenult: false,
      rawDuration: duration,
    });
    return event;
  });

  return result;
}

// parseGABC — main entry point
export function parseGABC(
  gabc: string,
  options: ParseOptions = {},
): ParseResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const interpretation = options.interpretation ?? {};
  const articulation = buildArticulation(
    interpretation.articulation ?? "balanced",
    { overrides: interpretation.articulationOverrides },
  );
  const errors: ParseResult["errors"] = [];
  const events: ParseResult["events"] = [];
  const facts = new Map<ParsedNote, IctusFacts>();
  let cellSerial = 0;   // one per notated syllable cell — see ParsedNote.cell
  const source = (gabc || "").trim();

  if (!source) {
    return {
      events,
      errors: [{ message: "Empty GABC input" }],
    };
  }

  let currentClef = "c3";
  // A `z` sets this, and the next note born carries it. The marker usually sits
  // in its own group — "…son.(c.) (z) Chri(h)ste…" — so the flag has to outlive
  // the syllable it appeared in rather than being consumed where it was seen.
  let pendingLineBreak = false;
  let accidentalState = initialAccidentalState(currentClef);
  // An accidental token draws a sign but sounds nothing, so the sign is claimed
  // by the next real note. It must survive the syllable boundary: the marker
  // very often sits ALONE in its own group — "a(gx)b(a)" — so a flag local to
  // one neume would be discarded before the note it governs is parsed.
  const pendingAccidental: { acc: AccidentalValue | null } = { acc: null };
  // One lyric decoder per source: GABC style tags open and close across
  // syllable (and word) boundaries, so the decode state rides the whole walk.
  const lyricDecoder = createLyricDecoder();
  const split = source.replace(/\)\s(?=[^\)]*(?:\(|$))/g, ")\n").split(/\n/g);

  split.forEach((word) => {
    if (!word) return;
    // A flat holds for the rest of the WORD or until a divisio — a new word
    // clears any accidental the previous word set (the clef's own signature
    // persists). This is the scope the header states, now enforced.
    accidentalState = initialAccidentalState(currentClef);
    pendingAccidental.acc = null;   // a new clef clears any unclaimed sign

    SYLLABLES_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    let syllableIndex = 0;
    // The word's sung syllables, for the ictus pass: where the word ends, which
    // syllable bears its stress, which is a weak penultimate.
    const wordSyllables: { notes: ParsedNote[]; accent: boolean }[] = [];

    while ((match = SYLLABLES_REGEX.exec(word)) !== null) {
      const rawText = (match[1] ? match[1].trim().split("|")[0] : "") || "";
      // Decode GABC lyric markup EVERY syllable — a style opened here may
      // close syllables later, so the decoder's state must advance even when
      // this syllable carries no notes.
      const decoded = lyricDecoder.decode(rawText);
      const text = decoded.text;
      const notation = match[2] ? match[2].match(NOTATIONS_REGEX) : null;

      if (!notation || notation.length === 0) {
        syllableIndex += 1;
        continue;
      }

      // Single-pass: classify tokens, collect note tokens in order
      const noteTokens: string[] = [];
      let divisioToken: RestEvent["divisio"] | null = null;

      for (const token of notation) {
        if (CLEF_OFFSETS.has(token)) {
          currentClef = token;
          accidentalState = initialAccidentalState(currentClef);
    pendingAccidental.acc = null;   // a new clef clears any unclaimed sign
          continue;
        }
        if (DIVISIO_DURATIONS.has(token as RestEvent["divisio"])) {
          if (!divisioToken) divisioToken = token as RestEvent["divisio"];
          continue;
        }
        // A BREAK IS ITS OWN GROUP. GABC writes one as `(z)`, alone; a `z`
        // that FOLLOWS notes inside a group is not one. The tokenizer splits
        // `ra(gz)ti` into ["g","z"] because `z` is not in a note's suffix
        // class, and that stray token was read as the engraver's break — so
        // three responsories in the Nocturnale cut their systems a third of
        // the way across the page and left the rest of the line empty.
        //
        // The rule is NOTES BEFORE IT, not "alone in its group": `(z0::c3)` is
        // a real break carrying the double bar and the new clef after it, and
        // those are common. What is never a break is a `z` that FOLLOWS
        // notes, which is what `(gz)` and `(hjHG__z)` are.
        if (isLineBreak(token)) {
          if (noteTokens.length === 0) pendingLineBreak = true;
          continue;
        }
        if (isSkippable(token)) continue;
        noteTokens.push(token);
      }

      if (noteTokens.length > 0) {
        const before = events.length;
        const accent = opts.useVowelAccent ? detectVowelAccent(text) : false;
        events.push(
          ...parseNeume(noteTokens, {
            lyric: text,
            runs: decoded.runs,
            keepWithPrev: decoded.keepWithPrev,
            clef: currentClef,
            oct: opts.oct,
            syllableIndex,
            cell: cellSerial++,
            accent,
            accidentalState,
            pending: pendingAccidental,
            profile: articulation,
            facts,
          }),
        );
        wordSyllables.push({
          notes: events.slice(before).filter((e): e is ParsedNote => e.type === "note"),
          accent,
        });
          // The break lands on the FIRST note the marker precedes, and is
          // spent there. A `z` usually sits in a group with NO notes of its
          // own — "…(::) (z)Ps. E(g)ru…" — so the flag outlives that group
          // and is claimed by the next note born, which is the one the
          // engraver meant to start the new line.
          if (pendingLineBreak) {
            const first = events[before];
            if (first && first.type === "note") first.lineBreak = true;
            pendingLineBreak = false;
          }
      }

      if (divisioToken) {
        events.push({
          type: "rest",
          divisio: divisioToken,
          duration: DIVISIO_DURATIONS.get(divisioToken) ?? 0.5,
        });
        accidentalState = initialAccidentalState(currentClef);
    pendingAccidental.acc = null;   // a new clef clears any unclaimed sign
      }

      syllableIndex += 1;
    }
    markWord(wordSyllables, facts);
  });

  if (events.length === 0) {
    errors.push({ message: "No parseable notation found" });
  }
  orientOrisci(events);
  assignIctus(events, facts, {
    ictusBoost: articulation.ictusBoost ?? 1.08,
    durationMin: articulation.durationMin,
    durationMax: articulation.durationMax,
  });

  return { events, errors };
}

/**
 * The word facts the ictus pass weighs. The editions mark the accent only on
 * words of three syllables or more. A word of two carries it on the first, and
 * a monosyllable carries none. In a proparoxytone (stress on the antepenult)
 * the penultimate is the weak syllable the Liber says to avoid.
 */
function markWord(
  syllables: { notes: ParsedNote[]; accent: boolean }[],
  facts: Map<ParsedNote, IctusFacts>,
): void {
  const k = syllables.length;
  if (k === 0) return;
  let stress = syllables.findIndex((s) => s.accent);
  if (stress < 0 && k === 2) stress = 0;
  syllables.forEach((s, i) => {
    for (const note of s.notes) {
      const f = facts.get(note);
      if (!f) continue;
      f.wordEnd = i === k - 1;
      f.stressed = i === stress;
      f.weakPenult = k >= 3 && stress === k - 3 && i === k - 2;
    }
  });
}

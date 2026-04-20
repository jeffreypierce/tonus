// ---------------------------------------------------------------------------
// engines/score/parse — GABC notation parser
// ---------------------------------------------------------------------------
import type {
  ArticulationProfile,
  ParseOptions,
  ParseResult,
  RestEvent,
} from "./types.js";
import { buildArticulation } from "./articulation.js";
import { detectVowelAccent } from "../chant/syllabify.js";

// Constants
const DEFAULT_OPTIONS: Required<Pick<ParseOptions, "oct" | "useVowelAccent">> =
  {
    oct: 3,
    useVowelAccent: true,
  };

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
  /z0|z|Z|::|:|[,;][1-6]?|`|[cf][1-4]|cb[1-4]|fb[1-4]|\/+| |\!|-?[a-mA-M][oOwWvVrRsxy#~\+><_\.'012345]*(?:\[[^\]]*\]?)*|\{([^}]+)\}?/g;

// Types
type AccidentalValue = -1 | 0 | 1;

interface IntermNote {
  step: number;
  degree: number;
  lyric: string;
  syllableIndex: number;
  ictus: boolean;
  accidental: AccidentalValue;
  accidentalSource: "none" | "state" | "explicit";
  quilisma: boolean;
  liquescent: boolean;
  strophicus: boolean;
  doubleEpisema: boolean;
  _weight: number;
  _durWeight: number;
}

// Helpers
function initialAccidentalState(clef: string): Map<number, AccidentalValue> {
  const state = new Map<number, AccidentalValue>();
  if (clef.includes("b")) state.set(6, -1); // B-flat key signature
  return state;
}

function isSkippable(token: string): boolean {
  return (
    token === " " ||
    token === "z" ||
    token === "Z" ||
    token === "z0" ||
    token === "\r" ||
    token.startsWith("{") ||
    token.includes("+")
  );
}

// parseNeume
function parseNeume(
  notation: string[],
  context: {
    lyric: string;
    clef: string;
    oct: number;
    syllableIndex: number;
    accent: boolean;
    accidentalState: Map<number, AccidentalValue>;
    profile: ArticulationProfile;
  },
): ParseResult["events"] {
  const { lyric, clef, oct, syllableIndex, accent, accidentalState, profile } =
    context;
  const weights = profile.weights;
  const ruleGain = profile.ruleGain ?? 1.0;
  const contourScale = profile.contourScale ?? 0.2;
  const neumeArch = profile.neumeArch ?? 0.5;
  const durArch = profile.durArch ?? 0.08;
  const ictusBoost = profile.ictusBoost ?? 1.08;

  // bmolle: set from clef key sig, updated by x/y modifiers within tokens
  let bmolle = clef.includes("b");

  // Count note tokens for initio/melisma detection
  const noteTokenCount = notation.filter((t) =>
    /^-?[a-mA-M]/.test(t ?? ""),
  ).length;

  const breaks: number[] = [];
  const intermed: IntermNote[] = [];

  notation.forEach((rawToken, i) => {
    if (!rawToken || rawToken.length < 1) return;

    // Break markers
    if (rawToken === "!" || rawToken === "/" || rawToken === "//") {
      breaks.push(i);
      return;
    }

    let token = rawToken;
    let w = 0;
    let durWeight = 0;
    let ictus = false;
    let isQuilisma = false;
    let isLiquescent = false;
    let isStrophicus = false;
    let isDoubleEpisema = false;

    // Dash prefix (weak note)
    if (token[0] === "-") {
      token = token.slice(1);
      w += weights.dashWeight; // negative weight
      durWeight += weights.dashDuration;
    }

    const letter = token[0]?.toLowerCase();
    if (!letter) return;
    const pitchOffset = letter.charCodeAt(0) - "a".charCodeAt(0);
    if (pitchOffset < 0 || pitchOffset > 12) return;

    const clefOffset = CLEF_OFFSETS.get(clef) ?? 0;
    const pos = pitchOffset - 6 - clefOffset;
    const octave = Math.floor(pos / 7) + oct + 1;
    const degree = ((pos % 7) + 7) % 7;
    const baseStep = STAFF_STEPS[degree];

    // bmolle / accidental modifier extraction
    // Modifiers appear after the pitch letter in the token string
    const modifiers = token.slice(1);
    let explicitAccidental: AccidentalValue | null = null;

    if (modifiers.includes("x")) {
      bmolle = true;
      explicitAccidental = -1;
      accidentalState.set(degree, -1);
    } else if (modifiers.includes("y")) {
      bmolle = false;
      explicitAccidental = 0;
      accidentalState.set(degree, 0);
    } else if (modifiers.includes("#")) {
      explicitAccidental = 1;
      accidentalState.set(degree, 1);
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

    const accidentalSource: "none" | "state" | "explicit" =
      explicitAccidental !== null
        ? "explicit"
        : accidentalState.has(degree)
          ? "state"
          : "none";

    // Ictus markers (' and _)
    if (modifiers.includes("'") || modifiers.includes("_")) {
      w += weights.ictusWeight;
      durWeight += weights.ictusDuration;
      ictus = true;
    }

    // Episema (horizontal lengthening '.')
    if (modifiers.includes(".")) {
      w += weights.episemaWeight;
      durWeight += weights.episemaDuration;
      ictus = true;
      // Double episema '..' — boost first note of neume
      if (modifiers.includes("..")) {
        isDoubleEpisema = true;
        if (intermed[0]) intermed[0]._durWeight += weights.episemaDoubleDuration;
      }
    }

    // Strophicus (ss or vv = repeated/tremolo notes)
    if (modifiers.includes("ss") || modifiers.includes("vv")) {
      w += weights.strophicusWeight;
      durWeight += weights.strophicusDuration;
      ictus = true;
      isStrophicus = true;
      if (modifiers.includes("sss") || modifiers.includes("vvv")) {
        durWeight += weights.strophicusTripleDuration;
      }
    }

    // Quilisma (w = wavy ornamental note; boosts preceding note)
    if (modifiers.toLowerCase().includes("w")) {
      const prev = intermed.length > 0 ? intermed[intermed.length - 1] : null;
      if (prev) prev._weight += weights.quilismaPrevWeight;
      w += weights.quilismaWeight; // reduces this note's weight
      isQuilisma = true;
    }

    // First note of neume (initio debilis treatment)
    if (i === 0 || (accent && i === 2)) {
      w += weights.initioWeight;
      if (noteTokenCount > 1) {
        ictus = true;
        w += weights.initioMelismaWeight;
        durWeight += weights.initioMelismaDuration;
      }
    }

    // Accented syllable
    if (accent) {
      w += weights.accentWeight;
      if (i === 0 || i === 2) ictus = true;
    }

    // Liquescent (softened ending: ~, <, >)
    if (
      modifiers.includes("~") ||
      modifiers.includes("<") ||
      modifiers.includes(">")
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

    // Repercussion (same pitch as previous note)
    const prev = intermed.length > 0 ? intermed[intermed.length - 1] : null;
    if (prev && step === prev.step) {
      prev._weight += weights.repercussionPrevWeight;
      prev._durWeight += weights.repercussionPrevDuration;
      if (modifiers.includes("o")) {
        prev._weight += weights.repercussionOriscusWeight;
      }
    }

    intermed.push({
      step,
      degree,
      lyric,
      syllableIndex,
      ictus,
      accidental: activeAccidental as AccidentalValue,
      accidentalSource,
      quilisma: isQuilisma,
      liquescent: isLiquescent,
      strophicus: isStrophicus,
      doubleEpisema: isDoubleEpisema,
      _weight: w,
      _durWeight: durWeight,
    });
  });

  // Apply break markers to corresponding notes
  breaks.forEach((b, bi) => {
    const idx = b - bi;
    const target = intermed[idx];
    if (target) {
      target._weight += weights.breakWeight;
      target.ictus = true;
    }
  });

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

    let duration =
      profile.durationBase * (1 + profile.durationGain * Math.tanh(note._durWeight));
    duration *= 1 + arch * durArch;
    if (note.ictus) duration *= ictusBoost;
    duration = Math.max(profile.durationMin, Math.min(profile.durationMax, duration));

    return {
      type: "note" as const,
      step: note.step,
      lyric: note.lyric,
      syllableIndex: note.syllableIndex,
      ictus: note.ictus,
      weight,
      duration,
      accidental: note.accidental,
      accidentalSource: note.accidentalSource,
      quilisma: note.quilisma,
      liquescent: note.liquescent,
      strophicus: note.strophicus,
      doubleEpisema: note.doubleEpisema,
    };
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
  const source = (gabc || "").trim();

  if (!source) {
    return {
      events,
      errors: [{ message: "Empty GABC input" }],
    };
  }

  let currentClef = "c3";
  let accidentalState = initialAccidentalState(currentClef);
  const split = source.replace(/\)\s(?=[^\)]*(?:\(|$))/g, ")\n").split(/\n/g);

  split.forEach((word) => {
    if (!word) return;

    SYLLABLES_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    let syllableIndex = 0;

    while ((match = SYLLABLES_REGEX.exec(word)) !== null) {
      const text = (match[1] ? match[1].trim().split("|")[0] : "") || "";
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
          continue;
        }
        if (DIVISIO_DURATIONS.has(token as RestEvent["divisio"])) {
          if (!divisioToken) divisioToken = token as RestEvent["divisio"];
          continue;
        }
        if (isSkippable(token)) continue;
        noteTokens.push(token);
      }

      if (noteTokens.length > 0) {
        const accent = opts.useVowelAccent ? detectVowelAccent(text) : false;
        events.push(
          ...parseNeume(noteTokens, {
            lyric: text,
            clef: currentClef,
            oct: opts.oct,
            syllableIndex,
            accent,
            accidentalState,
            profile: articulation,
          }),
        );
      }

      if (divisioToken) {
        events.push({
          type: "rest",
          divisio: divisioToken,
          duration: DIVISIO_DURATIONS.get(divisioToken) ?? 0.5,
        });
        accidentalState = initialAccidentalState(currentClef);
      }

      syllableIndex += 1;
    }
  });

  if (events.length === 0) {
    errors.push({ message: "No parseable notation found" });
  }

  return { events, errors };
}

// ---------------------------------------------------------------------------
// instrumentalis/score/phrasing — performance-shaping profiles
// ---------------------------------------------------------------------------

import type { ScoredNote, PhrasingProfile, PhrasingType } from "./types.js";
import type { ModeData } from "../temper/modes.js";

export type { PhrasingProfile } from "./types.js";

export interface ShapedNote extends ScoredNote {
  shapedDuration: number;
}

export interface BuildPhrasingOptions {
  overrides?: Partial<PhrasingProfile>;
}

export interface ShapePhrasingForModeOptions {
  enabled?: boolean;
  strength?: number;
}

const PHRASING_PROFILES: Record<PhrasingType, PhrasingProfile> = {
  recitative: {
    curve: 0.1,
    accent: 0.5,
    cadence: 0.1,
    tenor: 2.3,
    baseVelocity: 0.65,
    contourVel: 0.08,
    contourDur: 0.05,
    velSpread: 0.35,
    ictusBoost: 1.06,
    neumeArch: 0.2,
    durArch: 0.04,
  },
  lyrical: {
    curve: 0.35,
    accent: 0.8,
    cadence: 0.15,
    tenor: 1.2,
    baseVelocity: 0.68,
    contourVel: 0.18,
    contourDur: 0.11,
    velSpread: 0.5,
    ictusBoost: 1.08,
    neumeArch: 0.5,
    durArch: 0.08,
  },
  hymnic: {
    curve: 0.25,
    accent: 0.6,
    cadence: 0.12,
    tenor: 0.9,
    baseVelocity: 0.69,
    contourVel: 0.14,
    contourDur: 0.08,
    velSpread: 0.45,
    ictusBoost: 1.08,
    neumeArch: 0.38,
    durArch: 0.06,
  },
  solemn: {
    curve: 0.5,
    accent: 1,
    cadence: 0.2,
    tenor: 1.7,
    baseVelocity: 0.71,
    contourVel: 0.22,
    contourDur: 0.13,
    velSpread: 0.55,
    ictusBoost: 1.12,
    neumeArch: 0.62,
    durArch: 0.1,
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

const MODE_TYPE_TENOR_MULTIPLIER: Record<ModeData["type"], number> = {
  authentic: 1.08,
  plagal: 0.92,
};

const MODE_TYPE_CADENCE_MULTIPLIER: Record<ModeData["type"], number> = {
  authentic: 1.05,
  plagal: 0.95,
};

const MODE_TENDENCY_CADENCE_MULTIPLIER: Record<
  ModeData["profile"]["tendency"],
  number
> = {
  melismatic: 1.06,
  neumatic: 1.0,
  syllabic: 0.96,
  neutral: 1.0,
};

const MODE_MOOD_BASE_VELOCITY_DELTA: Record<string, number> = {
  neutral: 0,
  serious: -0.01,
  sad: -0.03,
  mystic: -0.01,
  harmonious: 0.01,
  happy: 0.04,
  devout: 0.01,
  angelical: 0.03,
  perfect: 0.02,
};

const MODE_MOOD_CURVE_DELTA: Record<string, number> = {
  neutral: 0,
  serious: 0.01,
  sad: 0.02,
  mystic: 0.015,
  harmonious: 0.005,
  happy: -0.01,
  devout: 0.01,
  angelical: -0.015,
  perfect: -0.005,
};

const MODE_STRENGTH_DEFAULT = 0.5;
const MODE_STRENGTH_MIN = 0;
const MODE_STRENGTH_MAX = 1;
const TENOR_MIN = 0.4;
const TENOR_MAX = 2.8;
const CADENCE_MIN = 0.05;
const CADENCE_MAX = 0.35;
const CURVE_MIN = 0.05;
const CURVE_MAX = 0.65;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function blendMultiplier(multiplier: number, strength: number): number {
  return 1 + (multiplier - 1) * strength;
}

export function shapePhrasingForMode(
  profile: PhrasingProfile,
  modeData?: ModeData,
  options: ShapePhrasingForModeOptions = {},
): PhrasingProfile {
  if (!modeData || options.enabled === false) return { ...profile };

  const strength = clamp(
    options.strength ?? MODE_STRENGTH_DEFAULT,
    MODE_STRENGTH_MIN,
    MODE_STRENGTH_MAX,
  );
  const mood = modeData.profile.mood ?? "neutral";
  const tendency = modeData.profile.tendency ?? "neutral";

  const tenor = clamp(
    profile.tenor *
      blendMultiplier(MODE_TYPE_TENOR_MULTIPLIER[modeData.type], strength),
    TENOR_MIN,
    TENOR_MAX,
  );

  const cadence = clamp(
    profile.cadence *
      blendMultiplier(MODE_TYPE_CADENCE_MULTIPLIER[modeData.type], strength) *
      blendMultiplier(MODE_TENDENCY_CADENCE_MULTIPLIER[tendency], strength),
    CADENCE_MIN,
    CADENCE_MAX,
  );

  const baseVelocity = clamp(
    profile.baseVelocity + (MODE_MOOD_BASE_VELOCITY_DELTA[mood] ?? 0) * strength,
    0.4,
    0.9,
  );

  const curve = clamp(
    profile.curve + (MODE_MOOD_CURVE_DELTA[mood] ?? 0) * strength,
    CURVE_MIN,
    CURVE_MAX,
  );

  return {
    ...profile,
    tenor,
    cadence,
    baseVelocity,
    curve,
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

const TENOR_GAIN = 0.05;
const TENOR_DISTANCE_DIVISOR = 6;

const CADENCE_VELOCITY_FACTOR = 0.5;
const CADENCE_DURATION_FACTOR = 0.6;

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

function pitchClassDistance(pc1: number, pc2: number): number {
  const forward = (12 + pc2 - pc1) % 12;
  const backward = (12 + pc1 - pc2) % 12;
  return Math.min(forward, backward);
}

export type PhrasingInputEvent = {
  type: string;
  midi?: number;
  weight?: number;
  duration?: number | null;
  ictus?: boolean | number;
  divisio?: string;
};

export function applyPhrasing(
  events: PhrasingInputEvent[],
  profile: PhrasingProfile,
  tenorPc?: number,
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

  for (const phrase of phrases) {
    const noteEntries = phrase;
    if (noteEntries.length === 0) continue;

    let minArsis = Infinity,
      maxArsis = -Infinity;
    let minStep = Infinity,
      maxStep = -Infinity;

    for (const { ev } of noteEntries) {
      const arsis = ev.weight ?? 0;
      if (arsis < minArsis) minArsis = arsis;
      if (arsis > maxArsis) maxArsis = arsis;
      if (typeof ev.midi === "number") {
        if (ev.midi < minStep) minStep = ev.midi;
        if (ev.midi > maxStep) maxStep = ev.midi;
      }
    }

    const arsisSpan = maxArsis - minArsis || 1;
    const stepSpan = maxStep - minStep || 1;

    noteEntries.forEach(({ ev, nextDivisio }, order) => {
      const arsis = ev.weight ?? 0;
      const arsisRelative = (arsis - minArsis) / arsisSpan;
      const contourRelative =
        typeof ev.midi === "number" ? (ev.midi - minStep) / stepSpan : 0.5;

      const t = (order + 0.5) / (noteEntries.length + 0.0001);
      const arch = 0.5 - 0.5 * Math.cos(2 * Math.PI * t);

      let velocity = arsisRelative * (1 - profile.curve) + arch * profile.curve;
      velocity += (contourRelative - VELOCITY_CENTER) * profile.contourVel;
      velocity =
        VELOCITY_CENTER +
        (velocity - VELOCITY_CENTER) *
          (profile.velSpread * VELOCITY_SPREAD_MULTIPLIER);
      velocity *= profile.accent;

      if (
        profile.tenor &&
        typeof tenorPc === "number" &&
        typeof ev.midi === "number"
      ) {
        const pc = ((ev.midi % 12) + 12) % 12;
        const dist = pitchClassDistance(pc, tenorPc);
        const tenorPull = Math.max(0, 1 - dist / TENOR_DISTANCE_DIVISOR);
        velocity *= 1 + profile.tenor * TENOR_GAIN * tenorPull;
      }

      const divisioStrength = getDivisioStrength(nextDivisio);
      velocity *=
        1 - profile.cadence * divisioStrength * CADENCE_VELOCITY_FACTOR;

      const finalVelocity = Math.max(
        VELOCITY_MIN,
        Math.min(VELOCITY_MAX, velocity * profile.baseVelocity),
      );

      const baseDur = ev.duration ?? 1;
      let durFactor =
        DURATION_BASE_FACTOR +
        arsisRelative * DURATION_ARSIS_FACTOR +
        arch * DURATION_ARCH_FACTOR;
      durFactor += (contourRelative - VELOCITY_CENTER) * profile.contourDur;
      if (ev.ictus) durFactor *= profile.ictusBoost;
      durFactor += profile.cadence * divisioStrength * CADENCE_DURATION_FACTOR;

      const shapedDuration = Math.max(
        DURATION_MIN,
        Math.min(DURATION_MAX, baseDur * durFactor),
      );

      shaped.push({
        ...(ev as unknown as ScoredNote),
        velocity: finalVelocity,
        shapedDuration,
      });
    });
  }

  return shaped;
}

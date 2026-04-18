// ---------------------------------------------------------------------------
// engines/harmonia/voice — pitch each body through a doctrina
// ---------------------------------------------------------------------------
import type { Body } from "../planet/types.js";
import type { Pitch } from "../temper/pitch.js";
import type { Scale } from "../temper/scale.js";
import { toPitch } from "../temper/pitch.js";
import type { Performance } from "../score/types.js";
import type { Doctrina, Voice } from "./data/doctrines.js";
import { computePresence, computeMotion } from "./presence.js";

// VoicedPitch — a tuned Pitch with a Performance layer, sized for harmonia.
// Planetary bodies don't have a modal step or score context (yet), so this
// is a partial Note shape. Velocity is 0–127 (MIDI byte), not the 0–1 shaping
// factor used in the score engine.
export interface VoicedPitch {
  pitch: Pitch;
  performance: Performance;
}

export interface VoicedBody extends Body {
  nota: VoicedPitch;
  presence: number; // 0–1
  motion: number;   // 0–1
  greekName: string;
}

// MIDI anchor for the doctrina's mese. A4 = MIDI 69 — matches the default temper
// reference. Ratios in the doctrina are multiplied by this anchor to produce Hz.
const ANCHOR_MIDI = 69;

function voiceOne(body: Body, voice: Voice, scale: Scale): VoicedBody {
  const pliny = voice.greekName === "proslambanomenos" && body.name === "Earth";
  const presence = pliny ? 1 : computePresence(body);
  const motion = pliny ? 0 : computeMotion(body);

  // Direct Hz from anchor (A4) and doctrina ratio — bypass scale quantization
  // so the ratio's pure Hz relationship is preserved.
  const ratioVal = voice.ratio[0] / voice.ratio[1];
  const hz = scale.a4 * ratioVal;
  const midi = ANCHOR_MIDI + 12 * Math.log2(ratioVal);

  // Nearest MIDI for Pitch metadata; override hz to the pure ratio-derived value.
  const roundedMidi = Math.max(0, Math.min(127, Math.round(midi)));
  const pitch: Pitch = { ...toPitch(roundedMidi, scale), hz };

  const performance: Performance = {
    velocity: Math.round(presence * 127),
    duration: 0,
    arsis: 1,
    thesis: 0,
  };

  return {
    ...body,
    nota: { pitch, performance },
    presence,
    motion,
    greekName: voice.greekName,
  };
}

export function voiceBodies(
  bodies: Body[],
  doctrina: Doctrina,
  scale: Scale,
): VoicedBody[] {
  // Map doctrina body name → Voice entry
  const voiceByBody = new Map<string, Voice>();
  for (const v of doctrina.voices) voiceByBody.set(v.body, v);

  const result: VoicedBody[] = [];
  for (const body of bodies) {
    const voice = voiceByBody.get(body.name);
    if (!voice) continue; // body not part of this doctrina (e.g. Earth in Boethius)
    result.push(voiceOne(body, voice, scale));
  }
  return result;
}

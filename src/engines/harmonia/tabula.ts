// ---------------------------------------------------------------------------
// engines/harmonia/tabula — flat iterable view of voiced bodies
// ---------------------------------------------------------------------------
import type { BodyName } from "../planet/types.js";
import type { VoicedBody } from "./voice.js";
import type { VoicedAspect } from "./aspects.js";

export interface HarmonyTabulaRow {
  bodyIndex: number;
  name: BodyName;
  nomen: string;
  greekName: string;

  midi: number;
  pc: number;
  oct: number;
  spn: string;
  hz: number;

  presence: number;
  motion: number;
  velocity: number; // 0–1, presence-scaled (same scale as score tabula)

  vowelGreek: string;
  vowelPhonetic: string;
  vowelName: string;

  zodiac: number;
  sign: string;
  retrograde: boolean;
  elongation: number;
  magnitude: number;

  aspectCount: number;
}

export function computeHarmonyTabula(
  bodies: VoicedBody[],
  aspects: VoicedAspect[],
): HarmonyTabulaRow[] {
  const aspectCountByName = new Map<string, number>();
  for (const a of aspects) {
    for (const name of a.bodies) {
      aspectCountByName.set(name, (aspectCountByName.get(name) ?? 0) + 1);
    }
  }

  return bodies.map((b, i) => ({
    bodyIndex: i,
    name: b.name,
    nomen: b.nomen,
    greekName: b.greekName,

    midi: b.nota.pitch.midi,
    pc: b.nota.pitch.pc,
    oct: b.nota.pitch.oct,
    spn: b.nota.pitch.spn,
    hz: b.nota.pitch.hz,

    presence: b.presence,
    motion: b.motion,
    velocity: b.nota.performance.velocity,

    vowelGreek: b.vowel.greek,
    vowelPhonetic: b.vowel.phonetic,
    vowelName: b.vowel.name,

    zodiac: b.zodiac,
    sign: b.sign,
    retrograde: b.retrograde,
    elongation: b.elongation,
    magnitude: b.magnitude,

    aspectCount: aspectCountByName.get(b.name) ?? 0,
  }));
}

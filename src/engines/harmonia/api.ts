// ---------------------------------------------------------------------------
// engines/harmonia/api — voice the sky through a planetary-harmony doctrina
// ---------------------------------------------------------------------------
import type { Cosmos } from "../planet/types.js";
import type { Temperamentum } from "../temper/api.js";
import { buildTemper } from "../temper/api.js";
import type { Scale } from "../temper/scale.js";
import { buildRatios } from "../temper/scale.js";
import { voiceBodies, type VoicedBody } from "./voice.js";
import { voiceAspects, type VoicedAspect } from "./aspects.js";
import { computeImprintFromBodies, type Imprint } from "../imprint.js";
import { computeHarmonyTabula, type HarmonyTabulaRow } from "./tabula.js";
import type { Author, Doctrina } from "./data/doctrines.js";
import { DOCTRINAE } from "./data/doctrines.js";

export type { VoicedBody, VoicedAspect, Author };

export interface HarmoniaOpts {
  temperamentum?: Temperamentum;
  doctrina?: Author;
}

export interface Frame {
  date: Date;
  bodies: VoicedBody[];
  aspects: VoicedAspect[];
}

export interface Harmony {
  doctrina: Author;
  doctrinaName: string;
  date: Date;
  bodies: VoicedBody[];
  aspects: VoicedAspect[];
  frames?: Frame[];
  tabula: HarmonyTabulaRow[];
  imprint: Imprint;
}

function resolveScale(temper: Temperamentum | undefined): Scale {
  if (temper) {
    return buildRatios({
      mode: temper.mode === "auto" ? 1 : temper.mode,
      a4: temper.a4,
      root: temper.root,
      transpose: temper.transpose,
      comma: temper.comma,
    });
  }
  return buildRatios();
}

function averageBodies(frames: VoicedBody[][]): VoicedBody[] {
  if (frames.length === 0) return [];
  if (frames.length === 1) return frames[0]!;

  const byName = new Map<string, VoicedBody[]>();
  for (const frame of frames) {
    for (const body of frame) {
      const list = byName.get(body.name) ?? [];
      list.push(body);
      byName.set(body.name, list);
    }
  }

  const result: VoicedBody[] = [];
  for (const [, list] of byName) {
    if (list.length === 0) continue;
    const representative = list[0]!;
    const meanPresence = list.reduce((s, b) => s + b.presence, 0) / list.length;
    const meanMotion = list.reduce((s, b) => s + b.motion, 0) / list.length;
    result.push({ ...representative, presence: meanPresence, motion: meanMotion });
  }
  return result;
}

/**
 * Harmony of the spheres builder (`tonus.harmonia`). Voices a Cosmos
 * (or series) into pitches and Greek vowels under a doctrina —
 * Pythagoras, Boethius (default), Pliny, or Ptolemy — returning voiced
 * bodies, aspects, an imprint, and a tabula.
 */
export function buildHarmonia(
  input: Cosmos | Cosmos[],
  opts: HarmoniaOpts = {},
): Harmony {
  const cosmosArray = Array.isArray(input) ? input : [input];
  if (cosmosArray.length === 0) {
    throw new RangeError("harmonia requires at least one Cosmos");
  }

  const temper = opts.temperamentum ?? buildTemper();
  const scale = resolveScale(temper);

  const doctrinaKey: Author = opts.doctrina ?? "boethius";
  const doctrina: Doctrina | undefined = DOCTRINAE.get(doctrinaKey);
  if (!doctrina) {
    throw new RangeError(`Unknown doctrina: ${doctrinaKey}`);
  }

  const perCosmosBodies: VoicedBody[][] = [];
  const frames: Frame[] = [];
  for (const cosmos of cosmosArray) {
    const vb = voiceBodies(cosmos.bodies, doctrina, scale);
    const va = voiceAspects(cosmos.aspects, vb);
    perCosmosBodies.push(vb);
    frames.push({ date: cosmos.date, bodies: vb, aspects: va });
  }

  const aggregateBodies = averageBodies(perCosmosBodies);
  const aggregateAspects = frames[0]?.aspects ?? [];
  const imprint = computeImprintFromBodies(aggregateBodies, scale);

  const harmony: Harmony = {
    doctrina: doctrinaKey,
    doctrinaName: doctrina.name,
    date: cosmosArray[0]!.date,
    bodies: aggregateBodies,
    aspects: aggregateAspects,
    tabula: computeHarmonyTabula(aggregateBodies, aggregateAspects),
    imprint,
  };

  if (Array.isArray(input)) {
    harmony.frames = frames;
  }

  return harmony;
}

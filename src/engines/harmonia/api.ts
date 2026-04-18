// ---------------------------------------------------------------------------
// engines/harmonia/api — voice the sky through a planetary-harmony doctrina
// ---------------------------------------------------------------------------
import type { Cosmos } from "../planet/types.js";
import type { Temper } from "../temper/api.js";
import { buildTemper } from "../temper/api.js";
import type { Scale } from "../temper/scale.js";
import { buildRatios } from "../temper/scale.js";
import { voiceBodies, type VoicedBody } from "./voice.js";
import { voiceAspects, type VoicedAspect } from "./aspects.js";
import { computeHarmoniaMetrics } from "./metrics.js";
import { computeModalAffinity, type ModalAffinity } from "./affinity.js";
import type { Attractor } from "../summa/attractors.js";
import type { Author, Doctrina } from "./data/doctrines.js";
import { DOCTRINAE } from "./data/doctrines.js";

export type { VoicedBody, VoicedAspect, ModalAffinity, Author };

export interface HarmoniaOpts {
  temper?: Temper;
  doctrina?: Author;
}

export interface Frame {
  date: Date;
  bodies: VoicedBody[];
  aspects: VoicedAspect[];
  consonanceIndex: number;
}

export interface Influence {
  doctrina: Author;
  doctrinaName: string;
  cosmosCount: number;
  date: Date;
  bodies: VoicedBody[];
  aspects: VoicedAspect[];
  pcDistribution: Record<number, number>;
  attractors: Attractor[];
  consonanceIndex: number;
  retrogradeCount: number;
  silentCount: number;
  modalAffinity: ModalAffinity[];
  frames?: Frame[];
}

function resolveScale(temper: Temper | undefined): Scale {
  if (temper) {
    return buildRatios({
      mode: temper.mode === "auto" ? 1 : temper.mode,
      a4: temper.a4,
      root: temper.root,
      transpose: temper.transpose,
      comma: temper.comma,
    });
  }
  // Default: pythagorean A440
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

export function buildHarmonia(
  input: Cosmos | Cosmos[],
  opts: HarmoniaOpts = {},
): Influence {
  const cosmosArray = Array.isArray(input) ? input : [input];
  if (cosmosArray.length === 0) {
    throw new RangeError("harmonia requires at least one Cosmos");
  }

  const temper = opts.temper ?? buildTemper();
  const scale = resolveScale(temper);

  const doctrinaKey: Author = opts.doctrina ?? "boethius";
  const doctrina: Doctrina | undefined = DOCTRINAE.get(doctrinaKey);
  if (!doctrina) {
    throw new RangeError(`Unknown doctrina: ${doctrinaKey}`);
  }

  // Per-cosmos voicing
  const perCosmosBodies: VoicedBody[][] = [];
  const frames: Frame[] = [];
  for (const cosmos of cosmosArray) {
    const vb = voiceBodies(cosmos.bodies, doctrina, scale);
    const va = voiceAspects(cosmos.aspects, vb);
    perCosmosBodies.push(vb);

    const frameMetrics = computeHarmoniaMetrics(vb, va, scale);
    frames.push({
      date: cosmos.date,
      bodies: vb,
      aspects: va,
      consonanceIndex: frameMetrics.consonanceIndex,
    });
  }

  // Aggregate bodies (average presence/motion across frames)
  const aggregateBodies = averageBodies(perCosmosBodies);

  // Aspects for the aggregate: use the first frame's aspects (they are
  // time-dependent, so no meaningful aggregate).
  const aggregateAspects = frames[0]?.aspects ?? [];

  const metrics = computeHarmoniaMetrics(aggregateBodies, aggregateAspects, scale);
  const modalAffinity = computeModalAffinity(metrics.pcDistribution);

  const influence: Influence = {
    doctrina: doctrinaKey,
    doctrinaName: doctrina.name,
    cosmosCount: cosmosArray.length,
    date: cosmosArray[0]!.date,
    bodies: aggregateBodies,
    aspects: aggregateAspects,
    pcDistribution: metrics.pcDistribution,
    attractors: metrics.attractors,
    consonanceIndex: metrics.consonanceIndex,
    retrogradeCount: metrics.retrogradeCount,
    silentCount: metrics.silentCount,
    modalAffinity,
  };

  if (Array.isArray(input)) {
    influence.frames = frames;
  }

  return influence;
}

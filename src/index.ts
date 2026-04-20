import { getFeast } from "./engines/cal/calendar.js";
import { getChants } from "./engines/chant/chant.js";
import { getPropers } from "./engines/chant/propers.js";
import { getOrdinary } from "./engines/chant/ordinary.js";
import { getHour } from "./engines/chant/hour.js";
import { getPsalm } from "./engines/chant/psalm.js";
import { buildTemper } from "./engines/temper/api.js";
import { buildScore, buildPondus, buildAccentus } from "./engines/score/api.js";
import { getCosmos } from "./engines/planet/planet.js";
import { buildSumma } from "./engines/summa/api.js";
import { buildHarmonia } from "./engines/harmonia/api.js";

import type { FeastQuery, Feast } from "./engines/cal/types.js";
import type {
  CantusQuery, Chant, OrdinaryChant, PropriumQuery,
  OrdinariumQuery, OfficiumQuery, PsalmusQuery,
} from "./engines/chant/types.js";
import type {
  TemperInput, Temper, Tuning, TemperOpts,
  Pitch, PitchInput, Step, Neume, NeumeShape,
  Interval, ModeData, GamutOptions, Tonus, TonusOpts,
} from "./engines/temper/api.js";
import type {
  Score, ScoreOpts, Pondus, PondusInput, Accentus, AccentusInput,
  MidiOpts, TableEmitResult,
} from "./engines/score/api.js";
import type {
  Residue, SummaOpts, Attractor, VowelAttractor,
  NoteRange, ArsisThesisBalance, CadenceDistribution,
} from "./engines/summa/api.js";
import type {
  Influence, HarmoniaOpts, VoicedBody, VoicedAspect,
  Frame, ModalAffinity, Author,
} from "./engines/harmonia/api.js";
import type { Note, Performance, Phrase, Syllable, RestEvent, ParseError, ArsisThesis } from "./engines/score/types.js";
import type { VoicedPitch } from "./engines/harmonia/voice.js";
import type {
  Cosmos, CosmosQuery, Body, BodyName, Aspect,
} from "./engines/planet/types.js";

const tonus = {
  festum: getFeast,
  cantus: getChants,
  proprium: getPropers,
  ordinarium: getOrdinary,
  officium: getHour,
  psalmus: getPsalm,
  temper: buildTemper,
  cantio: buildScore,
  pondus: buildPondus,
  accentus: buildAccentus,
  caelum: getCosmos,
  summa: buildSumma,
  harmonia: buildHarmonia,
};

export default tonus;

export type {
  Feast, FeastQuery,
  Chant, CantusQuery, OrdinaryChant,
  PropriumQuery, OrdinariumQuery, OfficiumQuery, PsalmusQuery,
  Temper, TemperInput, TemperOpts, Tuning,
  Pitch, PitchInput, Step, Neume, NeumeShape,
  Interval, ModeData, GamutOptions, Tonus, TonusOpts,
  Score, ScoreOpts, Pondus, PondusInput, Accentus, AccentusInput,
  MidiOpts, TableEmitResult,
  Note, Performance, Phrase, Syllable, RestEvent, ParseError, ArsisThesis,
  VoicedPitch,
  Cosmos, CosmosQuery, Body, BodyName, Aspect,
  Residue, SummaOpts, Attractor, VowelAttractor,
  NoteRange, ArsisThesisBalance, CadenceDistribution,
  Influence, HarmoniaOpts, VoicedBody, VoicedAspect,
  Frame, ModalAffinity, Author,
};

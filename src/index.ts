import { getFeast } from "./engines/cal/calendar.js";
import { getChants } from "./engines/chant/chant.js";
import { getPropers } from "./engines/chant/propers.js";
import { getOrdinary } from "./engines/chant/ordinary.js";
import { getHour } from "./engines/chant/hour.js";
import { getPsalm } from "./engines/chant/psalm.js";
import { buildTemper } from "./engines/temper/api.js";
import { buildScore, buildPondus, buildAccentus } from "./engines/score/api.js";
import { getCosmos } from "./engines/planet/planet.js";
import { buildHarmonia } from "./engines/harmonia/api.js";

import type { FeastQuery, Feast } from "./engines/cal/types.js";
import type {
  CantusQuery, Chant, OrdinaryChant, PropriumQuery,
  OrdinariumQuery, OfficiumQuery, PsalmusQuery,
} from "./engines/chant/types.js";
import type {
  TemperamentumInput, Temperamentum, Tuning, TemperamentumOpts,
  Pitch, PitchInput, Step, Neume, NeumeShape,
  Interval, ModeData, GamutOptions, Tonus, TonusOpts,
} from "./engines/temper/api.js";
import type {
  Score, ScoreOpts, Pondus, PondusInput, Accentus, AccentusInput,
} from "./engines/score/api.js";
import type { ChantTabulaRow } from "./engines/score/tabula.js";
import type {
  Imprint, Attractor, VowelAttractor, ModalAffinity,
} from "./engines/imprint.js";
import type {
  Prosody, RhythmicProfile, NoteRange, CadenceDistribution,
} from "./engines/score/prosody.js";
import type {
  Harmony, HarmoniaOpts, VoicedBody, VoicedAspect,
  Frame, Author,
} from "./engines/harmonia/api.js";
import type { HarmonyTabulaRow } from "./engines/harmonia/tabula.js";
import type { PlanetVowel } from "./engines/harmonia/data/vowels.js";
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
  temperamentum: buildTemper,
  notatio: buildScore,
  pondus: buildPondus,
  accentus: buildAccentus,
  caelum: getCosmos,
  harmonia: buildHarmonia,
};

export default tonus;

export type {
  Feast, FeastQuery,
  Chant, CantusQuery, OrdinaryChant,
  PropriumQuery, OrdinariumQuery, OfficiumQuery, PsalmusQuery,
  Temperamentum, TemperamentumInput, TemperamentumOpts, Tuning,
  Pitch, PitchInput, Step, Neume, NeumeShape,
  Interval, ModeData, GamutOptions, Tonus, TonusOpts,
  Score, ScoreOpts, Pondus, PondusInput, Accentus, AccentusInput,
  ChantTabulaRow,
  Note, Performance, Phrase, Syllable, RestEvent, ParseError, ArsisThesis,
  VoicedPitch,
  Cosmos, CosmosQuery, Body, BodyName, Aspect,
  Imprint, Attractor, VowelAttractor, ModalAffinity,
  Prosody, RhythmicProfile, NoteRange, CadenceDistribution,
  Harmony, HarmoniaOpts, VoicedBody, VoicedAspect,
  Frame, Author, HarmonyTabulaRow, PlanetVowel,
};

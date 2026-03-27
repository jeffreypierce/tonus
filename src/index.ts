import { getFeast } from "./engines/cal/calendar.js";
import { getChants } from "./engines/chant/chant.js";
import { getPropers } from "./engines/chant/propers.js";
import { getOrdinary } from "./engines/chant/ordinary.js";
import { getHour } from "./engines/chant/hour.js";
import { getPsalm } from "./engines/chant/psalm.js";
import { buildTemper } from "./engines/temper/api.js";
import { buildScore, buildPondus, buildAccentus } from "./engines/score/api.js";
import { getPlanets } from "./engines/planets/planets.js";

import type { FeastQuery, Feast } from "./engines/cal/types.js";
import type {
  CantusQuery, Chant, OrdinaryChant, PropriumQuery,
  OrdinariumQuery, OfficiumQuery, PsalmusQuery,
} from "./engines/chant/types.js";
import type {
  TemperInput, Temper, Tuning, TemperOpts,
  PitchInput, Note, Step, Neume, NeumeShape,
  Interval, ModeData, GamutOptions, Tonus, TonusOpts,
} from "./engines/temper/api.js";
import type {
  Score, ScoreOpts, Pondus, PondusInput, Accentus, AccentusInput,
  MidiOpts, ChantMetrics, TableEmitResult,
} from "./engines/score/api.js";
import type { Phrase, Syllable, RestEvent, ParseError } from "./engines/score/types.js";
import type {
  PlanetarySnapshot, PlanetQuery, Body, BodyName, Aspect,
} from "./engines/planets/types.js";

export type Caelum = PlanetarySnapshot;
export type CaelumQuery = PlanetQuery;

const tonus = {
  festum: getFeast,
  cantus: getChants,
  proprium: getPropers,
  ordinarium: getOrdinary,
  officium: getHour,
  psalmus: getPsalm,
  temper: buildTemper,
  ordo: buildScore,
  pondus: buildPondus,
  accentus: buildAccentus,
  caelum: getPlanets,
};

export default tonus;

export type {
  Feast, FeastQuery,
  Chant, CantusQuery, OrdinaryChant,
  PropriumQuery, OrdinariumQuery, OfficiumQuery, PsalmusQuery,
  Temper, TemperInput, TemperOpts, Tuning,
  PitchInput, Note, Step, Neume, NeumeShape,
  Interval, ModeData, GamutOptions, Tonus, TonusOpts,
  Score, ScoreOpts, Pondus, PondusInput, Accentus, AccentusInput,
  MidiOpts, ChantMetrics, TableEmitResult,
  Phrase, Syllable, RestEvent, ParseError,
  Body, BodyName, Aspect,
};

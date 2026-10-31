import { getFeast, getPascha } from "./engines/cal/calendar.js";
import { getChants, getCorpus } from "./engines/chant/chant.js";
import { getPropers } from "./engines/chant/propers.js";
import { getOrdinary } from "./engines/chant/ordinary.js";
import { getHour } from "./engines/chant/hour.js";
import { getPsalm } from "./engines/chant/psalm.js";
import { buildTemper } from "./engines/temper/api.js";
import { buildScore } from "./engines/score/api.js";
import { inscriptio } from "./engines/score/inscriptio.js";
import { getCensus } from "./engines/census/census.js";

import type { FeastQuery, Feast, Pascha, Season, Grade } from "./engines/cal/types.js";
import type {
  CantusQuery, Chant, OrdinaryChant, PropriumQuery, OrdinariumQuery,
  OfficiumQuery, PsalmusQuery, Corpus, CorpusLedger, CorpusQuery
} from "./engines/chant/types.js";
import type {
  TemperamentumInput, Temperamentum, Tuning, TemperamentumOpts, Pitch,
  PitchInput, Step, Neume, NeumeShape, Interval, ModeData, ModusCadentiae,
  ModusGenus, Modus, TunedNote, GamutOptions, Tonus, TonusOpts
} from "./engines/temper/api.js";
import type {
  Score, ScoreOpts, Knobs, PondusInput, PondusOpts, AccentusInput, AccentusOpts,
  Cadence, Modulation
} from "./engines/score/api.js";

import type {
  Imprint
} from "./engines/imprint.js";
import type {
  Metrics
} from "./engines/score/metrics.js";

const tonus = {
  festum: getFeast,
  pascha: getPascha,
  cantus: getChants,
  corpus: getCorpus,
  proprium: getPropers,
  ordinarium: getOrdinary,
  officium: getHour,
  psalmus: getPsalm,
  temperamentum: buildTemper,
  notatio: buildScore,
  inscriptio,
  census: getCensus,
};

export default tonus;

// ── The appendix ──
// The export law: verbs live on the namespace; return values are plain data;
// the appendix exports canonical constant tables — nothing with a (). A
// function that earns public life earns a thirteenth Latin noun instead.
// A constant is admitted when a caller would otherwise TYPE IT OUT — a mode
// list, an hour list, the valid `by:` values. Those transcriptions drift, and a
// caller's drifted copy fails as wrong answers rather than as an error. Naming
// follows the register rule: a table of Latin values takes a Latin name
// (TEMPORA, "Tempus Adventus"), a table of codes or English keeps English
// (SEASON_LABEL, "Advent"). So the name says which one you are holding.

// cal — the liturgical year
export {
  SEASON_LABEL,  // season code → English name        ("adv" → "Advent")
  TEMPORA,       // season code → Latin name          ("adv" → "Tempus Adventus")
  GRADE_ORDER,   // grade code → rank, low is higher
  GRADUS,        // grade code → Latin name
} from "./engines/cal/types.js";

// chant — the corpus vocabulary
export {
  HORAE,      // the eight canonical hours, Matins first — the order is content
  OFFICIA,    // office code → Latin genus  ("an" → "Antiphona")
  ORDINARIA,  // ordinary code → Latin name ("kyrie" → "Kyrie eleison")
  MODI,       // mode number → Latin name   ("1" → "Modus I")
} from "./engines/chant/types.js";
export { SOURCES } from "./engines/chant/chant.js";  // book code → bibliographic record
export { MISSAE } from "./engines/chant/data/masses.js";  // mass number → Latin name (1 → "Lux et origo")

// temper — modes, tones, cadences
export { MODES } from "./engines/temper/data/modes.js";
export { TONES } from "./engines/temper/data/tones.js";
export type { PsalmTone, Differentia } from "./engines/temper/data/tones.js";
export { CADENTIAE, CADENTIAE_POPULATION } from "./data/cadentiae.js";
export type { CadentiaGenus, CadentiaSpecies } from "./data/cadentiae.js";
// CADENTIA_LABEL glosses every word a cadence's `nomen` can contain — the
// Latin is the name, this is its English, the way SEASON_LABEL sits beside
// TEMPORA.
export { CADENTIA_LABEL } from "./engines/score/cadence.js";

// census — the field groups and the block index. CENSUS_GROUPS keys are the
// valid `by:` values AND the `profile` keys; CENSUS_ORDER holds every censused
// id, so asking whether a chant is in the census stops needing a try/catch.
// CENSUS_DICTIONARIES names the slots of the trigram and cadence groups, which
// are otherwise sixteen anonymous numbers.
export { CENSUS_GROUPS, CENSUS_ORDER, CENSUS_DICTIONARIES } from "./data/census.js";

export type {
  Feast, FeastQuery, Pascha, Season, Grade, Chant, CantusQuery,
  OrdinaryChant, PropriumQuery, OrdinariumQuery, OfficiumQuery, PsalmusQuery,
  Corpus, CorpusLedger, CorpusQuery, Temperamentum, TemperamentumInput,
  TemperamentumOpts, Tuning, Pitch, PitchInput, Step, Neume, NeumeShape,
  Interval, ModeData, ModusCadentiae, ModusGenus, Modus, TunedNote, GamutOptions, Tonus,
  TonusOpts, Score, ScoreOpts, Knobs, PondusInput, PondusOpts, AccentusInput,
  AccentusOpts, Cadence, Modulation, Imprint, Metrics
};

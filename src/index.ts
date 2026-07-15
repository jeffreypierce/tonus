import { getFeast, getPascha } from "./engines/cal/calendar.js";
import { getChants, getCorpus } from "./engines/chant/chant.js";
import { getPropers } from "./engines/chant/propers.js";
import { getOrdinary } from "./engines/chant/ordinary.js";
import { getHour } from "./engines/chant/hour.js";
import { getMatins } from "./engines/chant/matutinum.js";
import { getPsalm } from "./engines/chant/psalm.js";
import { buildTemper } from "./engines/temper/api.js";
import { buildScore } from "./engines/score/api.js";
import { inscriptio } from "./engines/score/inscriptio.js";
import { getCosmos } from "./engines/planet/planet.js";
import { buildHarmonia } from "./engines/harmonia/api.js";

import type { FeastQuery, Feast, Pascha, Season, Grade } from "./engines/cal/types.js";
import type {
  CantusQuery, Chant, OrdinaryChant, PropriumQuery,
  OrdinariumQuery, OfficiumQuery, PsalmusQuery, Rite,
  Corpus, GenusCount, ModeCount, SharedCount,
} from "./engines/chant/types.js";
import type { Matins, Nocturn } from "./engines/chant/matutinum.js";
import type {
  TemperamentumInput, Temperamentum, Tuning, TemperamentumOpts,
  Pitch, PitchInput, Step, Neume, NeumeShape,
  Interval, ModeData, CadenceFigure, Modus, TunedNote, GamutOptions, Tonus, TonusOpts,
} from "./engines/temper/api.js";
import type {
  Score, ScoreOpts, PondusInput, PondusOpts, AccentusInput, AccentusOpts,
  Cadence, CadenceTarget, CadenceApproach, Modulation, FormulaMatch, Formula, FormulaSlot,
} from "./engines/score/api.js";
import type {
  InscriptioOpts, Inscriptio, NoteGeometry, FontSpec, FontSlot, FontEmbed,
} from "./engines/score/inscriptio.js";
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
import type { Note, Performance, Phrase, Syllable, LyricRun, RestEvent, ParseError, ArsisThesis, RhythmicType, CompoundBeat } from "./engines/score/types.js";
import type { VoicedPitch } from "./engines/harmonia/voice.js";
import type {
  Cosmos, CosmosQuery, Body, BodyName, Aspect,
} from "./engines/planet/types.js";

const tonus = {
  festum: getFeast,
  pascha: getPascha,
  cantus: getChants,
  corpus: getCorpus,
  proprium: getPropers,
  ordinarium: getOrdinary,
  officium: getHour,
  matutinum: getMatins,
  psalmus: getPsalm,
  temperamentum: buildTemper,
  notatio: buildScore,
  inscriptio,
  caelum: getCosmos,
  harmonia: buildHarmonia,
};

export default tonus;

// ── The appendix ──
// The export law: verbs live on the namespace; return values are plain data;
// the appendix exports canonical constant tables — nothing with a (). A
// function that earns public life earns a seventeenth Latin noun instead.
export {
  SEASON_LABEL,
  TEMPUS_NAME,
  GRADE_ORDER,
  GRADE_NAME,
} from "./engines/cal/types.js";
export { MODES } from "./engines/temper/data/modes.js";
export { TONES } from "./engines/temper/data/tones.js";
export type { PsalmTone, Differentia } from "./engines/temper/data/tones.js";

export type {
  Feast, FeastQuery, Pascha, Season, Grade,
  Chant, CantusQuery, OrdinaryChant,
  PropriumQuery, OrdinariumQuery, OfficiumQuery, PsalmusQuery, Rite,
  Corpus, GenusCount, ModeCount, SharedCount,
  Matins, Nocturn,
  Temperamentum, TemperamentumInput, TemperamentumOpts, Tuning,
  Pitch, PitchInput, Step, Neume, NeumeShape,
  Interval, ModeData, CadenceFigure, Modus, TunedNote, GamutOptions, Tonus, TonusOpts,
  Score, ScoreOpts, PondusInput, PondusOpts, AccentusInput, AccentusOpts,
  Cadence, CadenceTarget, CadenceApproach, Modulation, FormulaMatch, Formula, FormulaSlot,
  InscriptioOpts, Inscriptio, NoteGeometry, FontSpec, FontSlot, FontEmbed,
  ChantTabulaRow,
  Note, Performance, Phrase, Syllable, LyricRun, RestEvent, ParseError, ArsisThesis,
  RhythmicType, CompoundBeat,
  VoicedPitch,
  Cosmos, CosmosQuery, Body, BodyName, Aspect,
  Imprint, Attractor, VowelAttractor, ModalAffinity,
  Prosody, RhythmicProfile, NoteRange, CadenceDistribution,
  Harmony, HarmoniaOpts, VoicedBody, VoicedAspect,
  Frame, Author, HarmonyTabulaRow, PlanetVowel,
};

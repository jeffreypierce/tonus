// ---------------------------------------------------------------------------
// tonus/corpus — the shelf: what tonus holds, and how to ask for it
// ---------------------------------------------------------------------------
// The repertoire and its vocabulary, separated from the calendar that resolves
// a DAY. `cantus` and `corpus` ask what is on the shelf; `festum`, `proprium`
// and `officium` ask what a day calls for. The two questions have been one
// import since the beginning, which is part of why the shelf reads as though it
// were a property of the calendar.
//
// This entry surfaces four types the root index never exported, each of them a
// value a caller otherwise had to TYPE OUT against a query: ChantSource (the
// book codes `cantus({ source })` accepts), OfficeCode and OrdinaryCode (the
// genus and ordinary codes), and CanonicalHour (what HORAE holds). The appendix
// rule already admits the tables; the types they range over belong beside them.

export { getChants as cantus, getCorpus as corpus, SOURCES } from "./engines/chant/chant.js";

export { HORAE, OFFICIA, ORDINARIA, MODI } from "./engines/chant/types.js";

export type {
  Chant,
  OrdinaryChant,
  CantusQuery,
  CorpusQuery,
  Corpus,
  CorpusLedger,
  CorpusFullCount,
  GenusCount,
  ModeCount,
  SharedCount,
  ChantSource,
  OfficeCode,
  OrdinaryCode,
  CanonicalHour,
} from "./engines/chant/types.js";

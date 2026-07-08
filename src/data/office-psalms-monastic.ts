// office-psalms-monastic.ts — monastic little-hours psalmody
// Extracted from Divinum Officium (Psalterium, [Monastic_]/[Monastic] sections)
// by scripts/extract-office-psalms.mjs
// Generated: 2026-07-08T04:45:29.223Z
// Entries: 18
//
// The Benedictine little-hours psalm distribution. Same shape as OFFICE_PSALMS
// (see office-psalms-roman.ts) but the monastic scheme differs: the little hours are
// weekday-varied across the whole psalter, and Compline is the fixed three
// psalms 4, 90, 133 (vs. the Roman 4, 30, 90, 133).
import type { OfficePsalmEntry } from "./office-psalms-roman.js";

export const OFFICE_PSALMS_MONASTIC: OfficePsalmEntry[] = [
  { hour: "Prima", weekday: 0, festis: false, psalms: [{ psalm: 118, from: 1, to: 8 }, { psalm: 118, from: 9, to: 16 }, { psalm: 118, from: 17, to: 24 }, { psalm: 118, from: 25, to: 32 }] },
  { hour: "Prima", weekday: 1, festis: false, psalms: [{ psalm: 1 }, { psalm: 2 }, { psalm: 6 }] },
  { hour: "Prima", weekday: 2, festis: false, psalms: [{ psalm: 7 }, { psalm: 8 }, { psalm: 9, from: 2, to: 19 }] },
  { hour: "Prima", weekday: 3, festis: false, psalms: [{ psalm: 9, from: 20, to: 39 }, { psalm: 10 }, { psalm: 11 }] },
  { hour: "Prima", weekday: 4, festis: false, psalms: [{ psalm: 12 }, { psalm: 13 }, { psalm: 14 }] },
  { hour: "Prima", weekday: 5, festis: false, psalms: [{ psalm: 15 }, { psalm: 16 }, { psalm: 17, from: 2, to: 25 }] },
  { hour: "Prima", weekday: 6, festis: false, psalms: [{ psalm: 17, from: 26, to: 51 }, { psalm: 18 }, { psalm: 19 }] },
  { hour: "Prima", weekday: null, festis: true, psalms: [{ psalm: 118, from: 1, to: 8 }, { psalm: 118, from: 9, to: 16 }, { psalm: 118, from: 17, to: 24 }, { psalm: 118, from: 25, to: 32 }] },
  { hour: "Tertia", weekday: 0, festis: false, psalms: [{ psalm: 118, from: 33, to: 40 }, { psalm: 118, from: 41, to: 48 }, { psalm: 118, from: 49, to: 56 }] },
  { hour: "Tertia", weekday: 1, festis: false, psalms: [{ psalm: 118, from: 105, to: 112 }, { psalm: 118, from: 113, to: 120 }, { psalm: 118, from: 121, to: 128 }] },
  { hour: "Tertia", weekday: null, festis: false, psalms: [{ psalm: 119 }, { psalm: 120 }, { psalm: 121 }] },
  { hour: "Sexta", weekday: 0, festis: false, psalms: [{ psalm: 118, from: 57, to: 64 }, { psalm: 118, from: 65, to: 72 }, { psalm: 118, from: 73, to: 80 }] },
  { hour: "Sexta", weekday: 1, festis: false, psalms: [{ psalm: 118, from: 129, to: 136 }, { psalm: 118, from: 137, to: 144 }, { psalm: 118, from: 145, to: 152 }] },
  { hour: "Sexta", weekday: null, festis: false, psalms: [{ psalm: 122 }, { psalm: 123 }, { psalm: 124 }] },
  { hour: "Nona", weekday: 0, festis: false, psalms: [{ psalm: 118, from: 81, to: 88 }, { psalm: 118, from: 89, to: 96 }, { psalm: 118, from: 97, to: 104 }] },
  { hour: "Nona", weekday: 1, festis: false, psalms: [{ psalm: 118, from: 153, to: 160 }, { psalm: 118, from: 161, to: 168 }, { psalm: 118, from: 169, to: 176 }] },
  { hour: "Nona", weekday: null, festis: false, psalms: [{ psalm: 125 }, { psalm: 126 }, { psalm: 127 }] },
  { hour: "Completorium", weekday: null, festis: false, psalms: [{ psalm: 4 }, { psalm: 90 }, { psalm: 133 }] }
];

// office-psalms-roman.ts — Roman little-hours psalmody (Prime, Terce, Sext, None, Compline)
// Extracted from Divinum Officium (Psalterium, [Tridentinum] section) by
// scripts/extract-office-psalms.mjs
// Generated: 2026-07-08T04:45:29.223Z
// Entries: 15
//
// The traditional (pre-1911) Roman little-hours psalm distribution. Each entry
// gives the psalm portions for one hour on one weekday (0 = Sunday), or the
// feast set (festis: true, weekday: null). A portion is a whole psalm or an
// inclusive verse range.

export interface OfficePsalmPortion {
  psalm: number;
  from?: number;
  to?: number;
}

export interface OfficePsalmEntry {
  hour: "Prima" | "Tertia" | "Sexta" | "Nona" | "Completorium";
  /** 0–6 (0 = Sunday); null for the feast set or hours with no weekday split. */
  weekday: number | null;
  /** True for the feast (Festis) psalmody. */
  festis: boolean;
  psalms: OfficePsalmPortion[];
}

export const OFFICE_PSALMS: OfficePsalmEntry[] = [
  { hour: "Prima", weekday: 0, festis: false, psalms: [{ psalm: 53 }, { psalm: 117 }, { psalm: 118, from: 1, to: 16 }, { psalm: 118, from: 17, to: 32 }] },
  { hour: "Prima", weekday: 1, festis: false, psalms: [{ psalm: 53 }, { psalm: 23 }, { psalm: 118, from: 1, to: 16 }, { psalm: 118, from: 17, to: 32 }] },
  { hour: "Prima", weekday: 2, festis: false, psalms: [{ psalm: 53 }, { psalm: 24 }, { psalm: 118, from: 1, to: 16 }, { psalm: 118, from: 17, to: 32 }] },
  { hour: "Prima", weekday: 3, festis: false, psalms: [{ psalm: 53 }, { psalm: 25 }, { psalm: 118, from: 1, to: 16 }, { psalm: 118, from: 17, to: 32 }] },
  { hour: "Prima", weekday: 4, festis: false, psalms: [{ psalm: 53 }, { psalm: 22 }, { psalm: 118, from: 1, to: 16 }, { psalm: 118, from: 17, to: 32 }] },
  { hour: "Prima", weekday: 5, festis: false, psalms: [{ psalm: 53 }, { psalm: 21 }, { psalm: 118, from: 1, to: 16 }, { psalm: 118, from: 17, to: 32 }] },
  { hour: "Prima", weekday: 6, festis: false, psalms: [{ psalm: 53 }, { psalm: 118, from: 1, to: 16 }, { psalm: 118, from: 17, to: 32 }] },
  { hour: "Prima", weekday: null, festis: true, psalms: [{ psalm: 53 }, { psalm: 118, from: 1, to: 16 }, { psalm: 118, from: 17, to: 32 }] },
  { hour: "Tertia", weekday: 0, festis: false, psalms: [{ psalm: 118, from: 33, to: 48 }, { psalm: 118, from: 49, to: 64 }, { psalm: 118, from: 65, to: 80 }] },
  { hour: "Tertia", weekday: null, festis: false, psalms: [{ psalm: 118, from: 33, to: 48 }, { psalm: 118, from: 49, to: 64 }, { psalm: 118, from: 65, to: 80 }] },
  { hour: "Sexta", weekday: 0, festis: false, psalms: [{ psalm: 118, from: 81, to: 96 }, { psalm: 118, from: 97, to: 112 }, { psalm: 118, from: 113, to: 128 }] },
  { hour: "Sexta", weekday: null, festis: false, psalms: [{ psalm: 118, from: 81, to: 96 }, { psalm: 118, from: 97, to: 112 }, { psalm: 118, from: 113, to: 128 }] },
  { hour: "Nona", weekday: 0, festis: false, psalms: [{ psalm: 118, from: 129, to: 144 }, { psalm: 118, from: 145, to: 160 }, { psalm: 118, from: 161, to: 176 }] },
  { hour: "Nona", weekday: null, festis: false, psalms: [{ psalm: 118, from: 129, to: 144 }, { psalm: 118, from: 145, to: 160 }, { psalm: 118, from: 161, to: 176 }] },
  { hour: "Completorium", weekday: null, festis: false, psalms: [{ psalm: 4 }, { psalm: 30, from: 2, to: 6 }, { psalm: 90 }, { psalm: 133 }] }
];

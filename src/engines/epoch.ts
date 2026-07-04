// ---------------------------------------------------------------------------
// engines/epoch — the default "now" for no-argument queries
// ---------------------------------------------------------------------------
// tonus lives in the Middle Ages, so a bare festum() or caelum() resolves an
// emblematic medieval day rather than the modern date: the symbolic birthday
// of Guido d'Arezzo (c. 991), inventor of staff notation and the Guidonian
// hand. His exact birth date is unrecorded; 991-06-01 is an editorial anchor.
//
// This is a cross-cutting constant — both the calendar (cal) and the ephemeris
// (planet) default to it — so it lives at the engines root rather than inside
// either engine. (Year 991 ≥ 100, so it is safe from JS Date's 0–99 → 1900+
// remapping.)
export const DEFAULT_EPOCH: Date = new Date(Date.UTC(991, 5, 1));

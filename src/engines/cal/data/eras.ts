// ---------------------------------------------------------------------------
// engines/cal/data/eras — when a feast entered the calendar
// ---------------------------------------------------------------------------
// The shipped calendar is Tridentine, so it carries feasts instituted centuries
// after the repertoire tonus models. This table dates the late arrivals so a
// caller can ask for the day AS OF a chosen year — `festum({ date, before })` —
// and let the temporale or the feria win where a later feast would have taken
// the day.
//
// tonus-corpus keeps shipping every calendar day; nothing is cut from the data.
// This is a VIEW over it. A feast absent from this table is treated as old
// enough to keep, so the table only ever needs the late arrivals.
//
// ── EVERY DATE HERE WANTS A HISTORIAN'S RED PEN ─────────────────────────────
// These are liturgical-historical claims, not measurements. `year` is the date
// of UNIVERSAL observance in the Roman calendar (the point at which the feast
// would displace a feria everywhere), because that is what a day-resolution
// question actually turns on. Where a local observance long predates the
// universal one, `local` records it — several feasts are genuinely medieval in
// one diocese and early-modern in Rome, and which one you want is a judgement
// about what you are modelling, not a fact.
//
// Deliberately NOT listed, though a name-pattern sweep flagged them:
//   · 05-08 In Apparitione S. Michaëlis — the Monte Gargano apparition is 5th c.
//     and the feast early medieval. Old; keep.
//   · 02-01 S. Ignatii Episcopi et Martyris — Ignatius of ANTIOCH, d. c. 107.
//     Not Ignatius Loyola. Keep.
//   · 09-11 Ss. Proti et Hyacinthi — ancient Roman martyrs. Not Hyacinth of
//     Poland (who is listed, at 08-17). Keep.
// Those three are the traps in dating this list by name.
//
// ── KEPT DELIBERATELY, AGAINST THE STRICT READING ───────────────────────────
//   · 08-06 In Transfiguratione Domini — Callixtus III made it universal in 1457,
//     but it is an ancient Eastern feast with local Western observance long
//     before. Old school; keep.
//   · 07-02 In Visitatione BMV — 1389 is Urban VI's UNIVERSAL extension (prayed
//     for the end of the Great Schism). St Bonaventure had already instituted it
//     for the Franciscans in 1263 — genuinely inside a pre-1350 line, so the
//     keep is supported by the record, not only by instinct.
//   · 02-08 S. Joannis de Matha and 11-20 S. Felicis de Valois — the Trinitarian
//     founders, both dead c. 1212–13. Their cult was confirmed late, but the
//     saints and their veneration are medieval. Keep.
// Each of these would come back under a stricter reading of "universal
// observance"; they are out because the feast, not the paperwork, is what a
// singing calendar is modelling.

export interface FeastEra {
  /** Year of universal Roman observance — the year it starts winning days. */
  year: number;
  /** Earlier local/regional observance, where one is well attested. */
  local?: number;
  /** Why the date is what it is, and where it is shaky. */
  note?: string;
}

/**
 * Feast id → when it entered the universal calendar. Ids are the calendar's own
 * (`MM-DD` for the sanctorale, season-relative for the temporale).
 */
export const FEAST_ERAS: Readonly<Record<string, FeastEra>> = Object.freeze({
  // ── Devotional feasts of the Lord and of Our Lady ──────────────────────────
  "Nat2-0": { year: 1721, local: 1530, note: "Holy Name of Jesus; Franciscan/local 16th c." },
  "Epi1-0": { year: 1921, local: 1893, note: "Holy Family; Leo XIII then Benedict XV" },
  "02-11": { year: 1907, note: "Apparition of the Immaculate Virgin (Lourdes)" },
  "Quad5-5": { year: 1727, local: 1423, note: "Seven Sorrows, Friday of Passion week; Cologne 1423" },
  "Pent02-5": { year: 1856, local: 1765, note: "Sacred Heart; Clement XIII grant 1765, Pius IX universal" },
  "07-01": { year: 1849, note: "Precious Blood (Pius IX)" },
  "07-16": { year: 1726, local: 1376, note: "Our Lady of Mount Carmel; Carmelite from c. 1376" },
  "08-22": { year: 1944, note: "Immaculate Heart (Pius XII)" },
  "09-15": { year: 1727, local: 1423, note: "Seven Sorrows (September)" },
  "09-24": { year: 1696, note: "Our Lady of Ransom / de Mercede" },
  "10-02": { year: 1670, local: 1608, note: "Guardian Angels (Clement X)" },
  "10-07": { year: 1716, local: 1573, note: "Rosary; Gregory XIII 1573 after Lepanto, Clement XI universal" },
  "10-11": { year: 1931, note: "Divine Maternity (Pius XI, Ephesus centenary)" },
  "11-21": { year: 1585, local: 1372, note: "Presentation of Our Lady; Avignon papal court 1372" },
  "09-17": { year: 1585, note: "Stigmata of St Francis" },

  // ── Saints venerated after ~1350 ───────────────────────────────────────────
  // Dated by canonization or by entry into the universal calendar, whichever is
  // the later — again, these want checking against the sources.
  "03-04": { year: 1521, note: "Casimir of Poland, d. 1484" },
  "08-17": { year: 1594, note: "Hyacinth of Poland, d. 1257 — cult approved late" },
  "05-05": { year: 1712, note: "Pius V, d. 1572" },
  "10-15": { year: 1622, note: "Teresa of Ávila, d. 1582" },
  "11-24": { year: 1726, note: "John of the Cross, d. 1591" },
  "07-31": { year: 1622, note: "Ignatius Loyola, d. 1556" },
  "12-03": { year: 1622, note: "Francis Xavier, d. 1552" },
  "05-26": { year: 1622, note: "Philip Neri, d. 1595 — id verified against the calendar" },
  "01-29": { year: 1665, note: "Francis de Sales, d. 1622" },
  "07-19": { year: 1737, note: "Vincent de Paul, d. 1660" },
  "08-02": { year: 1839, note: "Alphonsus Liguori, d. 1787" },
  "06-21": { year: 1726, note: "Aloysius Gonzaga, d. 1591" },
  "05-13": { year: 1930, note: "Robert Bellarmine, d. 1621" },
  "04-27": { year: 1925, note: "Peter Canisius, d. 1597" },
  "08-07": { year: 1671, note: "Cajetan, d. 1547" },
  "03-08": { year: 1690, note: "John of God, d. 1550" },
  "07-18": { year: 1746, note: "Camillus de Lellis, d. 1614" },
  "08-27": { year: 1767, note: "Joseph Calasanz, d. 1648" },
  "08-19": { year: 1925, note: "John Eudes, d. 1680" },
  "04-28": { year: 1867, note: "Paul of the Cross, d. 1775" },
  "05-17": { year: 1690, note: "Paschal Baylon, d. 1592" },
  "10-20": { year: 1767, note: "John Cantius, d. 1473" },
  "11-14": { year: 1867, note: "Josaphat, d. 1623" },
  "10-17": { year: 1920, note: "Margaret Mary Alacoque, d. 1690" },
  "01-31": { year: 1934, note: "John Bosco, d. 1888" },
  "02-27": { year: 1920, note: "Gabriel of Our Lady of Sorrows, d. 1862" },
  "09-03": { year: 1954, note: "Pius X, d. 1914" },
  "03-24": { year: 1921, note: "St Gabriel Archangel as a separate feast; the archangel is of course ancient" },
});

/**
 * Was this feast kept by `year`? A feast the table does not mention is treated
 * as old enough — the table lists arrivals, not the whole calendar.
 */
export function feastKeptBy(feastId: string, year: number): boolean {
  const era = FEAST_ERAS[feastId];
  return !era || era.year <= year;
}

/**
 * The same question asked of a LOCAL observance: a feast kept somewhere by
 * `year`, even if Rome had not yet taken it up. Use this when modelling a house
 * rather than the universal calendar.
 */
export function feastKeptLocallyBy(feastId: string, year: number): boolean {
  const era = FEAST_ERAS[feastId];
  if (!era) return true;
  return Math.min(era.year, era.local ?? era.year) <= year;
}

// ---------------------------------------------------------------------------
// engines/cal/data/eras — when a feast entered the calendar
// ---------------------------------------------------------------------------
// The shipped calendar is the Divino Afflatu Roman calendar of c. 1954, so it
// carries feasts instituted centuries after the repertoire tonus models. This
// table dates the late arrivals so a caller can ask for the day AS OF a chosen
// year — `festum({ date, before })` — and let the temporale or the feria win
// where a later feast would have taken the day.
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
 *
 * INTERNAL, ruled 2026-08-04. This table does not join the public appendix and
 * is not re-exported from the index, though it is the last table that could
 * plausibly have. The appendix carries measurements and vocabularies; these are
 * liturgical-historical CLAIMS, and the distinction between `year`
 * (universal Roman observance) and `local` is a judgement about what a caller
 * is modelling rather than a fact about the calendar — see the banner above.
 * Publishing it would invite callers to cite dates tonus is not in a position
 * to defend. The behaviour it drives, `festum({ before })`, is public and
 * documented; the reckoning behind it stays here.
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

  // ── Later medieval and early-modern saints, by canonization ─────────────────
  // The canonization year is a LOWER bound: entry into the universal calendar
  // often came later, so for these the view may keep a feast a little early,
  // never drop it too soon. Sanctorale coverage: every saint canonized after
  // c. 1050 whose year is secure is listed here or above; a saint absent from
  // the table is ancient or early medieval, or not yet dated (and so kept).
  "02-04": { year: 1629, note: "Andrew Corsini, d. 1373" },
  "02-12": { year: 1888, note: "Seven Founders of the Servites" },
  "03-07": { year: 1323, note: "Thomas Aquinas, d. 1274" },
  "03-09": { year: 1608, note: "Frances of Rome, d. 1440" },
  "03-28": { year: 1690, note: "John of Capistrano, d. 1456" },
  "04-02": { year: 1519, note: "Francis of Paola, d. 1507" },
  "04-05": { year: 1455, note: "Vincent Ferrer, d. 1419" },
  "04-24": { year: 1746, note: "Fidelis of Sigmaringen, d. 1622" },
  "04-29": { year: 1253, note: "Peter Martyr of Verona, d. 1252" },
  "04-30": { year: 1461, note: "Catherine of Siena, d. 1380" },
  "05-10": { year: 1523, note: "Antoninus of Florence, d. 1459" },
  "05-15": { year: 1900, note: "John Baptist de la Salle, d. 1719" },
  "05-19": { year: 1313, note: "Peter Celestine, d. 1296" },
  "05-20": { year: 1450, note: "Bernardine of Siena, d. 1444" },
  "05-23": { year: 1881, note: "John Baptist de Rossi, d. 1764" },
  "05-29": { year: 1669, note: "Mary Magdalene de' Pazzi, d. 1607" },
  "06-01": { year: 1807, note: "Angela Merici, d. 1540; universal later still" },
  "06-04": { year: 1807, note: "Francis Caracciolo, d. 1608" },
  "06-06": { year: 1582, note: "Norbert, d. 1134 — cult confirmed late" },
  "06-10": { year: 1250, note: "Margaret of Scotland, d. 1093" },
  "06-12": { year: 1690, note: "John of Sahagún, d. 1479" },
  "06-13": { year: 1232, note: "Anthony of Padua, d. 1231" },
  "06-19": { year: 1737, note: "Juliana Falconieri, d. 1341" },
  "07-05": { year: 1897, note: "Antony Mary Zaccaria, d. 1539" },
  "07-07": { year: 1880, note: "Cyril and Methodius — Leo XIII's universal extension" },
  "07-08": { year: 1625, note: "Elizabeth of Portugal, d. 1336" },
  "07-14": { year: 1482, note: "Bonaventure, d. 1274" },
  "07-15": { year: 1146, note: "Emperor Henry II, d. 1024" },
  "07-20": { year: 1767, note: "Jerome Emiliani, d. 1537" },
  "08-04": { year: 1234, note: "Dominic, d. 1221" },
  "08-09": { year: 1925, note: "John Vianney, d. 1859" },
  "08-12": { year: 1255, note: "Clare of Assisi, d. 1253" },
  "08-21": { year: 1767, note: "Jane Frances de Chantal, d. 1641" },
  "08-23": { year: 1671, note: "Philip Benizi, d. 1285" },
  "08-25": { year: 1297, note: "Louis IX of France, d. 1270" },
  "08-30": { year: 1671, note: "Rose of Lima, d. 1617" },
  "09-02": { year: 1083, note: "Stephen of Hungary, d. 1038" },
  "09-05": { year: 1690, note: "Lawrence Justinian, d. 1456" },
  "09-18": { year: 1767, note: "Joseph of Cupertino, d. 1663" },
  "09-22": { year: 1658, note: "Thomas of Villanova, d. 1555" },
  "10-03": { year: 1925, note: "Thérèse of Lisieux, d. 1897" },
  "10-04": { year: 1228, note: "Francis of Assisi, d. 1226" },
  "10-08": { year: 1391, note: "Bridget of Sweden, d. 1373" },
  "10-09": { year: 1938, note: "John Leonardi, d. 1609" },
  "10-10": { year: 1671, note: "Francis Borgia, d. 1572" },
  "10-13": { year: 1161, note: "Edward the Confessor, d. 1066" },
  "10-16": { year: 1267, note: "Hedwig of Silesia, d. 1243" },
  "10-19": { year: 1669, note: "Peter of Alcántara, d. 1562" },
  "11-04": { year: 1610, note: "Charles Borromeo, d. 1584" },
  "11-10": { year: 1712, note: "Andrew Avellino, d. 1608" },
  "11-13": { year: 1588, note: "Didacus of Alcalá, d. 1463" },
  "11-15": { year: 1931, note: "Albert the Great, d. 1280" },
  "11-19": { year: 1235, note: "Elizabeth of Hungary, d. 1231" },
  "12-29": { year: 1173, note: "Thomas Becket, d. 1170" },
  "01-23": { year: 1601, note: "Raymond of Peñafort, d. 1275" },
  "01-28": { year: 1628, note: "Peter Nolasco, d. 1256" },

  // ── Later feasts of the temporale ──────────────────────────────────────────
  // Their octave days go with them. The displaced observance is not in the
  // data (the ferias and the plain Sunday these feasts replaced), so the view
  // can leave such a day empty — the honest answer the view gives elsewhere.
  "Pent01-0": { year: 1334, note: "Trinity Sunday; John XXII. Kept locally from the 10th–11th c." },
  "Pent01-4": { year: 1264, local: 1246, note: "Corpus Christi; Urban IV's bull, effective after 1317. Liège 1246" },
  "Pent01-5": { year: 1264, note: "within the octave of Corpus Christi" },
  "Pent01-6": { year: 1264, note: "within the octave of Corpus Christi" },
  "Pent02-1": { year: 1264, note: "within the octave of Corpus Christi" },
  "Pent02-2": { year: 1264, note: "within the octave of Corpus Christi" },
  "Pent02-3": { year: 1264, note: "within the octave of Corpus Christi" },
  "Pent02-4": { year: 1264, note: "octave day of Corpus Christi" },
  "Pent02-6": { year: 1929, note: "within the octave of the Sacred Heart (Pius XI)" },
  "Pent03-1": { year: 1929, note: "within the octave of the Sacred Heart (Pius XI)" },
  "Pent03-2": { year: 1929, note: "within the octave of the Sacred Heart (Pius XI)" },
  "Pent03-3": { year: 1929, note: "within the octave of the Sacred Heart (Pius XI)" },
  "Pent03-4": { year: 1929, note: "within the octave of the Sacred Heart (Pius XI)" },
  "Pent03-5": { year: 1929, note: "octave day of the Sacred Heart (Pius XI)" },
  "Pasc2-3": { year: 1847, note: "Patrocinium of St Joseph (Pius IX), on the 3rd Sunday after Easter until Pius X moved it to this Wednesday" },
  "Pasc2-4": { year: 1911, note: "within the octave of the Patrocinium (Pius X)" },
  "Pasc2-5": { year: 1911, note: "within the octave of the Patrocinium (Pius X)" },
  "Pasc2-6": { year: 1911, note: "within the octave of the Patrocinium (Pius X)" },
  "Pasc3-1": { year: 1911, note: "within the octave of the Patrocinium (Pius X)" },
  "Pasc3-2": { year: 1911, note: "within the octave of the Patrocinium (Pius X)" },
  "Pasc3-3": { year: 1911, note: "octave day of the Patrocinium (Pius X)" },
});

/**
 * Was this feast kept by `year`? A feast the table does not mention is treated
 * as old enough — the table lists arrivals, not the whole calendar.
 */
export function feastKeptBy(feastId: string, year: number): boolean {
  const era = FEAST_ERAS[feastId];
  return !era || era.year <= year;
}

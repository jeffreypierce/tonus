# Liturgical & Latin Review

A review of tonus's liturgical content and Latin usage against the standard the
project aims for: fidelity to medieval Latin-rite practice, honestly sourced.
Conducted July 2026 against v0.1.0.

## Verdict

The system is coherent, well-sourced, and — after the ritus restoration
described below — uses rank vocabulary that is genuinely continuous with
medieval usage. Its one structural honesty requirement: the calendar is not a
*medieval* calendar but the **Tridentine Roman calendar (1570–1962)** as
digitized by the Divinum Officium project. That calendar is substantially
continuous with late-medieval Roman usage — its temporale, its rank system,
and most of its sanctorale are medieval inheritances — but it is a
post-medieval codification and includes feasts instituted as late as the
1950s. Documentation should say so plainly, and now does.

## 1. Calendar era

- **Source**: Divinum Officium (`horas/Latin/Sancti`, `Tempora`), the digital
  1570–1962 Roman Missal and Breviary. Both sanctorale (283 fixed feasts) and
  temporale (358 movable entries) are present, resolved against dual-computus
  Easter anchors.
- **Medieval continuity**: the temporale structure (Advent through the season
  after Pentecost, including pre-Lenten **Septuagesima**), the eight-hour
  office cursus, and the duplex/semiduplex/simplex rank system are all
  medieval in origin. A 13th-century cleric would recognize the shape of this
  calendar immediately.
- **Post-medieval content**: the sanctorale includes feasts with no medieval
  existence — Queenship of Mary (1954), Immaculate Heart (1944), Motherhood
  of Mary (1931), among others. These are kept: pruning them would break the
  DO data's integrity and require per-feast historical adjudication. Instead,
  the README and this document state the calendar's actual era. Per-feast era
  metadata (medieval / tridentine / modern) is noted as future work.
- **Computus**: `pascha()` uses the Gregorian (Gauss/Butcher) algorithm from
  1583 and a Julian computus with JDN conversion before that. This is
  historically correct behavior for date queries reaching into the medieval
  period, and better than most liturgical software manages.

## 2. Feast ranks — restored

The original extraction flattened DO's rank strings to a 1–4 scale labeled
with **1969 Novus Ordo vocabulary** ("Solemnity", "Memorial") — the single
loudest anachronism in the system, since the underlying data uses the
medieval-descended classification. Fixed in v0.1.0:

- Every calendar entry now carries **`ritus`**: the authentic rank string
  from the *default* (Tridentine) DO rank line — `Duplex majus`, `Semiduplex`,
  `Feria privilegiata`, `Duplex I classis cum Octava privilegiata I ordinis`.
  19 distinct values, 642/642 coverage. The 1960-rubric variants are used
  neither for names nor ranks nor ritus — the 1960 rubrics rename feasts and
  abolish octaves, which this project's medieval orientation avoids.
- `rank: 1–4` remains as the machine-sortable scale (it drives filtering and
  kyriale mass selection), now labeled with period vocabulary
  (`Duplex I classis` … `Simplex`) instead of Solemnity/Feast/Memorial.
- DO's hand-edited inconsistencies were normalized to consistent Latin in the
  extractor (English strays like "2nd class" → "II classis"; octave privilege
  grades unified as *I/II/III ordinis*), without collapsing real distinctions.

## 3. Chant corpus era

The corpora are modern Solesmes restorations, not medieval manuscripts:

| Corpus | Book | Era of edition |
| --- | --- | --- |
| gr | Graduale Romanum, Solesmes | 1961 |
| lu | Liber Usualis, Solesmes | 20th c. |
| la | Liber Antiphonarius, Solesmes | 1960 |
| lh | Liber Hymnarius, Solesmes | 1983 |

This is the right practical choice — the Solesmes books are the only
comprehensive machine-readable representation of the Gregorian repertoire —
but it means the melodies reflect the Solesmes restoration's editorial
judgments, not any single medieval source. (A Hildegard von Bingen corpus —
the one medieval-composer collection — was removed pending the author's own
critical edition; the extraction pipeline can restore it.) The rhythm
model (arsis/thesis, documented in `docs/theory/solesmes-rhythm.md`) is
likewise the Solesmes school's — a 19th–20th-century interpretive framework,
scholarly but not itself medieval.

## 4. Latin usage audit

### Public API (after the v0.1.0 renames)

| Term | Verdict |
| --- | --- |
| `festum`, `cantus`, `proprium`, `ordinarium`, `officium`, `psalmus`, `harmonia` | Correct, idiomatic liturgical/musical Latin. |
| `temperamentum` | Correct; classical root of "temperament." (Renamed from English `temper`.) |
| `notatio` | Correct for a notation-derived score object. (Renamed from `cantio`, which collided semantically with `cantus`.) |
| `caelum` | Correct ("the heavens"). Internal engine name `planet`/`Cosmos` is English by project convention (internals English, public Latin). |
| `pondus` (notatio option) | Repurposed: classical "weight," used for articulation weighting. A deliberate artistic coinage, documented as such. |
| `accentus` (notatio option) | Repurposed: historically the accentus/concentus distinction separates spoken-style from melodic chant. Here it names a phrasing-style profile — adjacent to, but not identical with, the historical sense. Deliberate; documented. |
| `ritus` / `gradus` | Disambiguated in v0.1.0: `Feast.ritus` carries the feast rank (the rubrics' own term — "festa ritus duplicis"), while `gradus` is reserved for the Guidonian step (`Temperamentum.gradus()`). One word per concept. |

### Music-theory vocabulary (verified correct)

- **Modes**: Protus/Deuterus/Tritus/Tetrardus with authenticus/plagalis,
  Greek alias names, finalis/tenor/ambitus — standard medieval theory.
- **Gamut**: Gammaut through Elami with correct Guidonian compound names and
  UT–LA solmization; hexachordum durum/naturale/molle.
- **Neumes**: punctum, pes, clivis, torculus, porrectus, scandicus, salicus,
  climacus, plus resupinus/flexus/subpunctis compounds, quilisma, strophicus
  — standard Solesmes nomenclature.
- **Psalm tones**: 8 modes plus **tonus peregrinus**, with intonation, flex,
  mediant, and differentiae — correct.
- **Planets**: Sol, Luna, Mercurius, Venus, Mars, Iuppiter (correct classical
  -uu- spelling), Saturnus.

### Orthography

Calendar feast names use the **æ ligature** consistently (193 occurrences,
zero digraph exceptions) — inherited from Divinum Officium. Chant texts use
the **"ae" digraph** — inherited from GregoBase, and not alterable without
desynchronizing lyrics from their GABC neume alignment. This cross-corpus
difference is cosmetic, source-faithful, and accepted.

## 5. Cosmological model

The harmonia engine implements **musica universalis** on late-antique
authority: four doctrinae (Pythagoras, Boethius — the default and the
medieval standard —, Pliny, Ptolemy) with ratios derived in
`docs/theory/doctrines.md` from primary texts via Joscelyn Godwin's syntheses
(*Harmonies of Heaven and Earth* 1987, *The Harmony of the Spheres* 1993).
Planetary vowels follow Nicomachus's Moon→Saturn ordering of the seven Greek
vowels (Godwin, *The Mystery of the Seven Vowels*, 1991). The geocentric,
Sun-at-mese framing is period-correct for the medieval reception of this
material. One scholarly caveat, noted for future work: the Pliny chromatic
reconstruction and the Ptolemy Canobus assignments rest on Godwin's
secondary readings; a specialist pass against the primary editions would
strengthen them.

The planet engine beneath it is deliberately anachronistic in the other
direction — a real ephemeris (JPL Keplerian elements, Standish 1992/DE430)
feeding the historical doctrines. This two-layer design (accurate sky,
period voicing) is an artistic decision, and a good one; the docs present it
as such.

## 6. Recommendations

1. **Done in v0.1.0**: ritus restoration; period rank labels; API Latin
   renames; era honesty in README.
2. **Future**: per-feast era metadata (medieval/tridentine/modern);
   Sarum use and monastic (Benedictine) cursus as alternate calendars;
   Kepler and Ficino doctrinae; primary-source verification pass on Pliny
   and Ptolemy ratios.

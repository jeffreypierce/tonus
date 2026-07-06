# Plan 4 — Latin/English Register Doctrine (EXECUTED 2026-07-02)

## Addendum (same day): dignitas → grade/ritus

Jeffrey applied the doctrine to the rank family: `dignitas: "duplex-i"` was
a machine code under a Latin key — a rule violation. Resolution (his):
**`grade`** (English key, code union, was `dignitas`) pairs with **`ritus`**
(Latin key, verbatim authentic carrier), mirroring `season`/`tempus`.
The doctrine's final statement: *every domain family = one English-keyed
machine code + one Latin-keyed authentic Latin carrier.* Canonical grade
names ("Triduum Sacrum" …) live in the exported `GRADE_NAMES` map. Renames:
`Dignitas`→`Grade`, `DIGNITAS_ORDER`→`GRADE_ORDER`, `ritusToDignitas`→
`ritusToGrade`, `dignitasOrder`/`compareDignitas`→`gradeOrder`/`compareGrade`,
`Feast.dignitas`/`FeastQuery.dignitas`→`grade`. Reference maps + grade
helpers are now re-exported from `src/index.ts`. Bonus: English `grade` vs
Latin `gradus` (Guidonian step) — the doctrine enforces the disambiguation.
Read `dignitas` below as historical record.

## The doctrine (Jeffrey's formulation)

**The language of a key tells you the register of its value.**

- **Latin field → authentic Latin content**: `nomen`, `ritus`, `dignitas`,
  `tempus`, `genus`, `modus`, `ordinarium`, `incipit`, `differentia`,
  `tabula`, `pondus`, `accentus`, `hora`, `intonatio`/`mediatio`/`terminatio`.
- **English field → machine code or datum**: `season: "adv"`, `mode: "1"`,
  `office: "an"`, `date`, `masses`, `velocity`, `midi`, `hz`.
- **Pairs** where both registers exist: `season`/`tempus`, `mode`/`modus`,
  `office`/`genus`, `ordinary`/`ordinarium`, `name`/`nomen` (Body).
- **English display strings live in exported maps** (`SEASON_LABELS`), not
  on objects. No `xLabel` fields remain.
- **The astronomy layer stays modern English** by design (accurate sky,
  period voicing). Do not Latinize the machine register.

Documented in `docs/index.md` (Conventions) and `STANDARDS.md` (Naming).

## Renames executed (all tests green, 255/255, UTC + Tokyo + LA)

| Before | After | Notes |
| --- | --- | --- |
| `Feast.name` / `FeastQuery.name` | `nomen` | Latin content; matches Body's pattern |
| `Feast.seasonLabel` | `Feast.tempus` | now the Latin name ("Tempus Adventus"); English via `SEASON_LABELS` |
| — | `TEMPUS_NAMES` map | new, cal/types.ts; æ orthography matches DO names |
| `Chant.officeLabel` | `Chant.genus` | values were already Latin ("Antiphona") |
| `Chant.modeLabel` | `Chant.modus` | values now Latin ("Modus I"…; "Tonus Peregrinus" for P) |
| `OrdinaryChant.ordinaryLabel` | `ordinarium` | values already Latin ("Kyrie eleison") |
| `OfficiumQuery.hour` | `hora` | values were already Latin |
| `PsalmusQuery.intonation` | `intonatio` | |
| `Tonus.{intonation,mediant,termination}` | `{intonatio,mediatio,terminatio}` | kills "mediant" false-friend with tonal theory |

Engine internals stay English per STANDARDS (tones.ts data, intone.ts, local
variables) — the doctrine governs the public surface only.

## Phase-2 — EXECUTED (same day)

- `ModeData.name` → `nomen` ("Protus Authenticus"); `ModeData.family` →
  `maneria` ("Protus" — the medieval term for the four mode families).
  `alias` ("dorian") stays: English key, modern-English value.
- `Interval.name` → `nomen` ("Quinta"); `alias` ("Diapente") stays.
- `Step.compound` → `nomen` ("Delasolre"); `Step.name` ("d") stays — letter
  code. `ChantTabulaRow.fullName` → `nomen` to match.
- `Harmony.doctrinaName` → `auctor` (pairs with the `doctrina` code; kills
  the camelCase Latin-English hybrid).
- Doctrine refinement recorded: the rule polices STRING content fields;
  naturalized terms of art holding numeric data (`tenor: 9`, `ambitus.span`,
  `final`) are technical identifiers, not violations. Internal structures
  (e.g. score `ChantMeta`) stay English per STANDARDS.
- Still open: `VoicedBody.greekName` ("mese") — Greek register, arguably
  its own rule; left as-is deliberately.

## Ripple effects outside this repo (flagged, not done)

- **GitHub Pages demo** reads `name`, `seasonLabel`, `officeLabel`, etc. —
  update when regenerated.
- **orreliquum-core** (`docs/tonus.md` there) documents the tonus API —
  needs a sync pass for nomen/tempus/genus/modus/ordinarium/hora/dignitas.

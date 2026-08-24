// ---------------------------------------------------------------------------
// engines/score/emitters/moderna — modern round-note transcription
// ---------------------------------------------------------------------------
// The moderna species: the chant transcribed to a modern 5-line staff with
// round noteheads, engraved slurs, and a treble-8 clef. A DISTINCT rendering
// from quadrata (svg.ts) with its own spacing pass — square notation clusters a
// neume near zero advance, but round heads need ~1.3 head-widths of air, so the
// two views cannot share one x-pass (design: notatio-moderna, "duae species").
//
// This is a faithful port of the locked reference `working/moderna-generator.py`
// (Lomer transcription practice, Vendome deltas): stemless black noteheads, one
// engraved slur per figure (strophic runs merged), small heads for liquescents,
// noteheadHalf for the double mora, the medRenQuilismaCMN squiggle fused before
// its head, augmentation dots for the mora, divisio ticks/bars by kind, centred
// floating hyphens. The generator's constants are its spec and are reproduced
// here verbatim.
//
// It returns the same { svg, geometry } contract as quadrata, so downstream
// tracks and inscriptio treat both species uniformly.
import { GLYPHS, GLYPH_UPM } from "../../../data/smufl-glyphs.js";
import { fontFaceCss, lyricMarkup } from "./svg.js";
import { trimRuns } from "../lyric.js";
import { decideBreak } from "./breaking.js";
import type { LyricRun } from "../types.js";
import {
  computeAccidentals, type AccidentalMode, type AccidentalMark,
} from "./accidentals.js";
import type { NoteGeometry, SvgResult, SvgOpts } from "./svg.js";
import type { ChantTabulaRow } from "../tabula.js";
import type { Chant } from "../../chant/types.js";
import { buildChironomia, buildProsodia, buildTonarium, trackBands, type TrackNote } from "./tracks.js";

// ── Bravura moderna glyph codepoints (baked in smufl-glyphs.json) ──
const G = {
  gClef8vb: "E052",
  noteheadHalf: "E0A3",
  noteheadBlack: "E0A4",
  augmentationDot: "E1E7",
  quilisma: "EA20",       // medRenQuilismaCMN
  accidentalFlat: "E260",
  accidentalNatural: "E261",
  accidentalSharp: "E262",
};

// The staff holds nine written diatonic slots — bottom line E4 to top line F5
// — which under the transposing gClef8vb sounds E3–F4, MIDI 52–65.
const STAFF_LO = 52;
const STAFF_HI = 65;

/**
 * How many octaves to lift the written notes so the chant sits on the staff.
 *
 * ONE clef, always: moderna draws a gClef8vb and nothing else. What floats is
 * the written octave, the same move the orreliquum hand already makes when it
 * lifts a chant by whole octaves onto the gamut's fingers.
 *
 * It earns its place going DOWN, which is the direction chant is transposed:
 * the corpus already sounds below this staff (median 50–62 against 52–65), so
 * a transposition of −4 puts 43.6% of all notes below the bottom line, some
 * four ledger lines deep. Choosing the octave takes that to 15.8%. Upward it
 * changes little, because chant does not sit high to begin with.
 *
 * Whole octaves only, and the same lift for the whole chant: shifting by
 * anything else would respell the music, and shifting per-phrase would make
 * one page read in two registers.
 *
 * The honest limit: an 8vb clef already says "sounds an octave lower", so a
 * further lift understates the true pitch with nothing on the page confessing
 * it. That is the accepted cost of keeping one clef; `notatio`'s `spn` remains
 * the authority on what actually sounds.
 */
function pickOctaveLift(rows: ChantTabulaRow[]): number {
  const midis = rows.map((r) => r.midi).filter((m): m is number => typeof m === "number");
  if (midis.length === 0) return 0;
  let best = 0;
  let fewest = Infinity;
  // Nearest first, so a tie keeps the chant where it was written.
  for (const lift of [0, 1, -1]) {
    const shifted = lift * 12;
    const off = midis.filter((m) => m + shifted < STAFF_LO || m + shifted > STAFF_HI).length;
    if (off < fewest) { fewest = off; best = lift; }
  }
  return best;
}

// ── geometry, as a function of the staff ──────────────────────────────────
//
// THE CONTRACT (ruled 2026-08-04): `staffHeight` is the height of the STAFF
// ITSELF — top line to bottom line — and means the same thing in both species.
// Quadrata's four lines and moderna's five then occupy the same band, which is
// what "the same size" means when the two sit on one page: the eye reads the
// block of staff, not the gap between its lines.
//
// Moderna was engraved against a fixed 7.4px space (`MSP_1` below, from
// moderna-generator.py) and read no option at all — measured, a request of 30,
// 40 or 60 left it at 7.4 every time while quadrata moved 10 → 13.3 → 20. Two
// species that could not be brought to one size by anything a caller passed.
//
// The fix has to happen BEFORE layout, not after it. Scaling the finished SVG
// looks right in isolation and fails in a page: it scales the width too, so a
// wider render is shrunk further by whatever `max-width` the host applies, and
// the two species land at different on-screen sizes again. (Measured: post-
// scaling moderna to span 40 pushed its width 1016 → 1373, and the site's
// column shrank it straight back to 26px against quadrata's 36.)
//
// So every constant derives from the space, and the space derives from the
// requested staff height. `metrics()` is that derivation, computed once per
// render and threaded through the helpers that draw.
const MSP_1 = 7.4;                     // the engraved staff space
const SCALE_1 = (MSP_1 * 4) / 1000;    // SMuFL: 1 em = 4 spaces
const MTOP_1 = 20;                     // top staff line, system-local
// Per-note advance inside a melisma — the DENSITY dial, and the number that
// decides how much music fills a line.
//
// 12.8 was the engraved value: 1.47x the notehead, generous modern spacing.
// Against quadrata's ~6px it meant the same chant took twice the systems, and
// a reader comparing the two species saw one of them looking half the size —
// which is what the eye actually reads, more than the staff block does.
//
// Ruled 2026-08-04: the species answer to one DENSITY, near enough that a line
// of one holds about as much music as a line of the other. Not identically —
// round noteheads need air where quadrata's squares can abut, and 8.4 (a true
// match) read as cramped. 10.4 keeps the air and still fits a chant in about
// the same number of systems.
const ADV_1 = 11.6;
const SYL_GAP_1 = 9.5;                   // gap after each syllable
// Staff bottom → lyric baseline. NOT scaled with the staff: the duae species
// share one lyric setting (ruled 2026-07-29), and that ruling is about type,
// which sits at its own size. Scaling it with the staff broke the parity the
// moment moderna's staff started moving.
const LYRIC_GAP = 28;
const SYSTEM_GAP_DEFAULT = 24;

/** The staff height both species answer to when the caller names none. */
const DEFAULT_STAFF_HEIGHT = 40;

/** Moderna's engraved span: five lines, four spaces. */
const MODERNA_SPAN_1 = 4 * MSP_1;

/** Every geometric constant, derived from the requested staff height. */
export interface ModernaMetrics {
  /** Staff space — the distance between two lines. */
  MSP: number;
  /** SMuFL glyph scale: 1 em = 4 staff spaces. */
  SCALE: number;
  /** Top staff line, system-local. */
  MTOP: number;
  /** noteheadBlack advance. */
  NH_W: number;
  /** Per-note advance inside a melisma. */
  ADV: number;
  /** Gap after each syllable. */
  SYL_GAP: number;
  /** Lyric baseline, system-local. */
  LYRIC_Y: number;
  /** The factor against the engraved metrics — 1 at the default. */
  k: number;
}

/**
 * Moderna's metrics for a requested staff height.
 *
 * Everything scales together, so the engraving's internal relationships —
 * notehead to staff, slur to notehead, lyric to baseline — hold at any size;
 * they were drawn as a set and stay one.
 */
export function metrics(staffHeight?: number): ModernaMetrics {
  // `staffHeight` scales the engraving as a whole. Moderna keeps its own
  // proportions — a five-line staff at its engraved space — rather than
  // forcing its span onto quadrata's four-line block: matching the SPANS made
  // moderna render wider than the caller asked for (1155px for a requested
  // 900), so a host applying `max-width` shrank it further and the two species
  // landed at different on-screen sizes again. What a reader compares is how
  // much music fills a line, and that is the note advance, not the staff.
  const k = (staffHeight ?? DEFAULT_STAFF_HEIGHT) / DEFAULT_STAFF_HEIGHT;
  const MSP = MSP_1 * k;
  const SCALE = (MSP * 4) / 1000;
  const MTOP = MTOP_1 * k;
  return {
    MSP,
    SCALE,
    MTOP,
    NH_W: 295 * SCALE,
    ADV: ADV_1 * k,
    SYL_GAP: SYL_GAP_1 * k,
    LYRIC_Y: MTOP + 4 * MSP + LYRIC_GAP,
    k,
  };
}

const LETTERS: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Written y for a scientific pitch name on the treble-8 staff (bottom line
 * written E4, sounding E3).
 *
 * `spn` is a SOUNDING pitch; the gClef8vb this species draws transposes, so the
 * note is WRITTEN an octave above where it sounds. Hence the `+ 1` below:
 * sounding G3 is written G4 and sits on the second line, where mode VII's final
 * belongs. The reference generator folded that lift into a short reference term
 * (`4 * 7` against a note term carrying `+2`) because it was fed pitches an
 * octave below today's corpus; the two errors cancelled. Stated once, plainly,
 * both halves now agree — and the chant lands on the staff instead of a sixth
 * above it.
 *
 * `lift` is the further whole-octave shift `pickOctaveLift` chose for this
 * chant, so a low or downward-transposed piece is written where it can be read
 * rather than on a stack of ledger lines.
 *
 * The ACCIDENTAL is read but never changes the slot: a flat and its natural
 * share one line (B-flat sits on the B line), which is why the letter alone
 * fixes `steps`. It is returned separately so the caller can draw the sign.
 * Discarding it was a silent wrong pitch — under transposition `Ab3` and `A3`
 * landed on the same slot with nothing to tell them apart.
 */
function writtenY(
  spn: string, systemY: number, gm: ModernaMetrics, lift = 0,
): { y: number; steps: number; accidental: -1 | 0 | 1 } {
  const m = /([A-G])([#b]?)(-?\d)/.exec(spn);
  if (!m) return { y: systemY + gm.MTOP + 4 * gm.MSP, steps: 0, accidental: 0 };
  const accidental = m[2] === "b" ? -1 : m[2] === "#" ? 1 : 0;
  const written = Number(m[3]) + 1 + lift; // the 8vb clef writes an octave up
  const di = (written + 2) * 7 + LETTERS[m[1]!]!;
  const steps = di - ((4 + 2) * 7 + LETTERS["E"]!); // relative to bottom line E4
  return {
    y: systemY + gm.MTOP + 4 * gm.MSP - steps * (gm.MSP / 2),
    steps,
    accidental,
  };
}

// Moderna's ink, as a CSS custom property with the house default as fallback —
// the same three properties quadrata emits, so one stylesheet themes both
// species. Every mark here is one colour, so a module constant does the job a
// threaded parameter would; `theme.colors.note` overrides it through
// `resolveInk` below.
//
// Until now these were 17 literal "#111"s and moderna ignored `noteColor`
// outright — so a caller theming the note colour saw quadrata change and
// moderna not.
let INK = "var(--tonus-note, #111)";
let RUBRICA = "var(--tonus-rubrica, #9E2B25)";

/** Set the module ink from resolved options. Called once per render. */
function resolveInk(options: SvgOpts): void {
  INK = `var(--tonus-note, ${options.noteColor ?? "#111"})`;
  RUBRICA = `var(--tonus-rubrica, ${options.rubricaColor ?? "#9E2B25"})`;
}

function glyph(name: string, x: number, y: number, scale: number): string {
  const g = GLYPHS[name];
  if (!g) return "";
  return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})">` +
    `<path d="${g.path}" fill="${INK}"/></g>`;
}

/** A glyph carrying an SVG class (so downstream tracks / tests can select it). */
function classedGlyph(cls: string, name: string, x: number, y: number, scale: number): string {
  const g = GLYPHS[name];
  if (!g) return "";
  return `<g class="${cls}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})">` +
    `<path d="${g.path}" fill="${INK}"/></g>`;
}

// The notehead is drawn at 0.825 of its engraved size. Only the GLYPH
// shrinks: advance still comes from NH_W and ADV, so the spacing — and
// therefore every x in the geometry — is exactly what it was. Bravura's black
// notehead is drawn for a five-line orchestral staff, and against chant's
// wider spacing and single melodic line it reads heavy; reduced, the note is a
// mark on the staff rather than a blot. Three quarters proved too far — the
// head lost the staff line it sits on — so this is that, opened back up a
// tenth.
const HEAD_K = 0.825;

/** Which head a written shape takes in the modern transcription.
 *
 * ONLY the double mora takes an open head. The square notation's other shapes
 * — inclinatum, virga, quilisma, oriscus — are written distinctions, not
 * durational ones, and moderna transcribes them all as the plain black head
 * the modern staff means by "a note".
 *
 * This briefly mapped inclinatum to a half note, on the reasoning that the
 * ambitus figure uses that shape to mark a mode's tenor. That confused a
 * DIAGRAM's private vocabulary with the notation's: an inclinatum is about a
 * tenth of every note in the corpus, so that share of every transcribed chant
 * came out hollow, each one implying a length it does not have.
 */
function notehead(
  x: number, y: number, small: boolean, half: boolean,
  gm: ModernaMetrics,
): string {
  const s = gm.SCALE * (small ? 0.68 : 1.0) * HEAD_K;
  // Centred on the ADVANCE, not on the shrunken glyph: the note has to sit
  // where the engraving puts it, not drift left as the head gets smaller.
  const w = 295 * gm.SCALE * (small ? 0.68 : 1.0);
  const code = half ? G.noteheadHalf : G.noteheadBlack;
  // The whole note is a wider glyph (422 units against 295), so it is centred
  // on its OWN width — otherwise it would hang right of its advance.
  const own = (GLYPHS[code]?.advance ?? 295) * s;
  // Classed `note`, as quadrata's heads are. The class is the contract a
  // caller selects on — the site rings and reddens the chosen note through it
  // — and moderna emitted its heads bare, so nothing downstream could find
  // them and selection did nothing in the modern transcription.
  return classedGlyph("note", code, x - own / 2, y, s);
}

function clef(x: number, systemY: number, gm: ModernaMetrics): string {
  return glyph(G.gClef8vb, x, systemY + gm.MTOP + 3 * gm.MSP, gm.SCALE);
}

function moraDots(x: number, y: number, onLine: boolean, gm: ModernaMetrics): string {
  const dy = onLine ? -gm.MSP / 2 : 0;
  return glyph(G.augmentationDot, x + 6.4, y + dy, gm.SCALE);
}

// The engraved slur: a filled two-cubic shape tapered to points, belly ~1.55.
function slur(x0: number, y0: number, x1: number, ytop: number): string {
  const span = x1 - x0;
  const h = Math.min(3.8 + span * 0.075, 8.6);
  const a0 = y0 - 4.7;
  const co = ytop - 4.7 - h;      // outer control height
  const ci = co + 1.55;           // inner control height (belly thickness)
  const c0x = x0 + span * 0.30;
  const c1x = x1 - span * 0.30;
  return `<path class="slur" d="M ${x0.toFixed(2)} ${a0.toFixed(2)} ` +
    `C ${c0x.toFixed(2)} ${co.toFixed(2)} ${c1x.toFixed(2)} ${co.toFixed(2)} ${x1.toFixed(2)} ${a0.toFixed(2)} ` +
    `C ${c1x.toFixed(2)} ${ci.toFixed(2)} ${c0x.toFixed(2)} ${ci.toFixed(2)} ${x0.toFixed(2)} ${a0.toFixed(2)} Z" fill="${INK}"/>`;
}

function quilismaMark(x: number, y: number, gm: ModernaMetrics): string {
  const s = gm.SCALE * 0.92;
  const w = 416 * s;
  return glyph(G.quilisma, x - gm.NH_W / 2 - w - 1.2, y + 149 * s, s);
}

// Accidental glyph scale (matches quadrata's noteScale * 0.62 factor).

const ACC_GAP = 1.2; // trailing air between accidental and notehead (as quilisma)

/** Horizontal room an accidental glyph reserves left of the notehead. */
function accidentalWidth(code: string, gm: ModernaMetrics): number {
  const g = GLYPHS[code];
  if (!g) return 0;
  return g.advance * (gm.SCALE * 0.62) + ACC_GAP;
}

/** Draw a standard/HEJI accidental glyph left of the notehead at (x, y). */
function accidentalMark(x: number, y: number, code: string, gm: ModernaMetrics): string {
  return classedGlyph("accidental", code, x - gm.NH_W / 2 - accidentalWidth(code, gm), y, (gm.SCALE * 0.62));
}

/**
 * The short lines that carry a notehead outside the five, as quadrata's
 * `ledger` does: one per LINE position the note has passed, not one per step.
 *
 * `steps` counts diatonic slots up from the bottom line, so the staff occupies
 * 0–8 and its lines are the even positions. A note at 10 gets a ledger at 10;
 * at 11 (a space above that) it still gets only the one at 10. Below, the same
 * downward: -1 draws nothing, -2 draws at -2.
 *
 * Rendered wider than the head by a quarter of its width on each side, the
 * proportion quadrata uses, so the line reads as staff rather than as a tick.
 */
function ledgerLines(steps: number, mx: number, systemY: number, gm: ModernaMetrics): string[] {
  if (steps >= 0 && steps <= 8) return [];
  const half = gm.NH_W / 2 + gm.NH_W * 0.25;
  const out: string[] = [];
  const emit = (lp: number): void => {
    const ly = systemY + gm.MTOP + 4 * gm.MSP - lp * (gm.MSP / 2);
    out.push(
      `<line class="ledger" x1="${(mx - half).toFixed(2)}" y1="${ly.toFixed(2)}" ` +
      `x2="${(mx + half).toFixed(2)}" y2="${ly.toFixed(2)}" ` +
      `stroke="${INK}" stroke-width="0.7"/>`,
    );
  };
  for (let lp = 10; lp <= steps; lp += 2) emit(lp);
  for (let lp = -2; lp >= steps; lp -= 2) emit(lp);
  return out;
}

const DIV_KIND: Record<string, string> = {
  "`": "tick", ",": "tick", ";": "half", ":": "full", "::": "double",
};

function divisioMark(x: number, kind: string, top: number, final: boolean, gm: ModernaMetrics): string {
  const bot = top + 4 * gm.MSP;
  if (kind === "tick")
    return `<line class="divisio" x1="${x.toFixed(2)}" y1="${top - 7}" x2="${x.toFixed(2)}" y2="${top - 1}" stroke="${INK}" stroke-width="0.9"/>`;
  if (kind === "half")
    return `<line class="divisio" x1="${x.toFixed(2)}" y1="${top + gm.MSP}" x2="${x.toFixed(2)}" y2="${top + 3 * gm.MSP}" stroke="${INK}" stroke-width="0.9"/>`;
  if (kind === "full")
    return `<line class="divisio" x1="${x.toFixed(2)}" y1="${top}" x2="${x.toFixed(2)}" y2="${bot}" stroke="${INK}" stroke-width="0.9"/>`;
  if (final)
    return `<line class="divisio" x1="${(x - 3.6).toFixed(2)}" y1="${top}" x2="${(x - 3.6).toFixed(2)}" y2="${bot}" stroke="${INK}" stroke-width="0.9"/>` +
      `<line class="divisio" x1="${x.toFixed(2)}" y1="${top}" x2="${x.toFixed(2)}" y2="${bot}" stroke="${INK}" stroke-width="2.2"/>`;
  return `<line class="divisio" x1="${(x - 3.2).toFixed(2)}" y1="${top}" x2="${(x - 3.2).toFixed(2)}" y2="${bot}" stroke="${INK}" stroke-width="0.9"/>` +
    `<line class="divisio" x1="${x.toFixed(2)}" y1="${top}" x2="${x.toFixed(2)}" y2="${bot}" stroke="${INK}" stroke-width="0.9"/>`;
}

function textW(s: string): number {
  return s.replace(/-/g, "").length * 6.7 + 2;
}

// Lyric text arrives pre-decoded (the parser strips GABC markup into `runs`);
// the display trim here only clears syllable-joining hyphens and edge space.
const stripLyric = (s: string): string =>
  s.replace(/^-+/, "").replace(/-+$/, "").trim();

type Row = ChantTabulaRow;

/**
 * Render the tabula as moderna. Multi-system when `width` is set; single system
 * otherwise. Returns the shared { svg, geometry } contract.
 */
export function toModerna(rows: Row[], chant: Chant, options: SvgOpts = {}): SvgResult {
  // The fonts option's lyric slot applies here too; moderna keeps its own
  // engraved defaults for everything else. References only — never bundled.
  const lyricSlot = options.fonts?.lyric;
  const lyricFace = !lyricSlot
    ? "'Crimson Pro', Georgia, serif"
    : typeof lyricSlot === "string" ? lyricSlot : lyricSlot.family;
  const lyricWeight = typeof lyricSlot === "object" && lyricSlot.weight != null
    ? lyricSlot.weight
    : 518;
  const lyricScale = typeof lyricSlot === "object" && lyricSlot.scale != null
    ? lyricSlot.scale
    : 1;
  const lyricEmbed = typeof lyricSlot === "object" && lyricSlot.embed
    ? fontFaceCss([{ family: lyricFace, weight: lyricWeight, scale: 1, embed: lyricSlot.embed }])
    : "";
  // Every geometric constant for this render, derived from the requested staff
  // height. Built once and passed to the helpers that draw — see metrics().
  resolveInk(options);
  const gm = metrics(options.staffHeight);

  const padding = options.padding ?? 14;
  const width = options.width ?? null;
  const systemGap = options.systemGap ?? SYSTEM_GAP_DEFAULT;
  // A requested track band widens every system by its reserved room. Moderna's
  // tracks scale with the staff they annotate — gm.k is 1 at the default.
  const bands = trackBands(options.tracks, gm.k);
  const systemHeight = gm.LYRIC_Y + 24 + bands.extra + systemGap;

  // Intonation channel: precompute each row's accidental/cents mark once (the
  // repeat-suppression and heji guard live in the engine), keyed by identity.
  const accMode: AccidentalMode = options.accidentals ?? "standard";
  const marks = computeAccidentals(rows, accMode, options.centsBaseline ?? "pythagorean");
  const markByRow = new Map<Row, AccidentalMark>();
  rows.forEach((row, i) => { const m = marks[i]; if (m) markByRow.set(row, m); });

  // One lift for the whole chant, chosen before any note is placed — a page
  // that changed register partway would read as two pieces.
  const lift = pickOctaveLift(rows);

  // The pitches an engine-computed sign already accounts for. `degreeSpn` is
  // the mark's own statement of which pitch it alters, so this is the engine
  // speaking rather than a second guess at its scoping rules — the spelled
  // path below stays silent wherever a written sign has already spoken.
  const alteredSpns = new Set<string>();
  for (const m of marks) if (m?.kind === "glyph" && m.degreeSpn) alteredSpns.add(m.degreeSpn);

  // ── Front matter ── The same official display quadrata sets (title centered
  // over the score, the genus/mode mark stacked at the left margin — the
  // `annotation: "auto"` params), honoured here so both species open a piece
  // the same way. No dropcap: tonus scores skip the illuminated capital (it
  // conflicts with the analysis-track layouts).
  const titleFace = options.fonts?.title;
  const faceOf = (slot: typeof titleFace): string =>
    !slot ? lyricFace : typeof slot === "string" ? slot : slot.family;
  const weightOf = (slot: typeof titleFace): number | null =>
    typeof slot === "object" && slot.weight != null ? slot.weight : null;
  // NO MARGIN MARK, AND NO INITIAL. The genus/mode stack and the illuminated
  // capital are quadrata's — they belong to the chant book, and moderna is a
  // transcription onto a modern staff, which is read as an edition rather than
  // as a page from the Liber. Moderna also carries the analysis tracks, and a
  // left column reserved for a cap fights the bands they draw.
  //
  // `annotation` and `dropcap` are therefore IGNORED here, not refused: a
  // species ignores options that do not apply to it (see inscriptio.ts), so
  // one call can render either species without the caller stripping options.
  const titleSize = 22;
  let headerY = 0;
  let titleBaseline = 0;
  if (options.title) {
    titleBaseline = titleSize;
    headerY += titleSize * 1.4;
  }

  const body: string[] = [];
  const slurs: string[] = [];
  // Ledger lines, collected as the notes are placed but emitted with the STAFF
  // — they are staff, continuing it for one note, and must lie behind the
  // notehead rather than cross it. `staff` is joined before `body` below.
  const ledgers: string[] = [];
  const lyricSvgs: string[] = [];
  const lyricRuns: Array<{
    x: number; systemY: number; text: string; spans?: LyricRun[]; wordStart: boolean;
  }> = [];
  const placements: Array<{ row: Row; x: number; y: number; system: number; systemY: number }> = [];
  const systemMaxX: number[] = [];

  let system = 0;
  // Cents mode floats labels ABOVE the top staff line; pad the first system
  // down so the staggered upper row doesn't clip the viewBox. The front-matter
  // band pushes every system down by its height.
  const topPad = (accMode === "cents" ? 12 : 0) + headerY;
  let systemY = topPad;
  // Every system reserves the same clef zone — the clef glyph at x=10 runs
  // ~30px wide, and continuation systems once reset to padding+4, printing
  // their first notes through it.
  const CLEF_ZONE = 32;
  let x = padding + CLEF_ZONE;
  const clefSvgs: string[] = [clef(10, topPad, gm)];

  // The floating cents band dodges its own collisions: two rows above the
  // staff, greedy — a label crowding the last one on the low row steps up.
  const CENTS_SIZE = 10;
  const CENTS_MIN_GAP = 32; // a "−21.5" at 10px runs ~28px
  const centsRowX: [number, number] = [-Infinity, -Infinity];

  // Group rows into syllables (contiguous phrase+syllable index).
  const sylKeys: string[] = [];
  const bySyl = new Map<string, Row[]>();
  for (const r of rows) {
    const k = `${r.phraseIndex}.${r.syllableIndex}`;
    if (!bySyl.has(k)) { bySyl.set(k, []); sylKeys.push(k); }
    bySyl.get(k)!.push(r);
  }

    // Width of a syllable and the gap that follows it — moderna's unit of
    // advance, and the only measuring this emitter owes the break decision.
    const sylWidth = (key: string): number => {
      const rows = bySyl.get(key) ?? [];
      return rows.length * gm.ADV + gm.SYL_GAP;
    };

    const breakBefore = (k: string, si: number): boolean => {
      // Moderna breaks BETWEEN SYLLABLES, a finer granularity than quadrata's
      // divisio, so the measurement is exact rather than statistical: the
      // syllable's own notes at their own advance, plus its trailing gap.
      //
      // The rules governing the decision — `z` forces, `<nlba>` seals, a seal
      // yields to the page, the boundary is never overrun — live in breaking.ts
      // and are shared with quadrata. Only the measuring is moderna's own.
      if (width == null) return false;
      const srows = bySyl.get(k) ?? [];
      const head = srows[0];
      if (!head) return false;

      // The sealed run from here to the close of its `<nlba>` group. Measured
      // whole because admitting the head alone seals every seam after it, and
      // the line could then no longer break at all.
      let sealedRun = sylWidth(k);
      for (let m = si + 1; m < sylKeys.length; m++) {
        const mr = bySyl.get(sylKeys[m]!) ?? [];
        if (!mr[0]?.keepWithPrev) break;
        sealedRun += sylWidth(sylKeys[m]!);
      }

      return decideBreak({
        next: head,
        x,
        boundary: width - padding,
        need: sealedRun,
        sealedRun,
        lineStart: padding + CLEF_ZONE,
      }).break;
    };

  for (let si = 0; si < sylKeys.length; si++) {
    const k = sylKeys[si]!;
    const srows = bySyl.get(k)!;

    // The engraver's own break (GABC `z`), which outranks the fit test — see
    // the note in svg.ts. A sealed seam cannot suppress it: `z` is an
    // instruction, not a preference.
    const forced = si > 0 && srows[0]!.lineBreak;
    if (si > 0 && (forced || breakBefore(k, si))) {
      systemMaxX.push(x + padding);
      system++;
      systemY += systemHeight;
      x = padding + CLEF_ZONE;
      centsRowX[0] = centsRowX[1] = -Infinity;
      clefSvgs.push(clef(10, systemY, gm));
    }

    // Display form: trimmed styled runs when markup rides, else the trimmed
    // plain string — one derivation for measuring and drawing.
    const spans = srows[0]!.runs ? trimRuns(srows[0]!.runs!) : undefined;
    const lyr = spans ? spans.map((s) => s.text).join("") : stripLyric(srows[0]!.lyric ?? "");

    // Note x-positions within the syllable.
    let nx = x + gm.NH_W / 2 + 1;
    const notePos: Array<{ mx: number; my: number; steps: number; spelled: string | null }> = [];
    for (const r of srows) {
      if (r.quilisma) nx += 9.6;      // room for the fused squiggle
      const mk = markByRow.get(r);
      if (mk?.kind === "glyph") nx += accidentalWidth(mk.glyph!, gm); // room for the accidental
      const { y, steps, accidental } = writtenY(r.spn, systemY, gm, lift);
      // A sign the SPELLING demands. `computeAccidentals` speaks for the marks
      // written in the GABC (`accidentalSource: "explicit"`); a transposed
      // score carries its accidentals in `spn` alone, where nothing was ever
      // written, so those would otherwise go undrawn and the note would read a
      // semitone off with no sign to say so.
      //
      // The guard is `alteredSpns`, NOT this row's own `mk`. A written sign is
      // carried by the note BEFORE the one it governs — on gregobase:1180 the
      // three signs sit on rows 27/39/62 and their B-flats on 31/40/66, wholly
      // disjoint — so asking "does this row carry a mark?" says no on the very
      // note the sign already covers, and drew a second glyph for each.
      const spelled = accidental !== 0 && !alteredSpns.has(r.spn)
        ? (accidental === -1 ? G.accidentalFlat : G.accidentalSharp)
        : null;
      if (spelled) nx += accidentalWidth(spelled, gm);
      notePos.push({ mx: nx, my: y, steps, spelled });
      nx += gm.ADV + 4.6 * r.mora;
    }
    const notesW = nx - x - gm.ADV + gm.NH_W / 2 + 2;
    const sylW = Math.max(notesW, textW(lyr));

    // Draw notes.
    srows.forEach((r, i) => {
      const { mx, my, steps, spelled } = notePos[i]!;
      const onLine = steps % 2 === 0;
      ledgers.push(...ledgerLines(steps, mx, systemY, gm));
      if (r.quilisma) body.push(quilismaMark(mx, my, gm));
      const mk = markByRow.get(r);
      if (mk?.kind === "glyph") {
        // Vertically the sign belongs to the pitch it alters, not to the note
        // it was written before; horizontally it stays at this note's column.
        const ay = mk.degreeSpn ? writtenY(mk.degreeSpn, systemY, gm, lift).y : my;
        body.push(accidentalMark(mx, ay, mk.glyph!, gm));
      }
      // A spelled accidental alters THIS note, so it sits on this note's line.
      else if (spelled) body.push(accidentalMark(mx, my, spelled, gm));
      else if (mk?.kind === "cents") {
        // Cents labels float in a band above the staff (not glued to the
        // head) — an analytic overlay, not an engraving mark.
        const bandRow = mx - centsRowX[0] >= CENTS_MIN_GAP ? 0 : 1;
        centsRowX[bandRow] = mx;
        body.push(
          `<text class="cents" x="${mx.toFixed(2)}" y="${(systemY + gm.MTOP - 10 - bandRow * 10).toFixed(2)}" ` +
          `text-anchor="middle" font-size="${CENTS_SIZE}" fill="#666" ` +
          `font-family="'Crimson Pro', Georgia, serif">${esc(mk.label ?? "")}</text>`,
        );
      }
      body.push(notehead(mx, my, r.liquescent, r.mora === 2, gm));
      if (r.mora === 1) body.push(moraDots(mx, my, onLine, gm));
      placements.push({ row: r, x: mx, y: my, system, systemY });
    });

    // Slurs per figure; strophic runs on the same pitch merge into one.
    const figs: Row[][] = [];
    let curG = -1;
    for (const r of srows) {
      if (r.neumeGroup !== curG) { figs.push([]); curG = r.neumeGroup; }
      figs[figs.length - 1]!.push(r);
    }
    const merged: Row[][] = [];
    for (const fg of figs) {
      const prev = merged[merged.length - 1];
      if (prev && fg.every((q) => q.strophicus) && prev.every((q) => q.strophicus) &&
          fg[0]!.spn === prev[prev.length - 1]!.spn) {
        prev.push(...fg);
      } else merged.push(fg);
    }
    for (const fg of merged) {
      if (fg.length > 1) {
        const idxs = fg.map((r) => srows.indexOf(r));
        const ytop = Math.min(...idxs.map((i) => notePos[i]!.my));
        slurs.push(slur(notePos[idxs[0]!]!.mx, notePos[idxs[0]!]!.my, notePos[idxs[idxs.length - 1]!]!.mx, ytop));
      }
    }

    // Lyric — collected here, emitted (with centred hyphens between same-word
    // syllables, matching quadrata's Vendôme practice) after the walk.
    const tx = notePos[0]!.mx - gm.NH_W / 2;
    if (lyr) {
      lyricRuns.push({ x: tx, systemY, text: lyr, spans, wordStart: srows[0]!.wordStart });
    }

    x += sylW + gm.SYL_GAP;

    // Divisio at a phrase end.
    const last = srows[srows.length - 1]!;
    const nextK = si + 1 < sylKeys.length ? sylKeys[si + 1]! : null;
    const nextPhrase = nextK ? Number(nextK.split(".")[0]) : -1;
    if (last.divisio && (nextK === null || nextPhrase !== last.phraseIndex)) {
      const kind = DIV_KIND[last.divisio] ?? "full";
      const pad = { tick: 2, half: 5, full: 7, double: 9 }[kind] ?? 7;
      const isFinal = nextK === null;
      body.push(divisioMark(x + pad - 4, kind, systemY + gm.MTOP, isFinal, gm));
      x += pad + 8;
    }
  }

  systemMaxX.push(x + padding);
    // The canvas is what the CALLER asked for, not what the content happened to
    // reach. Width was `max(systemMaxX)` in both species, so a render of a
    // requested 900 came out 915, 986, 1074, 1203 — whatever the widest system
    // ended at. A host applying `max-width: 100%` then shrank each render by a
    // different factor, which is why the same page showed one chant's notation
    // a third smaller than another's, and why the two species never agreed:
    // measured across fourteen graduals, moderna landed between 0.66 and 0.95
    // of quadrata's on-screen size with no pattern a reader could learn.
    //
    // `width` is the wrap point, and now also the canvas. Content still wraps
    // inside it; it no longer decides how big the picture is. Without a width
    // there is nothing to wrap to and the content still sets the size.
  const contentW = Math.ceil(Math.max(...systemMaxX));
  // The requested width — see the matching note in svg.ts.
  const W = width != null ? Math.ceil(width) : contentW;
  const height = Math.ceil(systemY + gm.LYRIC_Y + 24 + bands.extra);

  // ── The analysis tracks, below each system ──
  // Downstream of the notation: they consume the placements (the same anchors
  // the geometry contract exports), never the transcription's own ink.
  if (bands.prosodia || bands.chironomia || bands.tonarium) {
    const trackNotes: TrackNote[] = placements.map((pl) => ({
      row: pl.row, x: pl.x, y: pl.y, system: pl.system, systemY: pl.systemY,
      // Moderna centres its noteheads on the anchor, so the ink edges are
      // derived; quadrata's square glyphs start at the anchor and are
      // measured as they are placed, so it records them.
      inkLeft: pl.x - gm.NH_W / 2, inkRight: pl.x + gm.NH_W / 2,
    }));
    if (bands.prosodia) {
      body.push(buildProsodia(trackNotes, {
        k: gm.k,
        laneTop: gm.LYRIC_Y + bands.prosodia.top,
        rightFor: (s) => (systemMaxX[s] ?? W) - padding,
        rubricaColor: RUBRICA,
      }));
    }
    if (bands.chironomia) {
      // The wave's constants are calibrated at quadrata's default staff
      // interval, near enough to moderna's fixed staff space to read at k: 1.
      body.push(buildChironomia(trackNotes, {
        k: gm.k,
        waveMidY: gm.LYRIC_Y + bands.chironomia.top + 33 * gm.k,
      }));
    }
    if (bands.tonarium) {
      body.push(buildTonarium(trackNotes, options.trackData ?? { cadences: [], modulations: [] }, {
        k: gm.k,
        laneTop: gm.LYRIC_Y + bands.tonarium.top + 26 * gm.k,
        rightFor: (s) => (systemMaxX[s] ?? W) - padding,
        serifFamily: lyricFace,
        rubricaColor: RUBRICA,
      }));
    }
  }

  // Staff lines: five per system.
  const staff: string[] = [];
  for (let s = 0; s <= system; s++) {
    const sysY = s * systemHeight + topPad;
    const right = (systemMaxX[s] ?? W) - padding;
    for (let i = 0; i < 5; i++) {
      const ly = sysY + gm.MTOP + i * gm.MSP;
      staff.push(`<line x1="4" y1="${ly.toFixed(2)}" x2="${right.toFixed(2)}" y2="${ly.toFixed(2)}" stroke="${INK}" stroke-width="0.7"/>`);
    }
  }

  const svgTitle = chant.incipit ? `<title>${esc(chant.incipit)}</title>` : "";

  // Second pass: lyric texts, with a centred hyphen in the gap between
  // syllables of one word when both sit in the same system.
  const lyricSize = 15 * lyricScale;
  const rubricaColor = RUBRICA;
  const estW = (t: string): number => t.length * lyricSize * 0.52;
  for (let k = 0; k < lyricRuns.length; k++) {
    const run = lyricRuns[k]!;
    lyricSvgs.push(
      `<text class="lyric" x="${run.x.toFixed(2)}" y="${(run.systemY + gm.LYRIC_Y).toFixed(2)}" ` +
      `font-size="${lyricSize.toFixed(1)}" ` +
      `font-weight="${lyricWeight}" fill="${INK}" font-family="${esc(lyricFace)}">${lyricMarkup(run.spans, run.text, rubricaColor)}</text>`,
    );
    const next = lyricRuns[k + 1];
    const hyphen = (hx: number): void => {
      lyricSvgs.push(
        `<text class="lyric hyphen" x="${hx.toFixed(2)}" y="${(run.systemY + gm.LYRIC_Y).toFixed(2)}" ` +
        `text-anchor="middle" font-size="${lyricSize.toFixed(1)}" ` +
        `font-weight="${lyricWeight}" fill="${INK}" font-family="${esc(lyricFace)}">-</text>`,
      );
    };
    if (next && !next.wordStart && next.systemY === run.systemY) {
      const thisRight = run.x + estW(run.text);
      if (next.x - thisRight > lyricSize * 0.25) hyphen((thisRight + next.x) / 2);
    } else if (next && !next.wordStart) {
      // A word carried to the next system takes its hyphen at the line's end —
      // the same bug as quadrata's, and the same fix. The gap rule above cannot
      // see this case: there is no gap between the halves, there is a break.
      hyphen(run.x + estW(run.text) + lyricSize * 0.3);
    }
  }

  // Front-matter text, deferred so the title centers on the final width.
  const header: string[] = [];
  if (options.title) {
    header.push(
      `<text class="title" x="${(W / 2).toFixed(2)}" y="${titleBaseline.toFixed(2)}" ` +
      `text-anchor="middle" font-family="${esc(faceOf(titleFace))}"` +
      `${weightOf(titleFace) != null ? ` font-weight="${weightOf(titleFace)}"` : ""} ` +
      `font-size="${titleSize}" fill="${INK}">${esc(options.title)}</text>`,
    );
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${height}" ` +
    `width="${W}" height="${height}" class="tonus-chant moderna">${svgTitle}` +
    lyricEmbed +
    header.join("") +
    staff.join("") + ledgers.join("") + clefSvgs.join("") + body.join("") + slurs.join("") + lyricSvgs.join("") +
    `</svg>`;

  const geometry: NoteGeometry[] = placements.map((pl) => ({
    phraseIndex: pl.row.phraseIndex,
    syllableIndex: pl.row.syllableIndex,
    neumeGroup: pl.row.neumeGroup,
    noteIndex: pl.row.noteIndex,
    neumeIndex: pl.row.neumeIndex,
    system: pl.system,
    x: Number(pl.x.toFixed(2)),
    y: Number(pl.y.toFixed(2)),
    // Derived, not measured: moderna centres its noteheads on the anchor, so
    // the ink straddles it evenly. The track mapping above derives them the
    // same way, from the same number.
    inkLeft: Number((pl.x - gm.NH_W / 2).toFixed(2)),
    inkRight: Number((pl.x + gm.NH_W / 2).toFixed(2)),
    systemY: Number(pl.systemY.toFixed(2)),
  }));

  return { svg, geometry };
}

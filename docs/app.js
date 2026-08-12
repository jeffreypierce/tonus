// ---------------------------------------------------------------------------
// docs/app — a little chant analysis toy
// ---------------------------------------------------------------------------
// Two views over one state, each a 50/50 split: the subject on the left, a
// tabbed panel of readings on the right.
//
//   CALENDARIUM  a day — what is sung, and the sky over it
//   CANTICUM     a chant — the score, and what the theory makes of it
//
// SELECTION PROPAGATES, which is the whole interaction model. There are three
// selections — a day, a chant, and a note within it — and every panel is a
// function of them. Click an anchor on the year and the day moves. Click a
// chant and Canticum has it. Click a note and the monochord, the hand and the
// tables all move to it, because geometry[i] and tabula[i] are the same note
// by contract.
//
// The whole library ships. Nothing is baked: every feast, chant, pitch, planet
// and census is computed here, in the browser, when it is asked for.

import tonus from "./dist/index.js";
import { el, tabs, tabPanel } from "./components/tabs.js";
import { dateDial, syncDateDial } from "./components/dial.js";
import { chantList } from "./components/chant-row.js";
import { CENSUS_NOMEN, censusPanel, censusHeadline, censusDiesPanel,
  censusDiesHeadline } from "./diagrams/census.js";
import { keySpur, marks, popover } from "./components/key.js";
import { annulus, annulusTabula } from "./diagrams/annulus.js";
import { chordaDual, chordaTabula, chordaRows } from "./diagrams/chorda.js";
import { hand, handTabula, handRows } from "./diagrams/hand.js";
import { mutatio } from "./diagrams/mutatio.js";
import { rota, rotaTabula, rotaAspectTabula } from "./diagrams/rota.js";
import { middleOf } from "./diagrams/notehead.js";

const EPOCH = new Date(Date.UTC(991, 5, 1));   // the library's own default day

// The chant Canticum opens on: Agnus Dei I, from the Kyriale. Short enough to
// read whole, mode 4, and its two b's put the hexachord apparatus to work on
// first sight — which is what the right-hand column is for.
const DEFAULT_CANTUS = "gregobase:2977";

const state = {
  view: "calendarium",
  day: EPOCH,
  chant: null,
  score: null,
  note: null,
  // which offices are shown — see OFFICES_SHOWN below, spelled out here
  // because `state` is built before that list exists
  offices: ["proprium", "ordinarium", "matutinum", "laudes", "vesperae"],
  right: { calendarium: "harmonia", canticum: "temperamentum" },
  // the few settings the toy carries
  notation: "quadrata",
  tracks: ["chironomia"],
  // Which hexachord the hand is read by. It FOLLOWS the selection — opening a
  // chant or picking a note on the ring sets it — and the picker can override
  // it. One value, two ways in, so the control always reads what is drawn.
  hexachord: "naturale",
  // The ORDO: the reading route on the hand — its dashes and its arrows,
  // which are one mark and switch together. On, because the order the gamut
  // is learned in is what a hand teaches; off leaves the twenty places and
  // the five digits, and the knuckle line runs the whole way across to make
  // up for it.
  route: true,
  // The hand read an OCTAVE UP. Most of the corpus is written low against the
  // gamut — Agnus Dei I runs midi 43-52, the bottom fifth of a hand that
  // reaches to 90 — so a chant read straight lands on the thumb and stays
  // there. Raising it is what a cantor does anyway: the gamut names degrees,
  // and a choir sings them where its voices lie.
  octave: 0,
  // The temperament is one number: how much of the syntonic comma comes off
  // each fifth. 0 is Pythagorean, 1/11 is (audibly) equal, 1/4 buys the pure
  // major third. A named list of six could not say that they are one family.
  comma: 0,
  // A pitch chosen in the theory column — a degree of the scale, not a note of
  // the chant. Kept apart from `note` because they answer different questions
  // and choosing one has to release the other.
  pitch: null,
  aspects: true,
  // The Sun is the mese, the middle string the rest are reckoned from — so
  // the wheel opens on it rather than on whatever sorted first.
  body: "Sun",
  doctrina: "boethius",
};

// Who says which sphere sounds what. Four schemes, each from its own text.
const DOCTRINAE = ["pythagoras", "boethius", "pliny", "ptolemy"];

// The library keys two of the four by their English names, and the keys stay —
// they are the API. What the READER sees is the Latin the other two already
// wear: plinius and ptolemaeus, not an exonym in a Latin control row.
const DOCTRINA_NOMEN = { pliny: "plinius", ptolemy: "ptolemaeus" };

// The three kinds of hexachord, by the b each reads: the round one, neither,
// the square one.
const HEXACHORDA = ["molle", "naturale", "durum"];

// ── the offices a day can be read by ──
// The Mass twice, then the Office hour by hour. The hours are listed
// separately because they are separately sung: asking for "the Office" on
// Christmas returns about a hundred and seventy chants, of which thirty-five
// are Prime's psalm antiphons — one list, and the day's Mass disappears into
// it. A reader wants Lauds OR Compline, so each hour is its own toggle.
const OFFICES = [
  { key: "proprium", name: "Proprium", of: (f) => tonus.proprium({ feast: f }) },
  { key: "ordinarium", name: "Ordinarium", of: (f) => tonus.ordinarium({ feast: f }) },
  ...[
    ["matutinum", "Matutinum"], ["laudes", "Laudes"], ["vesperae", "Vesperae"],
  ].map(([hora, name]) => ({
    key: hora, name, of: (f) => tonus.officium({ feast: f, hora }),
  })),
];

// The whole surface is shown at once — the three sung hours are small enough
// together that a day opens complete. The little hours are omitted rather
// than defaulted off: Prime and Compline are thirty-five psalm antiphons
// apiece, the same psalter every day, and they drown the day's own music.
const OFFICES_SHOWN = OFFICES.map((o) => o.key);

// The temperaments as ONE axis: the fraction of the syntonic comma taken off
// each fifth. They are not six unrelated tunings but points on a continuum,
// which a dropdown of names actively hides — and the interesting places are
// between the names as much as on them.
//
// The detents are the historical stops, in order along the axis: pure fifths
// at 0, then the regular meantones, each named for what it buys. 1/11 is
// where the fifth lands on 700¢ — equal temperament, arrived at rather than
// declared, which is the honest way to show that ET is a meantone too.
// Each is named by its comma fraction and what that fraction IS — the thing a
// reader is choosing between. The old labels carried a theorist's name beside
// each ("Zarlino", "Silbermann"), which said who rather than what.
const COMMAS = [
  { value: 0, name: "0", gloss: "Pythagorean" },
  { value: 1 / 11, name: "1/11", gloss: "near ET" },
  { value: 1 / 6, name: "1/6", gloss: "meantone" },
  { value: 1 / 5, name: "1/5", gloss: "meantone" },
  { value: 1 / 4, name: "1/4", gloss: "meantone" },
  { value: 2 / 7, name: "2/7", gloss: "meantone" },
  { value: 1 / 3, name: "1/3", gloss: "meantone" },
];
const COMMA_MAX = 1 / 3;
// The slider's resolution — a division OF the range rather than a round
// decimal, so the far end lands on 1/3 exactly. (0.0005 stopped at 0.333, a
// third of a step short, and the last detent could never be reached.)
//
// It is also the tolerance for "is it ON a detent": a stepped input cannot
// land exactly on 1/11 or 1/6, so a value within half a step IS that one. At
// 1e-6 the readout showed cents for four of the seven named stops.
const COMMA_STEP = COMMA_MAX / 666;
const atDetent = (v) => COMMAS.find((c) => Math.abs(c.value - v) <= COMMA_STEP / 2);

// The FIRST digit, not every digit run together. Three chants in the corpus
// carry a differentia in their mode — "3a3", "7c2" — and stripping the
// non-digits turned those into mode 33 and 72, which temperamentum rightly
// refuses. That threw while building the panel, so those three chants opened
// a blank Canticum.
const modeOf = (chant) => Number(String(chant?.mode ?? "1").match(/[1-8]/)?.[0]) || 1;

/** The book a chant is printed in, and where in it — "Graduale Romanum, p. 130".
 *
 *  The page is a STRING because the books number themselves in more ways than
 *  a number can hold: plain (`130`), bracketed for the prefatory quires
 *  (`[179]`), lettered for an inserted leaf (`587A`), starred for the
 *  supplement (`278*`), occasionally a span (`1141-1143`). All of those are
 *  the page as the book prints it, so they are shown as they are rather than
 *  parsed into a number that would lose the distinction — the brackets and
 *  stars are how a reader finds the leaf.
 *
 *  What IS tidied: the abbreviation matches the form (p./pp.), and a page
 *  string that is empty — seven chants carry one — is dropped rather than
 *  printing a bare "p." with nothing after it. */
function bookAndPage(chant) {
  const book = chant?.source?.book;
  if (!book) return null;
  const page = String(chant?.pages?.[0]?.page ?? "").trim();
  if (!page) return book;
  // A span names two leaves, so it takes the plural abbreviation.
  const many = /[-–]/.test(page);
  return `${book}, ${many ? "pp." : "p."} ${page.replace(/-/g, "–")}`;
}

// ── the attestation century ──
// No attestation field rides a Chant — `source.year` is the printing — but
// `cantus({ id, before })` is gated by chantAdmissible, so probing the
// centuries recovers the earliest wholly-attested one. Measured: 1.4 ms a
// chant, and it dated 5/5 of Christmas's propers. Memoised because the
// detail line repaints with every selection and the answer never changes.
// Absent when the probe finds nothing — an undated chant shows no mark,
// never a guess. A probe standing in for a field is fine in a site panel
// and is not an API; logged as a small library gap.
const attestations = new Map();
function attestedCentury(chant) {
  if (!attestations.has(chant.id)) {
    let found = null;
    try {
      for (let c = 6; c <= 16; c++)
        if (tonus.cantus({ id: chant.id, before: c * 100 + 1 }).length) {
          found = c - 1;
          break;
        }
    } catch { found = null; }
    attestations.set(chant.id, found);
  }
  return attestations.get(chant.id);
}

// ── the documentation ──
// The API reference is markdown in this repo, and GitHub renders it. The
// alternative — building the pages into the site — is the better answer and a
// larger job; until then this is the shortest route that actually renders and
// honours an #anchor. Pinned to `main` rather than a tag so a link cannot rot
// against a branch that no longer exists.
const DOCS = "https://github.com/jeffreypierce/tonus/blob/main/docs/api/";

/** A quiet link into the reference, for a panel's subheader.
 *
 *  It names the PAGE in English — `§score docs`, `§calendar docs` — not the
 *  method it happens to document. A reader deciding whether to click is asking
 *  "is this about the thing I am looking at", and `§notatio` only answers that
 *  if you already know what notatio is. The page is also the honest target:
 *  these go to the top of a document, not to a section within it.
 *
 *  Opens in a new tab: this leaves the site for github.com, and a reader
 *  cross-referencing while exploring should not lose the loaded chant, the
 *  chosen note and the temperament to read one paragraph. Because that is a
 *  surprise unless announced, the accessible name says so — there is no
 *  visually-hidden utility in the stylesheet, and a visible ↗ would add a
 *  sixth mark to a line already carrying genus, mode and book.
 */
function docLink(page) {
  const name = `${page} documentation`;
  // A separator and the link. The dot is a plain character in the line, so it
  // inherits that line's face and size like every other character — which is
  // all it ever needed to match its surroundings.
  //
  // SAME TAB. These used to open a new one, on the reasoning that a reader
  // cross-referencing should not lose the loaded chant and its selection —
  // but a link that steals a tab is a decision made for the reader, and the
  // back button restores the page anyway. A link goes where it says it goes.
  return [" • ", el("a", {
    class: "doc", href: `${DOCS}${page}.md`,
    "aria-label": name, title: name,
    // No "docs" in the visible text: the § is the sigil for a section and the
    // page's own name follows it, so the word only repeated what both already
    // said. The accessible name keeps it, where there is no sigil to read.
  }, `§${page}`)];
}

/** The doc link for whichever reading is open — the same `find` the tab strip
 *  uses to resolve the current tab. A reading without a `doc` simply has none. */
function readingLink(readings, active) {
  const doc = readings.find((r) => r.key === active)?.doc;
  return doc ? docLink(doc) : null;
}

// ── a panel: a titled block in a column ──
const panel = (title, ...body) =>
  el("section", { class: "panel" }, title && el("h2", {}, title), ...body);

/** THE PAGE FRAME. Both views wear it: three header rows that align ACROSS the
 * two columns — title, detail, inputs — and then the columns themselves. The
 * alignment is the point, so the rows are one grid rather than each column
 * stacking its own header and hoping they end up level. */
function page({ title, rightTitle, detail, rightDetail, inputs, rightInputs, left, right }) {
  return el("div", { class: "page" },
    el("div", { class: "row row-title" },
      el("div", { class: "cell" }, title),
      el("div", { class: "cell" }, rightTitle)),
    el("div", { class: "row row-detail" },
      el("div", { class: "cell" }, detail),
      el("div", { class: "cell" }, rightDetail)),
    el("div", { class: "row row-inputs" },
      el("div", { class: "cell" }, inputs),
      el("div", { class: "cell" }, rightInputs)),
    el("div", { class: "row row-body" },
      el("div", { class: "cell" }, left),
      el("div", { class: "cell" }, right)),
  );
}

/** Rebuild the two panels beneath the header, and nothing else.
 *
 * A dial fires input continuously while it is dragged. A full redraw would
 * replace the row it lives in — and since appending a node MOVES it, even
 * building the new page would carry the live slider out of the document. So a
 * moving date rebuilds only the body, and the header rows are never rebuilt at
 * all: the element under the pointer is never touched, which is the only
 * arrangement that cannot break the gesture. */
// Everything a moving date changes EXCEPT the input row — the date field and
// its arrows must survive their own event, or a click would tear the button
// out from under the pointer. The title and the line under it are as much a
// function of the date as the panels are, and were being left stale: the day
// moved, the chants changed, and the feast's name went on naming yesterday.
function renderPanels() {
  const host = document.getElementById("view");
  const body = host.querySelector(".row-body");
  if (!body) { render(); return; }
  const view = VIEWS.find((v) => v.key === state.view) ?? VIEWS[1];
  const panels = view.panels?.();
  if (!panels) { render(); return; }

  const heads = view.heads?.();
  if (heads) {
    const put = (sel, left, right) => {
      const row = host.querySelector(sel);
      if (!row) return;
      const cells = row.querySelectorAll(".cell");
      if (left !== undefined) cells[0]?.replaceChildren(...(left ? [left] : []));
      if (right !== undefined) cells[1]?.replaceChildren(...(right ? [right] : []));
    };
    put(".row-title", heads.title);
    put(".row-detail", heads.detail, heads.rightDetail);
    // A READING'S INPUTS CAN BE A FUNCTION OF THE SELECTION TOO. The hexachord
    // picker shows what is in force, so picking a note on the ring has to move
    // it — built once and left alone, it went on naming the hexachord you
    // arrived in, and the toggles beside it never showed their own state.
    //
    // Only the RIGHT cell, and only when the reading offers one: the left cell
    // holds the date dial, and the comma slider is dragged. Neither survives
    // being replaced under the pointer, so neither is ever named here.
    put(".row-inputs", undefined, heads.rightInputs);
  }

  body.replaceChildren(
    el("div", { class: "cell" }, panels.left),
    el("div", { class: "cell" }, panels.right),
  );
  // The date field lives in the input row, which this deliberately does not
  // rebuild — so it is TOLD the day instead. Without this, choosing a feast
  // from the ring or its table moved the whole page and left the dial reading
  // the day you came from.
  syncDateDial(state.day, { anchors: paschaOf(state.day), anchor: state.anchor });
  writeUrl();
}

// ═══════════════════════════════════════════════════════════════════════════
// CALENDARIUM — a day
// ═══════════════════════════════════════════════════════════════════════════

/** Which day of its season a date is, and how long that season runs.
 *  Both ends are inclusive, so the first day of a season is dies 1. Dates are
 *  floored to UTC midnight first — a season boundary carries a time of day in
 *  some records, and 23 hours of it would otherwise round a day away. */
function seasonDay(feast, date) {
  if (!feast?.seasonStart || !feast?.seasonEnd) return null;
  const utc = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const start = utc(new Date(feast.seasonStart));
  const end = utc(new Date(feast.seasonEnd));
  const day = Math.floor((utc(date) - start) / 86400000) + 1;
  const total = Math.floor((end - start) / 86400000) + 1;
  if (!Number.isFinite(day) || !Number.isFinite(total) || total < 1) return null;
  return { day, total };
}

// A season in the genitive — "the Nth day OF Paschaltide" — which is how a
// chant book says it. `Tempus` becomes `Temporis`; what follows agrees with
// it or, being a prepositional phrase already, simply rides along.
const TEMPUS_GENITIVE = {
  "Tempus Adventus": "Temporis Adventus",
  "Tempus Nativitatis": "Temporis Nativitatis",
  "Tempus post Epiphaniam": "Temporis post Epiphaniam",
  "Tempus Septuagesimæ": "Temporis Septuagesimæ",
  "Tempus Quadragesimæ": "Temporis Quadragesimæ",
  "Tempus Paschale": "Temporis Paschalis",
  "Tempus post Pentecosten": "Temporis post Pentecosten",
};

const ROMAN = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
  [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"],
  [4, "IV"], [1, "I"]];

const roman = (n) => {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return String(n);
  let out = "";
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v; }
  return out;
};

/** The line under the feast's name: which day of its season this is.
 *  "Dies LIII Temporis Paschalis" — the ordinal in Roman numerals, the season
 *  in the genitive, no arithmetic on display. The total is dropped: a reader
 *  wants to know where they are, and "53 / 57" reads as a progress bar. */
function calendariumDetail(feast) {
  const tempus = feast?.tempus ?? feast?.season ?? "";
  const n = seasonDay(feast, state.day);
  const genitive = TEMPUS_GENITIVE[tempus] ?? tempus;
  // The chant page: what stands under this heading is the day's music — where
  // it comes from, and which office sings it.
  return el("p", { class: "sub" },
    n ? `Dies ${roman(n.day)} ${genitive}` : tempus,
    docLink("chant"));
}

/** The right column's quiet line: whatever the open reading has to say for
 *  itself — the feast's rank, or where the sky's weight is falling. */
function calendariumRightDetail(feast) {
  // The open reading names its own reference — see the `doc` field on
  // calendariumReadings. One lookup rather than a URL per branch.
  const link = readingLink(calendariumReadings(feast), state.right.calendarium);
  if (state.right.calendarium === "harmonia") return harmoniaDetail(link);
  // Census's line is the reading's HEADLINE — one computed conclusion about
  // the day — per the panel-header rules. It never restates a figure below.
  if (state.right.calendarium === "census")
    return el("p", { class: "sub" },
      censusDiesHeadline(tonus, { feast, rows: daysChants(feast) }), link);
  // The rank alone: the grade is the machine code the ritus reduces to, and
  // printing both said the same thing twice in two registers.
  if (feast) return el("p", { class: "sub" }, feast.ritus ?? "", link);
  return el("p", { class: "sub" }, state.day.toISOString().slice(0, 10), link);
}

/** The anchors of the year a date falls in. A year outside the calendar's
 *  reach throws rather than answering, and the input simply shows no anchors. */
function paschaOf(date) {
  try { return tonus.pascha(date.getUTCFullYear()); }
  catch { return null; }
}

/** The title and detail rows, which move with the date exactly as the panels
 *  do. Split out so `renderPanels` can repaint them without rebuilding the
 *  input row beneath. */
/** Harmonia's own inputs: which doctrine voices the spheres, and whether the
 *  aspects are drawn.
 *
 *  A FUNCTION, and named in calendariumHeads, because renderPanels rebuilds
 *  this cell. Written inline it was built once at first render and never
 *  again: the wheel's chords answered the click — 67 lines to 60 — while the
 *  button's own tick never moved off the state it was born with. */
function harmoniaInputs() {
  if (state.right.calendarium !== "harmonia") return undefined;
  return el("div", { class: "settings" },
    el("span", { class: "set-name" }, "doctrina"),
    el("select", {
      "aria-label": "doctrina",
      onchange: (e) => { state.doctrina = e.target.value; renderPanels(); },
    }, ...DOCTRINAE.map((d) =>
      el("option", { value: d, selected: state.doctrina === d },
        DOCTRINA_NOMEN[d] ?? d))),
    // One thing, on or off — a set of one, so it wears the set's costume
    // rather than a lone bordered button that matched nothing. The tick
    // carries the state; the name stays put instead of swapping between
    // visibiles and occulti, which made the control read as an action.
    el("div", { class: "segset", role: "group", "aria-label": "aspectus" },
      el("button", {
        type: "button", "aria-pressed": state.aspects ? "true" : "false",
        onclick: () => { state.aspects = !state.aspects; renderPanels(); },
      }, "aspectus")));
}

function calendariumHeads() {
  const [feast] = tonus.festum({ date: state.day });
  return {
    title: el("h1", {}, feast?.nomen ?? "—"),
    detail: calendariumDetail(feast),
    rightDetail: calendariumRightDetail(feast),
    // As canticumHeads does: the repaint has to rebuild this cell, or a toggle
    // in it shows the state it was first drawn with forever.
    rightInputs: harmoniaInputs(),
  };
}

/** Everything sung on a day, each chant tagged with the office it belongs to.
 *  One query per office, run once and reused by both the list and its filters
 *  — the counts on the toggles have to agree with the rows beneath them. */
function daysChants(feast) {
  if (!feast) return [];
  // A chant can be sung at more than one hour — the same antiphon returns for
  // Terce and None — and a list cannot show one row twice. First hour named
  // wins, so the label says where it is first heard.
  const seen = new Set();
  return OFFICES.flatMap((o) => {
    let chants = [];
    try { chants = o.of(feast).filter((c) => c.gabc); } catch { chants = []; }
    return chants.filter((c) => !seen.has(c.id) && seen.add(c.id))
      .map((c) => ({ chant: c, office: o }));
  });
}

/** The day's chants as one list, with the offices as filters over it.
 *  They were tabs, which made three short lists a caller had to visit in turn
 *  to see what the day held. A day sings one repertory; the office a chant
 *  belongs to is a property of the chant, so it labels the row and gates it —
 *  the same toggle idiom the analysis tracks use in Canticum. */
function calendariumPanels() {
  const [feast] = tonus.festum({ date: state.day });
  const all = daysChants(feast);
  const shown = all.filter((r) => state.offices.includes(r.office.key));
  const readings = calendariumReadings(feast);

  let left;
  if (!feast) left = el("p", { class: "ghost" }, "No feast at this date.");
  else if (!all.length) left = el("p", { class: "ghost" }, "Nothing is sung today.");
  else left = el("div", {},
    // ONE object made of parts. The five offices are independently on or off
    // and together they decide one thing — what the list below holds — so they
    // are a single strip with internal hairlines rather than five detached
    // boxes, which said "five unrelated actions" and were indistinguishable
    // from the three date anchors sitting directly above them. The tick each
    // segment carries is a second channel, so membership is not in colour
    // alone.
    el("div", { class: "segset", role: "group", "aria-label": "officia" },
      ...OFFICES.map((o) => {
        const n = all.filter((r) => r.office.key === o.key).length;
        return el("button", {
          type: "button",
          disabled: n === 0,
          "aria-pressed": state.offices.includes(o.key) ? "true" : "false",
          onclick: () => {
            state.offices = state.offices.includes(o.key)
              ? state.offices.filter((k) => k !== o.key)
              : OFFICES.map((x) => x.key).filter(
                  (k) => k === o.key || state.offices.includes(k));
            renderPanels();
          },
        }, o.name, el("span", { class: "seg-n" }, n));
      })),
    shown.length
      ? chantList(tonus, shown.map((r) => r.chant), {
          selectedId: state.chant?.id,
          onSelect: openChant,
          // Which office a chant is sung at leads its line, now that the three
          // are mixed into one list — otherwise the row loses its context.
          label: (c) => all.find((r) => r.chant.id === c.id)?.office.name ?? null,
          // And how long it is, which is the one thing the row cannot show:
          // the incipit draws the opening, so a 33-note antiphon and a
          // 194-note responsory look alike down the column.
          length: true,
        })
      : el("p", { class: "ghost" }, "No office is shown."),
  );

  return {
    left,
    right: tabPanel({ tabs: readings, active: state.right.calendarium, label: "lectio" }),
  };
}

// `doc` names the reference page this reading is described in. It rides the
// registry because it is a property OF the reading, like its name and panel.
const calendariumReadings = (feast) => [
  { key: "harmonia", name: "Harmonia", panel: harmoniaPanel, doc: "heavens" },
  { key: "festum", name: "Festum", panel: () => festumPanel(feast), doc: "calendar" },
  // The same reading Canticum carries, with the DAY as its subject — one
  // name (CENSUS_NOMEN, named once), one module, two subjects. The panel is
  // the wiring: the figures read data, never state.
  { key: "census", name: CENSUS_NOMEN, doc: "census",
    panel: () => censusDiesPanel(tonus, { feast, rows: daysChants(feast),
      onSelect: openChant }) },
];

function calendarium() {
  const [feast] = tonus.festum({ date: state.day });
  const readings = calendariumReadings(feast);
  const panels = calendariumPanels();

  return page({
    // row 1 — what this is, and what may be read of it
    title: el("h1", {}, feast?.nomen ?? "—"),
    rightTitle: tabs({
      label: "lectio", active: state.right.calendarium, stripOnly: true,
      onChange: (k) => { state.right.calendarium = k; render(); },
      tabs: readings,
    }),
    // row 2 — the quiet detail under each
    detail: calendariumDetail(feast),
    rightDetail: calendariumRightDetail(feast),
    // row 3 — what may be changed
    inputs: dateDial(state.day, (d, anchor) => {
      state.day = d;
      state.chant = null;
      state.anchor = anchor ?? null;
      // The panels and the headings only: the row this input sits in must
      // survive its own click, or the arrow would be replaced mid-press.
      renderPanels();
    }, { anchors: paschaOf(state.day), anchor: state.anchor }),
    rightInputs: harmoniaInputs() ?? null,
    left: panels.left,
    right: panels.right,
  });
}

function harmoniaPanel() {
  const o = {
    date: state.day,
    aspects: state.aspects,
    selected: state.body,
    doctrina: state.doctrina,
    // The wheel AND its tables take a click, as the monochord and the hand do
    // opposite. They are one selection shown three ways, not three controls:
    // whichever the reader reaches for, the other two follow.
    onSelect: (k) => { state.body = k; renderPanels(); },
  };
  return el("section", { class: "panel" },
    // The figure's name, in the one title style — CAELUM, his own API verb:
    // the wheel draws caelum({date}), the sky of the day. TERRA at the hub
    // is data.
    //
    // A key after all. The tabulae's glosses were held to carry the reading,
    // and they do carry the ROWS — but the wheel's own claim (that the
    // Ptolemaic order IS the scale order, so a ring's distance out is a
    // pitch) is nowhere in a table, and it is the whole reason the figure
    // is a wheel.
    el("h2", {}, "caelum", keySpur(
      "The seven planets, in the Chaldean order, slowest furthest out. That "
      + "order is also a scale: each planet sounds one note, the lowest at "
      + "the rim and the highest at the centre. Antiquity gave the ratios "
      + "four ways; the doctrina picks which.",
      [marks.chord(), "an aspect: two planets standing at an angle",
        "the line is heavier the stronger the aspect, and it sounds an "
        + "interval: a trine is a third, a square a tritone"],
      [marks.dot(), "a planet, on its ring",
        "drawn larger where its presence in the sky is greater"],
      [marks.roundel(), "the planet you have chosen",
        "every aspect it stands in is marked with it"])),
    rota(tonus, o),
    // The chords first: the aspects are what a click on the wheel lights up,
    // so the answer sits directly under the question.
    rotaAspectTabula(tonus, o),
    rotaTabula(tonus, o),
  );
}

/** The line under Harmonia: whose scheme the wheel is drawn from.
 *
 *  The doctrina selector beneath names it in shorthand ("boethius"); this
 *  says who that was, which is the thing a reader of the wheel wants and the
 *  short name cannot carry. */
function harmoniaDetail(link) {
  try {
    const H = tonus.harmonia(tonus.caelum({ date: state.day }), { doctrina: state.doctrina });
    return el("p", { class: "sub" }, H.auctor ?? "", link);
  } catch { return el("p", { class: "sub" }, "", link); }
}

// The ring and its table read the same selection, so a click on either moves
// both — the site's interaction model, kept here rather than written twice.
function festumPanel() {
  const year = state.day.getUTCFullYear();
  const o = {
    year, day: state.day, selected: state.anchor,
    onSelect: (key) => {
      // A movable anchor is a pascha() key; a fixed feast's key IS its date
      // (`MM-DD`), which is why the calendar can find it without a lookup.
      const p = tonus.pascha(year);
      const fixed = /^(\d{2})-(\d{2})$/.exec(key);
      const date = p[key]
        ? new Date(p[key])
        : fixed ? new Date(Date.UTC(year, +fixed[1] - 1, +fixed[2])) : null;
      if (date) { state.day = date; state.anchor = key; state.chant = null; }
      renderPanels();
    },
  };
  // The pairs table that sat between these two repeated the title, the line
  // under it, and the ring's own selection — every field it held is already
  // somewhere the eye reaches first.
  return el("section", { class: "panel" },
    // The ring's name moved up here from its own hub — one title style for
    // every figure; the hub keeps the year alone.
    //
    // The key reads OUTSIDE IN, which is the order the ring is built in and
    // the order a reader meets it: the civil year on the rim, the seasons
    // within it, the feasts on the orbit between.
    el("h2", {}, "annus domini", keySpur(
      "Two calendars, one inside the other: the civil year around the rim, "
      + "the Church's year banded within it.",
      [marks.band(), "a season, banded",
        "its arc is how long it lasts; the darker bands are the penitential seasons"],
      [marks.dot(), "a feast, on the orbit between the two calendars",
        "the larger dots are the greater feasts"],
      [marks.roundel(), "the feast you have chosen", "its row in the table is lit with it"],
      [marks.radius(), "the day the page stands on",
        "a hand on the year, pointing out through the ring"])),
    annulus(tonus, o), annulusTabula(tonus, o));
}

// ═══════════════════════════════════════════════════════════════════════════
// CANTICUM — a chant
// ═══════════════════════════════════════════════════════════════════════════

/** The two panels of Canticum. */
/** The chants this one is most like, as the census reckons it.
 *
 *  Same rows as the day's list in Calendarium — a list of chants is a list of
 *  chants — with the similarity where the office label sits there. The census
 *  answers for exactly one chant and throws rather than returning empty, so a
 *  chant it cannot place simply has no neighbours here. */
function similarChants() {
  let neighbours = [];
  try {
    neighbours = tonus.census({ id: state.chant.id }).neighbors ?? [];
  } catch { return null; }
  if (!neighbours.length) return null;

  // The census returns eight; five is a comparison, eight is a second list
  // competing with the day's own. They arrive sorted by similarity.
  const found = neighbours
    .map((n) => ({ n, chant: tonus.cantus({ id: n.id })[0] }))
    .filter((r) => r.chant?.gabc)
    .slice(0, 5);
  if (!found.length) return null;

  return el("div", { class: "similar" },
    // Titled like the readings opposite — it is the same kind of thing, a
    // named section of a column — with its own reference beneath.
    el("h2", { class: "similar-title" }, "Similes"),
    // A subheader with CONTENT, not an orphaned link: it says what the list
    // is and the order it comes in. The old neighbour-fact ("four of 2,187,
    // all above 97%") was cut for never changing; a section's descriptor is
    // allowed to be constant — it is a name, not a finding.
    el("p", { class: "sub" }, "the nearest in the census, most alike first",
      docLink("census")),
    // No similarity figure on the rows — CUT 2026-08-11 with the sublabel
    // numbers: a percentage with no header is a random number, and the line
    // has no room for a header. Membership in this list IS the claim; the
    // census doc linked above says how it is reckoned.
    chantList(tonus, found.map((r) => r.chant), {
      selectedId: state.chant?.id,
      // The one list that asks for it: these rows share the subject's mode
      // and usually its genus, so without a figure that moves the subline
      // repeats itself four times.
      length: true,
      // THE GENUS RIDES THE BOX, as the office does in the day's list: the
      // box takes the broadest grouping a row belongs to and the subline
      // keeps the specifics. A neighbour has no office worth boxing
      // (`chant.office` here is a genre code, "co" or "an", which is what
      // the genus already says), so the genus is that grouping.
      label: (c) => c.ordinarium || c.genus || null,
      onSelect: openChant,
    }),
  );
}

/** The chant's title with the way back beside it: a jump link in the
 *  anchors' own idiom (mono, →, the dotted hairline) that returns to the
 *  standing day in Calendarium — *ad festum*. The day never moved; only
 *  the view does. */
function canticumTitle(chant) {
  return el("div", { class: "title-row" },
    el("h1", {}, chant.incipit),
    el("a", { class: "doc ad-festum", href: "#",
      onclick: (e) => { e.preventDefault(); state.view = "calendarium"; render(); },
    }, "← ad festum"));
}

/** Canticum's heading rows, which move with the selection exactly as the
 *  panels do — the right-hand line names the chosen note, or the mode and
 *  where the chant's weight falls. */
/** What the chant IS: its genus, its mode, the book it is printed in — and
 *  how early it is attested, terse. The tilde does real work: the century is
 *  a floor recovered by probe, not a date read from a field. */
function canticumDetail(chant) {
  const c = attestedCentury(chant);
  return el("p", { class: "sub" },
    [chant.genus, chant.modus, bookAndPage(chant),
      c ? `~${c}th c.` : null].filter(Boolean).join(" · "),
    docLink("score"));
}

/** The subheader's dissent: the one thing on the site that tests the mode
 *  name standing beside it. ONLY the disagreement speaks — agreement says
 *  nothing the name has not — and it is worded as a second measurement, not
 *  a correction: mode accuracy is 67% top-1, and this is an aggregate
 *  ranking from the pitch weight, NOT the tonarium's moving centre. */
function affinityDissent(bookMode) {
  const top = state.score?.imprint?.modalAffinity?.[0];
  if (!top?.mode || top.mode === bookMode) return null;
  // "its own weight ranks VIII first" said the mechanism (a weighting, a
  // ranking) and left the reader to work out the point, which is simply that
  // the notes do not agree with the book.
  return `sounds in ${roman(top.mode)}`;
}

/** The right column's line: the mode's name under the theory reading, or the
 *  chosen note under any other. */
function canticumRightDetail(M, row) {
  return el("p", { class: "sub" },
    state.right.canticum === "temperamentum"
      ? [M.nomen, affinityDissent(modeOf(state.score.chant))]
          .filter(Boolean).join(", ")
      // Census's line is its HEADLINE — one computed conclusion about the
      // chant. The engine lives with the figures in diagrams/census.js.
      : state.right.canticum === "census"
        ? censusHeadline(tonus, { chant: state.score.chant, score: state.score })
        // With no note chosen the hand still has something true to say:
        // the hexachord it is being read by. It moves with the picker and
        // with the selection, so the line is never a shrug.
        : row ? manusLine(row) : `hexachordum ${state.hexachord}`,
    readingLink(canticumReadings(), state.right.canticum));
}

/** The chosen note as the HAND names it: its Guidonian name and the joint it
 *  is read at. The scientific pitch is dropped here — spn is the tuning
 *  panel's currency, and this reading is the medieval one, where a pitch IS a
 *  place on the hand. The joint is what the figure beside it is pointing at. */
function manusLine(row) {
  // The joint is ONE place — a finger, then where on it — so the pair is
  // joined by the arrow the arch already uses, not the mid-dot that would
  // read it as two separate facts beside the name.
  const joint = row.hand ? `${row.hand.finger} → ${row.hand.region}` : null;
  return [row.nomen, joint].filter(Boolean).join(" · ") || row.spn;
}

/** Canticum's heading rows. Both this and `canticum()` build the page's
 *  headings — this on every repaint, that on the first render — so they call
 *  the SAME helpers. They used to carry byte-identical copies of the markup,
 *  which is a standing invitation for the two paths to drift apart. */
function canticumHeads() {
  if (!state.chant || !state.score) return null;
  const { chant } = state.score;
  const mode = modeOf(chant);
  const row = state.note != null ? state.score.tabula[state.note] : null;
  const M = tonus.temperamentum({
    mode, tuning: "meantone", comma: state.comma,
  }).modus(mode);

  return {
    title: canticumTitle(chant),
    detail: canticumDetail(chant),
    rightDetail: canticumRightDetail(M, row),
    // Named only for the readings whose inputs are safe to rebuild — see the
    // note in renderPanels. Temperamentum's slider is deliberately absent.
    rightInputs: state.right.canticum === "manus" ? hexachordPicker() : undefined,
  };
}

function canticumPanels() {
  if (!state.chant || !state.score) return { left: null, right: null };
  const readings = canticumReadings();
  return {
    left: el("div", {}, trackStrip(), scoreFigure(), similarChants()),
    right: tabPanel({ tabs: readings, active: state.right.canticum, label: "lectio" }),
  };
}

// The first two readings are the tuning engine seen two ways, so both point
// at tuning; the third is the census, and points at its own page.
const canticumReadings = () => [
  { key: "temperamentum", name: "Temperamentum", panel: temperamentumPanel, doc: "tuning" },
  // The genitive, as the treatises write it: the hand OF Guido. Manus is
  // feminine, so the adjectival "Guidonius" agreed with nothing.
  { key: "manus", name: "Manus Guidonis", panel: manusPanel, doc: "tuning" },
  // The chant against the corpus. `year` names the calendar the mass row
  // walks — the feast index is memoised per year, movable feasts being
  // movable. Census wears no inputs, so no rightInputs branch names it.
  { key: "census", name: CENSUS_NOMEN, doc: "census",
    panel: () => censusPanel(tonus, { chant: state.chant, score: state.score,
      year: state.day.getUTCFullYear(), onSelect: openChant }) },
];

function canticum() {
  if (!state.chant || !state.score) {
    return page({
      title: el("h1", {}, "\u2014"),
      detail: el("p", { class: "ghost" }, "Choose a chant in Calendarium."),
      left: null, right: null,
    });
  }

  const { chant } = state.score;
  const mode = modeOf(chant);
  const row = state.note != null ? state.score.tabula[state.note] : null;

  const readings = canticumReadings();
  const panels = canticumPanels();

  const M = tonus.temperamentum({ mode, tuning: "meantone", comma: state.comma }).modus(mode);

  return page({
    title: canticumTitle(chant),
    rightTitle: tabs({
      label: "lectio", active: state.right.canticum, stripOnly: true,
      onChange: (k) => { state.right.canticum = k; render(); },
      tabs: readings,
    }),
    detail: canticumDetail(chant),
    rightDetail: canticumRightDetail(M, row),
    // TWO ROWS, as Calendarium reads: the value control on the first line and
    // the set of toggles on its own beneath. They were one flex line, so the
    // tracks sat inline with `notatio` and the strip had to compete with a
    // select for the eye. The strip is the same object as Calendarium's
    // offices, and it now sits where that one does.
    // ONE ROW, like Calendarium's. Its office strip is not in this band at
    // all — it sits in the BODY beneath, and the band holds only the date.
    // Stacking the tracks here instead made this cell 108px against the other
    // column's 52, and the grid row sizes to the tallest cell, so the RIGHT
    // panel's figure was pushed 56px down: the monochord sat 84px below its
    // controls where the wheel sits 28. The strip moves to the body with it.
    //
    // NO SET-NAME, matching Calendarium: the date field carries none either,
    // and the select's own value says what it is ("quadrata", "moderna").
    inputs: el("div", { class: "settings" },
      el("select", { "aria-label": "notatio",
        onchange: (e) => { state.notation = e.target.value; render(); } },
        ...["quadrata", "moderna"].map((v) =>
          el("option", { value: v, selected: state.notation === v }, v)))),
    rightInputs: state.right.canticum === "temperamentum" ? commaSlider()
      : state.right.canticum === "manus" ? hexachordPicker() : null,
    left: panels.left,
    right: panels.right,
  });
}

/** The score, with a hit disc over every notehead.
 *
 * inscriptio wraps to a WIDTH IN PIXELS, so the score cannot be made to reflow
 * with CSS — a narrower window has to be answered with a narrower render. The
 * element measures itself, and an observer re-renders it when the column
 * changes size, which is why nothing here ever scrolls sideways. */
// The house dress for every score on this page: Junicode, by REFERENCE.
//
// The page already loads the variable face (styles.css `@font-face`), so the
// SVGs name it and stay small — embedding would carry ~300KB of font into
// every score on a page that already has it. That is what the `embed` slot is
// FOR, and this is the case it is not for.
//
// Weights are the lab's house dress. Without this the renders fall back to the
// library's built-in serif stack at weight 518, which is why the lyrics read
// heavy and in the wrong face against the rest of the page.
// The site's house dress. Faces only — no colours, because the page themes the
// chant through CSS custom properties instead (see --tonus-* in styles.css),
// which is what lets a rendered score follow the site's light/dark without
// being redrawn.
const SCORE_THEME = {
  fonts: {
    // JACQUARD 24 FOR THE INITIAL. The 24 cut, not the 12: 12 exists for
    // small sizes where 24's fine strokes fill in, and an initial is the
    // largest letter on the page. The rest of the score stays Junicode —
    // this is the illuminated capital, not a change of voice.
    // JUNICODE, not Jacquard. The blackletter was tried as the initial and
    // looked worse at size than it promised: Jacquard is the wordmark, and
    // that is the whole of its job here.
    dropcap:    { family: "Junicode", weight: 700 },
    title:      { family: "Junicode", weight: 620 },
    annotation: { family: "Junicode", weight: 640 },
    lyric:      { family: "Junicode", weight: 400, scale: 1.06 },
  },
};

/** The three analysis tracks: a SET over one score, independently on and
 *  together deciding what is drawn over the notation. It sits in the BODY,
 *  where Calendarium puts its office strip, so the two views read alike and
 *  neither pushes its own inputs band taller than the other's. */
function trackStrip() {
  return el("div", { class: "track-strip" },
    el("div", { class: "segset", role: "group", "aria-label": "vestigia" },
      ...["prosodia", "chironomia", "tonarium"].map((name) => el("button", {
        type: "button",
        "aria-pressed": state.tracks.includes(name) ? "true" : "false",
        onclick: () => {
          state.tracks = state.tracks.includes(name)
            ? state.tracks.filter((t) => t !== name) : [...state.tracks, name];
          render();
        },
      }, name))),
    tracksInfo());
}

function scoreFigure() {
  const wrap = el("div", { class: "score" });
  // A new score supersedes the old one's repainter; if this render throws, the
  // stale closure must not survive to paint marks onto a discarded element.
  repaintScoreMarks = null;
  // Measured, not assumed: the element is not in the document yet, so ask the
  // column it is about to join. Falling back to a fixed width is what made the
  // score overflow a narrower window on first paint.
  const width = Math.max(320, Math.round(measureColumn() ?? lastScoreWidth));
  try {
    const { svg, geometry } = tonus.inscriptio(state.score, {
      width,
      theme: SCORE_THEME,
      notation: state.notation,
      // THE INITIAL AND THE MARK BESIDE IT, as the books print them: a large
      // black capital, with the genus and mode stacked at the left margin over
      // it ("Intr." over "1."). The library defaults both off — its own
      // official opening is a centred title — but this page is a chant book,
      // not an edition's front matter.
      dropcap: true,
      annotation: "auto",
      tracks: state.tracks.length ? state.tracks : undefined,
    });
    wrap.innerHTML = svg;
    const NS = "http://www.w3.org/2000/svg";
    const target = wrap.querySelector("svg");
    if (!target) return wrap;
    // The emitter tags every head `class="note"` in drawing order, so heads[i]
    // and geometry[i] are the same note.
    const heads = target.querySelectorAll(".note");

    // Where the head actually sits. `geometry` reports the note's ANCHOR — its
    // left edge and its pitch line — which is the right thing for a renderer
    // to report and the wrong thing to centre a ring on: the head extends
    // about three pixels right of x, and further on the shapes with their own
    // path origin. `middleOf` reads the drawn glyph instead. See
    // diagrams/notehead.js for why it is computed rather than measured.
    const centreOf = (i, g) => middleOf(heads[i]) ?? { x: g.x, y: g.y, r: 7 };

    const paint = () => {
      wrap.querySelector(".marks")?.remove();
      // Put every head back to the emitter's own ink before reddening one:
      // paint runs again on each selection, and without this the previously
      // selected note would stay red and the score would slowly fill up.
      wrap.querySelectorAll(".note path[fill='#9E2B25']")
        .forEach((p) => p.setAttribute("fill", "var(--tonus-note, #111)"));
      const layer = document.createElementNS(NS, "g");
      layer.setAttribute("class", "marks");
      geometry.forEach((g, i) => {
        // `y` is ALREADY absolute on the canvas — `systemY` is the staff's own
        // origin, reported so a caller can tell which system a note is in, not
        // an offset to add. Adding it double-counted: the second system's hits
        // sat where the third was drawn, and the last five landed past the
        // bottom of the SVG entirely. Only system one worked, its systemY being 0.
        const c = centreOf(i, g);
        if (state.note === i) {
          // The head takes the rubric AND wears a ring: the ink says which
          // note, the ring finds it on a page of three hundred.
          //
          // The emitter fills each head with `var(--tonus-note, #111)`, and an
          // inline fill on the group is inherited by the path only if the path
          // does not set its own — which it does. So the fill is set on the
          // PATH, where it wins.
          heads[i]?.querySelectorAll("path")
            ?.forEach((p) => p.setAttribute("fill", "#9E2B25"));
          const ring = document.createElementNS(NS, "circle");
          for (const [k, v] of Object.entries({
            cx: c.x, cy: c.y, r: (c.r ?? 7) + 4.5,
            fill: "none", stroke: "#9E2B25", "stroke-width": "1.4",
          })) ring.setAttribute(k, v);
          layer.append(ring);
        }
        const hit = document.createElementNS(NS, "circle");
        for (const [k, v] of Object.entries({
          cx: c.x, cy: c.y, r: Math.max((c.r ?? 7) + 4, 9),
          fill: "#111", "fill-opacity": "0",
          cursor: "pointer", tabindex: "0", role: "button",
          "aria-label": `nota ${i + 1}`,
        })) hit.setAttribute(k, v);
        hit.addEventListener("click", () => selectNote(i));
        hit.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectNote(i); }
        });
        layer.append(hit);
      });
      target.append(layer);
    };
    paint();
    // Kept so a changed selection can repaint the marks WITHOUT re-rendering
    // the score. Re-drawing a 300-note chant to move one ring throws away the
    // element that was just clicked, and with it the browser's focus and the
    // measured layout the ring depends on.
    repaintScoreMarks = paint;
  } catch (err) {
    wrap.append(el("p", { class: "ghost" }, `inscriptio: ${err.message}`));
  }
  watchWidth(wrap);
  return wrap;
}

// Repaints the score's selection marks in place. Set when a score is drawn;
// cleared when one is thrown away.
let repaintScoreMarks = null;

// The width the score was last drawn at. Kept outside the render so a re-render
// does not start from a guess, and so the observer can tell a real change from
// the noise a scrollbar makes appearing and disappearing.
let lastScoreWidth = 880;
// The readings column, for the figures that render notation into it. Only used
// before the cell has been measured once — every render after that asks.
let lastReadingWidth = 560;
let scoreObserver = null;

/** The width the score's column will give it. Read from a cell already laid
 * out, since the score's own wrapper has no layout until it is appended. */
/** The width a figure has to draw into. `which` picks the column — 0 is the
 *  subject, 1 the readings — because inscriptio wraps to a width in PIXELS and
 *  the two columns are not the same size. Measuring the wrong one is how a
 *  score ends up either overflowing or drawn into a third of its cell. */
function measureColumn(which = 0) {
  const cells = document.querySelectorAll(".row-body .cell");
  const w = cells[which]?.getBoundingClientRect?.().width;
  return w && w > 1 ? w : null;
}

function watchWidth(node) {
  if (typeof ResizeObserver === "undefined") return;
  scoreObserver?.disconnect();
  scoreObserver = new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    if (w < 1) return;
    // A few pixels either way is a scrollbar, not a resize; re-rendering on
    // those oscillates forever.
    if (Math.abs(w - lastScoreWidth) < 8) return;
    lastScoreWidth = w;
    render();
  });
  scoreObserver.observe(node);
}

/** Which pitch the theory column is showing.
 *
 *  Two things can put a pitch here and they are not the same act: choosing a
 *  NOTE of the chant (in the score, or on the range staff) says "this note,
 *  which happens to sound that degree"; choosing a DEGREE (on the monochord,
 *  the ruler, the table) says "that degree, wherever the chant uses it". So a
 *  note selection wins while it lasts, and picking a degree releases it —
 *  otherwise the score would go on ringing a note the column is no longer
 *  about. */
function selectedPitch() {
  if (state.note != null) return state.score?.tabula[state.note]?.spn ?? null;
  return state.pitch;
}

/** The theory column's selection, in each figure's own currency.
 *
 *  A chant and a scale do not live in the same octave — this chant sings G2
 *  while mode 8's gamut is written G3 — so a note's SPN never matched a
 *  monochord row's key and selecting in the score highlighted nothing. What
 *  they genuinely share is the pitch CLASS: the degree, whatever octave it is
 *  sung in, which is exactly what the monochord and the hand are about.
 *
 *  So the note is translated once, here, into whatever key each figure uses —
 *  rather than each figure guessing, or the state storing three forms of the
 *  same fact. */
/** A pitch moved by whole semitones, named as spn — "G2" + 12 -> "G3".
 *  Asked of the library rather than parsed here: an spn's octave digit is not
 *  simply the number after the letter (B3 and C4 are a semitone apart), and a
 *  string edit gets that wrong at every B/C boundary. */
function spnAt(spn, semitones) {
  if (!spn) return spn;
  const T = tonus.temperamentum({});
  const midi = T.nota(spn)?.midi;
  return midi == null ? spn : (T.nota(midi + semitones)?.spn ?? spn);
}

function selectionFor(rows, spn) {
  if (!spn) return undefined;
  // AN EXACT PITCH FIRST. Pitch class alone is right for a row set that spans
  // ONE octave — the monochord's, where the chant sings G2 and the scale
  // writes G3 and they are one degree. The hand spans THREE, and there the
  // first row sharing a pitch class is always the lowest: clicking cc landed
  // on C, dd on D, and the top of the gamut could not be selected at all.
  const exact = rows.find((r) => r.spn === spn);
  if (exact) return exact.key;
  // `nota` returns the pitch itself, not a wrapper around one.
  const pc = tonus.temperamentum({}).nota(spn)?.pc;
  if (pc == null) return undefined;
  const hit = rows.find((r) => r.pc === pc);
  return hit?.key;
}

/** Choose a degree: the theory column's own selection, which releases the
 *  chant's note rather than pretending both are current. */
function selectPitch(spn) {
  state.pitch = spn;
  state.note = null;
  renderPanels();
}

/** Choose a note of the chant, by its index in the score's tabula. */
function selectNote(i) {
  state.note = i;
  state.pitch = null;
  // The hand is read by the hexachord in force where the reader is standing,
  // so a note carries its own reading with it.
  const h = state.score?.tabula[i]?.hexachord;
  if (h) state.hexachord = h;
  renderPanels();
}

// ── how to read the tracks ──
// The same spur-and-card every key wears (components/key.js popover), with
// reading instruction instead of marks: a key can say what a mark IS, but
// the ribbon needs a sentence.
/** The prosodia's marks, one entry each — the track draws six kinds and a
 *  prose line cannot carry them all; the card documents what is drawn. */
function prosodiaMarks() {
  const NS = "http://www.w3.org/2000/svg";
  const sw = (...kids) => {
    const svg = document.createElementNS(NS, "svg");
    for (const [k, v] of Object.entries({ class: "key-swatch",
      viewBox: "0 0 18 14", width: 18, height: 14, "aria-hidden": "true" }))
      svg.setAttribute(k, v);
    for (const kid of kids) svg.append(kid);
    return svg;
  };
  const m = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const tent = (peak) => [
    m("path", { d: "M 2 12 L 8 4.5 Q 9 3.6 10 4.5 L 16 12", fill: "none",
      stroke: "#111", "stroke-opacity": 0.38, "stroke-width": 1.1 }),
    peak,
  ];
  const entry = (swatch, word) => el("p", { class: "key-entry" }, swatch, " ", word);
  return [
    entry(sw(...tent(m("circle", { cx: 9, cy: 3.9, r: 1.8, fill: "#9E2B25" }))),
      "the accent, struck: it lands on the rising beat"),
    entry(sw(...tent(m("circle", { cx: 9, cy: 3.9, r: 1.8, fill: "none",
      stroke: "#9E2B25", "stroke-width": 0.9 }))),
      "the accent, deferred: it lands on the settling beat"),
    // NOT "a spoken syllable": nothing here is spoken, it is all sung. The
    // distinction the mark draws is how MANY notes the syllable carries —
    // under four it stands as a stem, four or more it becomes a melisma block.
    entry(sw(m("line", { x1: 9, y1: 12, x2: 9, y2: 4, stroke: "#111",
      "stroke-opacity": 0.62, "stroke-width": 1.4 })),
      "a syllable of one to three notes. The stem's height is that count"),
    entry(sw(m("line", { x1: 4, y1: 9, x2: 14, y2: 9, stroke: "#111",
      "stroke-opacity": 0.62, "stroke-width": 1.4 })),
      "a syllable held on the reciting note. It lies flat, because "
      + "recitation does not move"),
    entry(sw(m("path", { d: "M 2 12 L 2 7 L 8 5.5 L 16 8 L 16 12 Z",
      fill: "#111", "fill-opacity": 0.18 })),
      "a melisma, four notes or more. The block spans the notes themselves, "
      + "and its height is their count; from eight the count prints inside"),
    entry(sw(m("line", { x1: 9, y1: 2, x2: 9, y2: 12, stroke: "#111",
      "stroke-opacity": 0.24, "stroke-width": 0.6 })),
      "a divisio: a breath in the text, drawn through both lanes"),
  ];
}

/** The tonarium's marks. The lane's prose names the rails, the mode line and
 *  the melody; these are the four marks that carry a claim about a close —
 *  which a sentence cannot distinguish, because the difference between them
 *  is a fill and a dash. */
function tonariumMarks() {
  const NS = "http://www.w3.org/2000/svg";
  const sw = (...kids) => {
    const svg = document.createElementNS(NS, "svg");
    for (const [k, v] of Object.entries({ class: "key-swatch",
      viewBox: "0 0 18 14", width: 18, height: 14, "aria-hidden": "true" }))
      svg.setAttribute(k, v);
    for (const kid of kids) svg.append(kid);
    return svg;
  };
  const m = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const entry = (swatch, word) => el("p", { class: "key-entry" }, swatch, " ", word);
  return [
    entry(sw(m("path", { d: "M 1 9 H 8 V 4 H 17", fill: "none", stroke: "#9E2B25",
      "stroke-width": 1.3 })),
      "the mode steps, and the melody stays inside it"),
    entry(sw(m("path", { d: "M 1 9 H 8 V 4 H 17", fill: "none", stroke: "#9E2B25",
      "stroke-width": 1.3, "stroke-dasharray": "2.5 2" })),
      "the same melody, sung from a different degree of the scale"),
    entry(sw(m("circle", { cx: 9, cy: 7, r: 2.4, fill: "#111",
      "fill-opacity": 0.8 })),
      "a close that comes to rest"),
    entry(sw(m("circle", { cx: 9, cy: 7, r: 2.4, fill: "none", stroke: "#111",
      "stroke-opacity": 0.8, "stroke-width": 1.1 })),
      "a close that hangs, waiting for the phrase after it"),
  ];
}

function tracksInfo() {
  const NS = "http://www.w3.org/2000/svg";
  const sample = (draw) => {
    const svg = document.createElementNS(NS, "svg");
    for (const [k, v] of Object.entries({ class: "tracks-sample",
      viewBox: "0 0 64 14", width: 64, height: 14, "aria-hidden": "true" }))
      svg.setAttribute(k, v);
    draw(svg);
    return svg;
  };
  const line = (svg, attrs) => {
    const e = document.createElementNS(NS, "path");
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    svg.append(e);
  };
  const BLOCKS = {
    prosodia: () => [
      sample((s) => {
        // a word's tent with its rubrica peak, over a melisma block
        line(s, { d: "M 2 10 L 20 4.5 Q 23 3.6 26 4.5 L 44 10", fill: "none",
          stroke: "#111", "stroke-opacity": 0.38, "stroke-width": 1.2 });
        line(s, { d: "M 46 12 L 46 7 L 52 5.6 L 60 8 L 60 12 Z",
          fill: "#111", "fill-opacity": 0.18, stroke: "none" });
        line(s, { d: "M 23 3.8 m -1.6 0 a 1.6 1.6 0 1 0 3.2 0 a 1.6 1.6 0 1 0 -3.2 0",
          fill: "#9E2B25", stroke: "none" });
      }),
      el("p", { class: "tracks-name" }, "prosodia"),
      el("p", { class: "tracks-text" }, "The word is a swell whose peak, in "
        + "red, is the accent. Below, one mark per syllable, by how the "
        + "melody treats it."),
      ...prosodiaMarks(),
    ],
    chironomia: () => [
      sample((s) => line(s, { d: "M 2 8 C 14 2, 26 12, 40 6 S 58 4, 62 7",
        fill: "none", stroke: "#111", "stroke-opacity": 0.75,
        "stroke-width": 2.6, "stroke-linecap": "round" })),
      el("p", { class: "tracks-name" }, "chironomia"),
      el("p", { class: "tracks-text" }, "The ribbon's shape is the hand's "
        + "gesture; its width is each note's velocity, so the line presses "
        + "where the voice does. A cadence re-inks at full strength, and "
        + "below confidence nothing is drawn at all."),
      el("p", { class: "key-entry" }, marks.text("A"), " ",
        "arsis: the hand lifts and the voice rises. The ribbon crests"),
      el("p", { class: "key-entry" }, marks.text("T"), " ",
        "thesis: the hand falls and the voice settles. The ribbon troughs"),
      el("p", { class: "key-entry" }, marks.text("PT"), " ",
        "a passing thesis: a settling of one note, which the hand moves "
        + "through rather than resting on. The trough is shallow"),
    ],
    tonarium: () => [
      sample((s) => {
        line(s, { d: "M 2 10 H 22 V 5 H 44 V 8 H 62", fill: "none",
          stroke: "#111", "stroke-opacity": 0.45, "stroke-width": 1.4 });
        line(s, { d: "M 44 2 V 12", stroke: "#111", "stroke-width": 1.4 });
      }),
      el("p", { class: "tracks-name" }, "tonarium"),
      // THE OLD TEXT NAMED ONE MARK AND SPENT ITS SECOND SENTENCE ON A
      // NEGATION (what the lane is not), which needs the census in the
      // reader's head before it says anything. The lane draws four things;
      // they are named here in the order the eye meets them.
      el("p", { class: "tracks-text" }, "Which mode governs the melody, "
        + "phrase by phrase. The four rails are the four finals (D, E, F, G "
        + "from the bottom), and the red line steps between them as the mode "
        + "changes, its numeral above. A solid step is an inflection within "
        + "the mode. A dashed one is the same shape sung from another degree."),
      el("p", { class: "tracks-text" }, "The grey trace behind it is the "
        + "melody itself, and it thickens where the voice moves faster. "
        + "Where a phrase closes, its last few notes darken: that is a "
        + "cadence, named beneath by its own shape and by how often chants "
        + "in this mode end that way."),
      ...tonariumMarks(),
    ],
  };
  return popover("how to read the tracks", () => {
    // The card reads in the STACK's order, not the order the reader
    // toggled them — the page and its key should agree.
    const active = ["prosodia", "chironomia", "tonarium"]
      .filter((t) => state.tracks.includes(t) && BLOCKS[t]);
    return active.length
      ? active.flatMap((t) => BLOCKS[t]())
      : [el("p", { class: "tracks-text ghost" }, "No track is drawn over the score.")];
  });
}

// THE SLIDER OUTLIVES A RENDER, for the reason the date field does: dragging
// fires `input` continuously and each one repaints the panels, so a control
// rebuilt every time would be torn out from under the pointer after one step.
let commaControl = null;

/** The temperament as one continuous axis, with the historical stops marked.
 *
 *  A dropdown of six names said these were six tunings. They are one — a
 *  fifth narrowed by some fraction of the comma — and the slider says so:
 *  drag from pure fifths at one end to Salinas at the other and the thirds
 *  come into tune as the fifths go out, which is the whole trade the
 *  Renaissance was arguing about. The detents are where the argument stopped. */
/** The width of the tempered fifth, in cents — ALWAYS.
 *
 *  This used to print the comma fraction at a named stop and cents between,
 *  so the readout changed KIND as the thumb moved: "1/4" then "697.2¢" then
 *  "2/7". Two units alternating in one field is hard to read as a value
 *  moving. The fraction is what the list beside it already says; this says
 *  what the fraction DOES, on one scale, everywhere on the axis — and it
 *  gives Pythagorean a real number (702.0¢, the pure fifth) rather than "0".
 */
function commaReadout(v) {
  try {
    const T = tonus.temperamentum({ tuning: "meantone", comma: v });
    return `${(1200 * Math.log2(T.nota("G4").hz / T.nota("C4").hz)).toFixed(1)}¢`;
  } catch { return ""; }
}

function commaSlider() {
  if (!commaControl) {
    // Fine enough that a drag feels continuous rather than stepped: 667 stops
    // across the axis, where 0.001 gave 333 and the thumb visibly ratcheted.
    const input = el("input", {
      type: "range", min: "0", max: String(COMMA_MAX), step: String(COMMA_STEP),
      value: String(state.comma), "aria-label": "temperatura",
      class: "comma-range",
    });

    // NO SNAP. It fought the drag — the thumb stuck to a detent and jumped out
    // of it, which is what made the control feel broken. The named stops are
    // reachable exactly from the list beside it, and the ticks show where they
    // are; the slider's job is the places BETWEEN them.
    // ONE REPAINT PER FRAME. `input` fires per pixel of drag, and each one
    // was running a synchronous renderPanels() — every panel, every figure,
    // every score re-rendered before the next mouse move could be read.
    // Measured across the track: 18ms a step at the median and 53ms at the
    // worst, which is the ratchet.
    //
    // The thumb and the readout still move on EVERY event, because they are
    // cheap and they are what the hand is watching. Only the panels are
    // coalesced, so a drag repaints at most once a frame and drops the
    // intermediate states nobody sees.
    let queued = 0;
    input.addEventListener("input", () => {
      state.comma = Number(input.value);
      commaControl.paint();
      if (queued) return;
      queued = requestAnimationFrame(() => { queued = 0; renderPanels(); });
    });

    const readout = el("span", { class: "comma-read" });

    const pick = el("select", { "aria-label": "temperamentum",
      onchange: (e) => {
        const c = COMMAS[Number(e.target.value)];
        if (!c) return;
        state.comma = c.value;
        commaControl.sync();
        commaControl.paint();
        renderPanels();
      } },
      ...COMMAS.map((c, i) => el("option", { value: String(i) }, `${c.name} ${c.gloss}`)),
    );

    commaControl = {
      node: el("div", { class: "settings comma" },
        el("span", { class: "set-name" }, "temperatura"),
        el("span", { class: "comma-track" }, input),
        readout, pick),
      input, pick, readout,
      /** Take the value from outside — the list, a link opened. */
      sync: () => { if (document.activeElement !== input) input.value = String(state.comma); },
      paint: () => {
        readout.textContent = commaReadout(state.comma);
        // Between two stops the list still shows the NEAREST — a "—" told the
        // reader nothing when it could tell them where they are. It is drawn
        // greyed to say the slider is not ON that stop, only near it.
        const at = atDetent(state.comma);
        const near = at ?? COMMAS.reduce((best, c) =>
          Math.abs(c.value - state.comma) < Math.abs(best.value - state.comma) ? c : best);
        pick.value = String(COMMAS.indexOf(near));
        pick.classList.toggle("at-detent", Boolean(at));
        pick.classList.toggle("near-detent", !at);
      },
    };
  }
  commaControl.sync();
  commaControl.paint();
  return commaControl.node;
}

/** Which hexachord the hand is read by.
 *
 *  A doctrinal choice about the figure, so it wears the same box `doctrina`
 *  does. It is not a mode the reader has to keep in step by hand: picking a
 *  note — on the ring, in the score, anywhere the selection travels — sets it,
 *  and the picker shows what is in force and can still override it. */
function hexachordPicker() {
  return el("div", { class: "settings" },
    el("span", { class: "set-name" }, "hexachordum"),
    el("select", {
      "aria-label": "hexachordum",
      onchange: (e) => { state.hexachord = e.target.value; renderPanels(); },
    },
      ...HEXACHORDA.map((v) =>
        el("option", { value: v, selected: state.hexachord === v }, v))),
    // What is drawn OVER the twenty places. One switch, because the dashes and
    // the arrows are one mark: a path a reader is meant to walk has a
    // direction, and a direction with no path to lie along is nothing.
    el("div", { class: "segset", role: "group", "aria-label": "ordo" },
      el("button", {
        type: "button", "aria-pressed": state.route ? "true" : "false",
        onclick: () => { state.route = !state.route; renderPanels(); },
      }, "ordo"),
      // Read the chant an octave up. It moves where the piece SITS on the
      // hand, not what it is: the same degrees, the same solmization, one
      // octave higher up the gamut, which is where most of the corpus lands
      // when a choir actually sings it.
      el("button", {
        type: "button", "aria-pressed": state.octave ? "true" : "false",
        onclick: () => { state.octave = state.octave ? 0 : 1; renderPanels(); },
      }, "octava")),
  );
}

function temperamentumPanel() {
  const mode = modeOf(state.chant);
  const sel = selectedPitch();
  const tune = { tuning: "meantone", comma: state.comma };
  // The scale's rows are keyed by their OWN spn, an octave from the chant's,
  // so the selection is translated into their currency rather than compared
  // across octaves and silently missing.
  const scaleRows = chordaRows(tonus, { mode, ...tune });
  const opts = {
    mode, selected: selectionFor(scaleRows, sel), ...tune,
    // A degree chosen here is reported back as the CHANT's pitch where it has
    // one, so the score and the range staff can ring the note the reader
    // actually clicked toward.
    onSelect: (key) => {
      const row = scaleRows.find((r) => r.key === key);
      const inChant = state.score?.tabula.find((t) => t.pc === row?.pc);
      selectPitch(inChant?.spn ?? key);
    },
  };

  return el("section", { class: "panel" },
    // ONE title style for every figure — the panel h2, its key's spur at
    // the right (ruled 2026-08-11; the in-figure margin captions retired).
    el("h2", {}, "monochordum", keySpur(
      "The chant's scale on one string, measured twice: the just ratios above, the modern cents below.",
      [marks.text("3:2"), "the just string"],
      [marks.text("irr", { italic: true }), "no ratio under temperament"],
      [marks.text("±¢"), "against equal"],
      [marks.rubric(), "the chosen degree"])),
    // The string and the ruler as ONE figure: the same degrees on two axes,
    // joined, so the disagreement between the medieval measure and the modern
    // one is the thing drawn rather than something to infer across two panels.
    chordaDual(tonus, opts),
    // This chant's weight on each degree rides the tabula as its quiet
    // gloss — the panel stops being a scale in the abstract and becomes this
    // chant's scale, on an axis already drawn. Matched by pitch class, as
    // the panel already matches selection (plan-site-marks §4.1). The
    // affinity dissent rides the SUBHEADER, beside the mode name it tests —
    // not the middle of the page.
    chordaTabula(tonus, { ...opts,
      weights: state.score?.imprint?.pcDistribution ?? null }),
  );
}

function manusPanel() {
  const mode = modeOf(state.chant);
  const spn = selectedPitch();
  // The hand keys on midi, the monochord on spn — both name the same degree,
  // so the selection is translated rather than stored twice.
  const row = spn ? state.score?.tabula.find((r) => r.spn === spn) : null;
  const tune = { tuning: "meantone", comma: state.comma };
  const gamutRows = handRows(tonus, { mode, ...tune });
  // THE OCTAVE IS A TRANSPOSITION OF THE READING, NOT OF THE CHANT. The score,
  // the tables and every other panel keep the pitches the book prints; only
  // which JOINT a note is read at moves. So the shift is applied here, at the
  // two points where a chant pitch and a gamut row are matched, and nowhere
  // else — `state.score` is never rewritten.
  const shift = state.octave * 12;
  const raise = (spn_) => (!spn_ || !shift ? spn_ : spnAt(spn_, shift));
  // THE HAND CLAIMS NO JOINT IT CANNOT NAME. selectionFor's pitch-class
  // fallback is the monochord's law — one octave, where a class IS a degree —
  // and on the hand it silently promoted any note OUTSIDE the gamut to a
  // joint in another octave. Measured: 9,238 of the corpus's 21,817 distinct
  // sung pitches sit below their mode's gamut, so with octava off nearly half
  // the repertory lit a joint an octave above where it was sung — and the
  // octava button then moved the in-gamut notes and not these, which read as
  // "sometimes up, sometimes down". A note the gamut cannot place lights
  // NOTHING — absent, not a guess — and the octava button is the honest way
  // to bring a low chant onto the hand.
  const exactJoint = (spn_) => gamutRows.find((r) => r.spn === spn_)?.key;
  // Two absences, kept apart: NOTHING CHOSEN lets the hand rest on its own
  // default (the finalis), but a note CHOSEN AND UNPLACEABLE must light
  // nothing at all — passed as a key no row carries, because a nullish
  // `selected` would wake the default and dress the finalis as an answer.
  const opts = {
    mode, ...tune,
    selected: spn ? (exactJoint(raise(spn)) ?? "off-the-gamut") : undefined,
    onSelect: (key) => {
      const row = gamutRows.find((r) => r.key === key);
      // Back down into the chant's own octave to find the note that was
      // pointed at. The joint's OWN pitch, matched exactly in the chant where
      // the chant sings it: matching by pitch class handed back the first note
      // sharing the class, a lower octave than the one just pointed at.
      const want = shift ? spnAt(row?.spn, -shift) : row?.spn;
      const inChant = state.score?.tabula.find((t) => t.spn === want);
      selectPitch(inChant?.spn ?? want ?? null);
    },
  };
  // THE CHART DRIVES THE HAND. `piece` reads the hexachord in force at the
  // selected note; a named value pins it. Both end in the same argument, so
  // the hand knows nothing about where the choice came from.
  const rows = state.score?.tabula ?? [];
  const at = state.note != null ? state.note : null;
  const hexachord = state.hexachord;

  // Where each phrase begins, in notes — the divisions a mutation is read
  // against. The tabula is one row per note, and a phrase knows its own count.
  const phrases = [];
  let n = 0;
  for (const ph of state.score?.phrases ?? []) { n += ph.noteCount ?? 0; phrases.push(n); }

  // The ring CARRIES the hand: one figure, the piece around the outside and
  // the gamut it is read on at the centre. With no chant loaded there is no
  // piece to ring, so the hand stands on its own.
  const figure = hand(tonus, { ...opts, hexachord, route: state.route });
  return el("section", { class: "panel" },
    // The sigla list only the marks actually drawn: the ordo only while its
    // route is, the ring only when a piece is ringed around the hand.
    el("h2", {}, "manus et mutatio", keySpur(
      "The gamut's twenty places on the hand; around it, the piece rides the hexachord lanes, stepping where it mutates.",
      state.route && [marks.dashes(),
        "the ordo: the gamut's path, Γ up to ee, in the order a hand learns it"],
      [marks.ring(), "the chosen note"],
      rows.length && [marks.arc(), "the piece, by syllable; its lane is the hexachord it sings in"],
      rows.length && [marks.text("♮ ○ ♭"),
        "the lanes, outermost in: durum, naturale, molle; a step between lanes is a mutation"])),
    rows.length
      ? mutatio({ rows, note: at, phrases, centre: figure,
                  onSelect: (i) => selectNote(i) })
      : figure,
    handTabula(tonus, opts));
}

// ── selection ──
function openChant(chant) {
  state.chant = chant;
  state.note = null;
  try { state.score = tonus.notatio(chant); }
  catch { state.score = null; }
  state.view = "canticum";
  // A chant opens on the hexachord it opens in.
  const h = state.score?.tabula.find((r) => r.hexachord)?.hexachord;
  if (h) state.hexachord = h;
  render();
}

// ── the address bar is the state ──
function writeUrl() {
  const p = new URLSearchParams();
  if (state.view !== "calendarium") p.set("via", state.view);
  const dies = state.day.toISOString().slice(0, 10);
  if (dies !== "0991-06-01") p.set("dies", dies);
  if (state.chant) p.set("cantus", state.chant.id);
  if (state.notation !== "quadrata") p.set("notatio", state.notation);
  if (state.tracks.length) p.set("tracks", state.tracks.join(","));
  p.set("hexachordum", state.hexachord);
  if (!state.route) p.set("ordo", "0");
  // Only when narrowed — all three showing is the default, and saying so in
  // every link would put a parameter in the bar that changes nothing.
  if (state.offices.join(",") !== OFFICES_SHOWN.join(","))
    p.set("officia", state.offices.join(","));
  // Only when tempered — 0 is the default and saying so in every link
  // would put a parameter in the bar that changes nothing.
  if (state.comma) p.set("comma", state.comma.toFixed(4));
  const lectio = state.right[state.view];
  if (lectio) p.set("lectio", lectio);
  const q = p.toString();
  history.replaceState(null, "", q ? `?${q}` : location.pathname);
}

function readUrl() {
  const p = new URLSearchParams(location.search);
  if (p.get("via") === "canticum") state.view = "canticum";
  if (p.has("dies")) {
    const d = new Date(`${p.get("dies")}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) state.day = d;
  }
  const n = p.get("notatio");
  if (n === "moderna" || n === "quadrata") state.notation = n;
  if (p.get("ordo") === "0") state.route = false;
  const hx = p.get("hexachordum");
  if (HEXACHORDA.includes(hx)) state.hexachord = hx;
  if (p.has("tracks")) {
    state.tracks = p.get("tracks").split(",")
      .filter((t) => t === "prosodia" || t === "chironomia" || t === "tonarium");
  }
  if (p.has("officia")) {
    const keys = OFFICES.map((o) => o.key);
    const want = p.get("officia").split(",").filter((k) => keys.includes(k));
    // An empty or unrecognised list would leave the day looking chantless
    // through no choice of the reader's, so it falls back to all three.
    if (want.length) state.offices = want;
  }
  if (p.has("comma")) {
    const c = Number(p.get("comma"));
    // Anything outside the axis is not a temperament this page can draw.
    if (Number.isFinite(c) && c >= 0 && c <= COMMA_MAX) state.comma = c;
  }
  if (p.has("lectio")) state.right[state.view] = p.get("lectio");
  // A chant from the URL, or the standing one. Canticum with nothing loaded is
  // a column of empty panels — the whole view is a function of a chant — so it
  // opens on a piece rather than on the invitation to find one.
  const id = p.get("cantus") ?? DEFAULT_CANTUS;
  const [chant] = tonus.cantus({ id });
  if (chant) {
    state.chant = chant;
    try { state.score = tonus.notatio(chant); } catch { state.score = null; }
  }
}

// ── render ──
// CALENDARIUM FIRST, because it is where the app LANDS (state.view above) and
// the tab strip should read in the order a reader meets it. The two disagreed:
// Canticum sat first while Calendarium was the default, which is also why the
// URL omits `via` for Calendarium and prints it for Canticum. It is the right
// order on its own terms too — the calendar is how a chant is found, and the
// chant is what is then read.
const VIEWS = [
  { key: "calendarium", name: "Calendarium", build: calendarium, panels: calendariumPanels,
    heads: calendariumHeads },
  { key: "canticum", name: "Canticum", build: canticum, panels: canticumPanels,
    heads: canticumHeads },
];

function render() {
  const host = document.getElementById("view");
  const view = VIEWS.find((v) => v.key === state.view) ?? VIEWS[1];

  // The view switch is the SAME strip as the two panel strips, at title size.
  // It was a hand-built row of buttons that copied the strip's look and none
  // of its behaviour: `aria-selected` on a plain button with no `role="tab"`,
  // no `aria-controls`, and no arrow keys — in the one strip a keyboard
  // reaches first. Built by `tabs()` now, so the three cannot drift again.
  document.getElementById("views").replaceChildren(tabs({
    tabs: VIEWS.map((v) => ({ key: v.key, name: v.name })),
    active: state.view,
    label: "conspectus",
    variant: "large",
    stripOnly: true,
    controls: "view",
    onChange: (key) => { state.view = key; render(); },
  }));

  host.setAttribute("role", "tabpanel");
  host.setAttribute("aria-labelledby", `tab-conspectus-${view.key}`);
  host.replaceChildren(view.build());
  writeUrl();
}


readUrl();
render();

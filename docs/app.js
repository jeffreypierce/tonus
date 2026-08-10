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
import { dateDial } from "./components/dial.js";
import { chantList } from "./components/chant-row.js";
import { annulus, annulusTabula } from "./diagrams/annulus.js";
import { chorda, regula, chordaTabula } from "./diagrams/chorda.js";
import { hand, handTabula } from "./diagrams/hand.js";
import { rota, rotaTabula, rotaAspectTabula } from "./diagrams/rota.js";

const EPOCH = new Date(Date.UTC(991, 5, 1));   // the library's own default day

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
  tuning: "pythagorean",
  aspects: true,
  // The Sun is the mese, the middle string the rest are reckoned from — so
  // the wheel opens on it rather than on whatever sorted first.
  body: "Sun",
  doctrina: "boethius",
};

// Who says which sphere sounds what. Four schemes, each from its own text.
const DOCTRINAE = ["pythagoras", "boethius", "pliny", "ptolemy"];

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

const TUNINGS = ["pythagorean", "meantone", "equal",
  "ptolemy-intense", "ptolemy-soft", "ptolemy-equable"];

const modeOf = (chant) => Number(String(chant?.mode ?? "1").replace(/\D/g, "")) || 1;

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
      cells[0]?.replaceChildren(...(left ? [left] : []));
      if (right !== undefined) cells[1]?.replaceChildren(...(right ? [right] : []));
    };
    put(".row-title", heads.title);
    put(".row-detail", heads.detail, heads.rightDetail);
  }

  body.replaceChildren(
    el("div", { class: "cell" }, panels.left),
    el("div", { class: "cell" }, panels.right),
  );
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
  return el("p", { class: "sub" },
    n ? `Dies ${roman(n.day)} ${genitive}` : tempus);
}

/** The right column's quiet line: whatever the open reading has to say for
 *  itself — the feast's rank, or where the sky's weight is falling. */
function calendariumRightDetail(feast) {
  if (state.right.calendarium === "harmonia") return harmoniaDetail();
  // The rank alone: the grade is the machine code the ritus reduces to, and
  // printing both said the same thing twice in two registers.
  if (feast) return el("p", { class: "sub" }, feast.ritus ?? "");
  return el("p", { class: "sub" }, state.day.toISOString().slice(0, 10));
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
function calendariumHeads() {
  const [feast] = tonus.festum({ date: state.day });
  return {
    title: el("h1", {}, feast?.nomen ?? "—"),
    detail: calendariumDetail(feast),
    rightDetail: calendariumRightDetail(feast),
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
    el("div", { class: "settings filters" },
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
        }, `${o.name} ${n}`);
      })),
    shown.length
      ? chantList(tonus, shown.map((r) => r.chant), {
          selectedId: state.chant?.id,
          onSelect: openChant,
          // Which office a chant is sung at leads its line, now that the three
          // are mixed into one list — otherwise the row loses its context.
          label: (c) => all.find((r) => r.chant.id === c.id)?.office.name ?? null,
        })
      : el("p", { class: "ghost" }, "No office is shown."),
  );

  return {
    left,
    right: tabPanel({ tabs: readings, active: state.right.calendarium, label: "lectio" }),
  };
}

const calendariumReadings = (feast) => [
  { key: "harmonia", name: "Harmonia", panel: harmoniaPanel },
  { key: "festum", name: "Festum", panel: () => festumPanel(feast) },
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
    rightInputs: state.right.calendarium === "harmonia"
      ? el("div", { class: "settings" },
          el("span", { class: "set-name" }, "doctrina"),
          el("select", {
            "aria-label": "doctrina",
            onchange: (e) => { state.doctrina = e.target.value; renderPanels(); },
          }, ...DOCTRINAE.map((d) =>
            el("option", { value: d, selected: state.doctrina === d }, d))),
          el("span", { class: "set-name" }, "aspectus"),
          el("button", {
            type: "button", "aria-pressed": state.aspects ? "true" : "false",
            onclick: () => { state.aspects = !state.aspects; renderPanels(); },
          }, state.aspects ? "visibiles" : "occulti"))
      : null,
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
    // Only the wheel takes a click. The tables below it are a reading of the
    // selection, not a second way to make one — two controls for one piece of
    // state is how a page starts disagreeing with itself.
    onSelect: (k) => { state.body = k; renderPanels(); },
  };
  return el("div", {},
    rota(tonus, o),
    // The chords first: the aspects are what a click on the wheel lights up,
    // so the answer sits directly under the question.
    rotaAspectTabula(tonus, o),
    rotaTabula(tonus, o),
  );
}

/** The imprint as a bar: where this moment's sky pulls, and how hard.
 *
 *  The five attractor weights sum to one, so this is a true part-to-whole and
 *  the widths carry the reading: each cell is as wide as its share. No fill —
 *  a rule between cells is enough to divide them, and the row then sits in a
 *  subtitle without weighing more than the title above it.
 *
 *  A cell names itself when it has the room. Below about a tenth of the row a
 *  name and its percentage cannot be set inside without spilling, so it goes
 *  bare and the title carries it — a clipped label is worse than none. */
function harmoniaDetail() {
  let H;
  try { H = tonus.harmonia(tonus.caelum({ date: state.day }), { doctrina: state.doctrina }); }
  catch { return el("p", { class: "sub" }, ""); }

  const attractors = H.imprint?.attractors ?? [];
  if (!attractors.length) return el("p", { class: "sub" }, "");

  // The weights are normalised already; dividing by the sum keeps the row
  // full even if a future imprint hands back a partial set.
  const total = attractors.reduce((s, a) => s + a.weight, 0) || 1;

  return el("div", { class: "imprint" },
    el("span", { class: "set-name" }, "pitch attractors"),
    el("div", { class: "imprint-bar" },
      ...attractors.map((a) => {
        const share = a.weight / total;
        // The pitch class, not the pitch: the octave belongs to the sphere
        // that sounds it, and the attractor is the class the sky leans on.
        const name = a.pitch.spn.replace(/\d+$/, "").replace("b", "♭");
        const pct = `${(share * 100).toFixed(0)}%`;
        return el("span", {
          class: "imprint-seg",
          style: `flex: ${share.toFixed(5)}`,
          title: `${name} — ${(share * 100).toFixed(1)}%`,
        }, share >= 0.1
          ? [el("span", { class: "imprint-pitch" }, name),
             el("span", { class: "imprint-dot" }, "•"),
             el("span", { class: "imprint-pct" }, pct)]
          : "");
      })),
  );
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
  return el("div", {}, annulus(tonus, o), annulusTabula(tonus, o));
}

// ═══════════════════════════════════════════════════════════════════════════
// CANTICUM — a chant
// ═══════════════════════════════════════════════════════════════════════════

/** The two panels of Canticum. */
function canticumPanels() {
  if (!state.chant || !state.score) return { left: null, right: null };
  const readings = canticumReadings();
  return {
    left: scoreFigure(),
    right: tabPanel({ tabs: readings, active: state.right.canticum, label: "lectio" }),
  };
}

const canticumReadings = () => [
  { key: "temperamentum", name: "Temperamentum", panel: temperamentumPanel },
  { key: "manus", name: "Manus Guidonius", panel: manusPanel },
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

  const M = tonus.temperamentum({ mode, tuning: state.tuning }).modus(mode);

  return page({
    title: el("h1", {}, chant.incipit),
    rightTitle: tabs({
      label: "lectio", active: state.right.canticum, stripOnly: true,
      onChange: (k) => { state.right.canticum = k; render(); },
      tabs: readings,
    }),
    detail: el("p", { class: "sub" },
      [chant.genus, chant.modus, chant.source?.book].filter(Boolean).join(" \u00b7 ")),
    rightDetail: el("p", { class: "sub" },
      state.right.canticum === "temperamentum"
        ? [M.nomen, `finalis ${M.finalis.pitch.spn}`, `tenor ${M.reciting.pitch.spn}`].join(" \u00b7 ")
        : row ? `${row.spn} \u00b7 ${row.nomen ?? ""}` : "no note chosen"),
    inputs: el("div", { class: "settings" },
      el("span", { class: "set-name" }, "notatio"),
      el("select", { onchange: (e) => { state.notation = e.target.value; render(); } },
        ...["quadrata", "moderna"].map((v) =>
          el("option", { value: v, selected: state.notation === v }, v))),
      ...["chironomia", "tonarium"].map((name) => el("button", {
        type: "button",
        "aria-pressed": state.tracks.includes(name) ? "true" : "false",
        onclick: () => {
          state.tracks = state.tracks.includes(name)
            ? state.tracks.filter((t) => t !== name) : [...state.tracks, name];
          render();
        },
      }, name)),
    ),
    rightInputs: state.right.canticum === "temperamentum"
      ? el("div", { class: "settings" },
          el("span", { class: "set-name" }, "temperatura"),
          el("select", { onchange: (e) => { state.tuning = e.target.value; render(); } },
            ...TUNINGS.map((v) => el("option", { value: v, selected: state.tuning === v }, v))))
      : null,
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
    dropcap:    { family: "Junicode", weight: 700 },
    title:      { family: "Junicode", weight: 620 },
    annotation: { family: "Junicode", weight: 640 },
    lyric:      { family: "Junicode", weight: 400, scale: 1.06 },
  },
};

function scoreFigure() {
  const wrap = el("div", { class: "score" });
  // Measured, not assumed: the element is not in the document yet, so ask the
  // column it is about to join. Falling back to a fixed width is what made the
  // score overflow a narrower window on first paint.
  const width = Math.max(320, Math.round(measureColumn() ?? lastScoreWidth));
  try {
    const { svg, geometry } = tonus.inscriptio(state.score, {
      width,
      theme: SCORE_THEME,
      notation: state.notation,
      tracks: state.tracks.length ? state.tracks : undefined,
    });
    wrap.innerHTML = svg;
    const NS = "http://www.w3.org/2000/svg";
    const target = wrap.querySelector("svg");
    if (!target) return wrap;
    const layer = document.createElementNS(NS, "g");
    geometry.forEach((g, i) => {
      const cy = g.y + g.systemY;
      if (state.note === i) {
        const ring = document.createElementNS(NS, "circle");
        for (const [k, v] of Object.entries({
          cx: g.x, cy, r: 7, fill: "none", stroke: "#9E2B25", "stroke-width": "1.4",
        })) ring.setAttribute(k, v);
        layer.append(ring);
      }
      const hit = document.createElementNS(NS, "circle");
      for (const [k, v] of Object.entries({
        cx: g.x, cy, r: 8, fill: "#111", "fill-opacity": "0",
        cursor: "pointer", tabindex: "0", role: "button",
        "aria-label": `nota ${i + 1}`,
      })) hit.setAttribute(k, v);
      hit.addEventListener("click", () => { state.note = i; render(); });
      hit.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); state.note = i; render(); }
      });
      layer.append(hit);
    });
    target.append(layer);
  } catch (err) {
    wrap.append(el("p", { class: "ghost" }, `inscriptio: ${err.message}`));
  }
  watchWidth(wrap);
  return wrap;
}

// The width the score was last drawn at. Kept outside the render so a re-render
// does not start from a guess, and so the observer can tell a real change from
// the noise a scrollbar makes appearing and disappearing.
let lastScoreWidth = 880;
let scoreObserver = null;

/** The width the score's column will give it. Read from a cell already laid
 * out, since the score's own wrapper has no layout until it is appended. */
function measureColumn() {
  const cell = document.querySelector(".row-body .cell");
  const w = cell?.getBoundingClientRect?.().width;
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

function temperamentumPanel() {
  const mode = modeOf(state.chant);
  const row = state.note != null ? state.score?.tabula[state.note] : null;
  const opts = { mode, selected: row?.spn ?? undefined, tuning: state.tuning };
  const T = tonus.temperamentum({ mode, tuning: state.tuning });
  const M = T.modus(mode);

  return el("div", {},
    chorda(tonus, opts),
    regula(tonus, opts),
    chordaTabula(tonus, opts),
  );
}

function manusPanel() {
  const mode = modeOf(state.chant);
  const row = state.note != null ? state.score?.tabula[state.note] : null;
  const opts = { mode, selected: row ? String(row.midi) : undefined };
  return el("div", {}, hand(tonus, opts), handTabula(tonus, opts));
}

// ── selection ──
function openChant(chant) {
  state.chant = chant;
  state.note = null;
  try { state.score = tonus.notatio(chant); }
  catch { state.score = null; }
  state.view = "canticum";
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
  // Only when narrowed — all three showing is the default, and saying so in
  // every link would put a parameter in the bar that changes nothing.
  if (state.offices.join(",") !== OFFICES_SHOWN.join(","))
    p.set("officia", state.offices.join(","));
  if (state.tuning !== "pythagorean") p.set("temperatura", state.tuning);
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
  if (p.has("tracks")) {
    state.tracks = p.get("tracks").split(",")
      .filter((t) => t === "chironomia" || t === "tonarium");
  }
  if (p.has("officia")) {
    const keys = OFFICES.map((o) => o.key);
    const want = p.get("officia").split(",").filter((k) => keys.includes(k));
    // An empty or unrecognised list would leave the day looking chantless
    // through no choice of the reader's, so it falls back to all three.
    if (want.length) state.offices = want;
  }
  if (TUNINGS.includes(p.get("temperatura"))) state.tuning = p.get("temperatura");
  if (p.has("lectio")) state.right[state.view] = p.get("lectio");
  const id = p.get("cantus");
  if (id) {
    const [chant] = tonus.cantus({ id });
    if (chant) {
      state.chant = chant;
      try { state.score = tonus.notatio(chant); } catch { state.score = null; }
    }
  }
}

// ── render ──
const VIEWS = [
  { key: "canticum", name: "Canticum", build: canticum, panels: canticumPanels },
  { key: "calendarium", name: "Calendarium", build: calendarium, panels: calendariumPanels,
    heads: calendariumHeads },
];

function render() {
  const nav = document.getElementById("views");
  nav.replaceChildren(...VIEWS.map((v) => el("button", {
    type: "button",
    "aria-selected": state.view === v.key ? "true" : "false",
    onclick: () => { state.view = v.key; render(); },
  }, v.name)));

  const host = document.getElementById("view");
  const view = VIEWS.find((v) => v.key === state.view) ?? VIEWS[1];
  host.replaceChildren(view.build());
  writeUrl();
}


readUrl();
render();

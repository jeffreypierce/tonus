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
  // which tab is open where
  office: "proprium",
  right: { calendarium: "harmonia", canticum: "temperamentum" },
  // the few settings the toy carries
  notation: "quadrata",
  tracks: ["chironomia"],
  tuning: "pythagorean",
  aspects: true,
};

// ── the offices a day can be read by ──
const OFFICES = [
  { key: "proprium", name: "Proprium", of: (f) => tonus.proprium({ feast: f }) },
  { key: "ordinarium", name: "Ordinarium", of: (f) => tonus.ordinarium({ feast: f }) },
  { key: "officium", name: "Officium", of: (f) => tonus.officium({ feast: f, hora: "vesperae" }) },
];

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
function renderPanels() {
  const host = document.getElementById("view");
  const body = host.querySelector(".row-body");
  if (!body) { render(); return; }
  const view = VIEWS.find((v) => v.key === state.view) ?? VIEWS[1];
  const panels = view.panels?.();
  if (!panels) { render(); return; }
  body.replaceChildren(
    el("div", { class: "cell" }, panels.left),
    el("div", { class: "cell" }, panels.right),
  );
  writeUrl();
}

/** A key/value table — the shape half these panels want. */
function pairs(rows) {
  const t = el("table", { class: "tabula" });
  const b = el("tbody");
  for (const [k, v] of rows) {
    if (v == null || v === "") continue;
    b.append(el("tr", {}, el("td", {}, k), el("td", { class: "mono" }, String(v))));
  }
  t.append(b);
  return t;
}

// ═══════════════════════════════════════════════════════════════════════════
// CALENDARIUM — a day
// ═══════════════════════════════════════════════════════════════════════════

/** The two panels of Calendarium, which a moving date rebuilds on their own. */
function calendariumPanels() {
  const [feast] = tonus.festum({ date: state.day });
  const officeTabs = OFFICES.map((o) => ({
    key: o.key,
    name: o.name,
    panel: () => {
      let chants = [];
      try { chants = o.of(feast).filter((c) => c.gabc); } catch { chants = []; }
      if (!chants.length) return el("p", { class: "ghost" }, "Nothing is sung here today.");
      return chantList(tonus, chants, { selectedId: state.chant?.id, onSelect: openChant });
    },
  }));
  const readings = calendariumReadings(feast);
  return {
    left: feast ? tabs({
      label: "officium", active: state.office, variant: "quiet",
      onChange: (k) => { state.office = k; render(); },
      tabs: officeTabs,
    }) : el("p", { class: "ghost" }, "No feast at this date."),
    right: tabPanel({ tabs: readings, active: state.right.calendarium, label: "lectio" }),
  };
}

const calendariumReadings = (feast) => [
  { key: "harmonia", name: "Harmonia Mundi", panel: harmoniaPanel },
  { key: "festum", name: "Festum", panel: () => festumPanel(feast) },
  { key: "corpus", name: "Corpus", panel: corpusPanel },
];

function calendarium() {
  const [feast] = tonus.festum({ date: state.day });

  const officeTabs = OFFICES.map((o) => ({
    key: o.key,
    name: o.name,
    panel: () => {
      let chants = [];
      try { chants = o.of(feast).filter((c) => c.gabc); } catch { chants = []; }
      if (!chants.length) return el("p", { class: "ghost" }, "Nothing is sung here today.");
      return chantList(tonus, chants, { selectedId: state.chant?.id, onSelect: openChant });
    },
  }));

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
    detail: el("p", { class: "sub" }, feast?.tempus ?? feast?.season ?? ""),
    rightDetail: el("p", { class: "sub" },
      state.right.calendarium === "festum" && feast
        ? [feast.ritus, feast.grade].filter(Boolean).join(" · ")
        : state.day.toISOString().slice(0, 10)),
    // row 3 — what may be changed
    inputs: dateDial(state.day, (d) => {
      state.day = d;
      state.chant = null;
      // The panels only: the row this slider sits in must survive the drag.
      renderPanels();
    }),
    rightInputs: state.right.calendarium === "harmonia"
      ? el("div", { class: "settings" }, el("button", {
          type: "button", "aria-pressed": state.aspects ? "true" : "false",
          onclick: () => { state.aspects = !state.aspects; render(); },
        }, "aspectus"))
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
    onSelect: (k) => { state.body = k; render(); },
  };
  return el("div", {},
    rota(tonus, o),
    rotaTabula(tonus, o),
    rotaAspectTabula(tonus, { date: state.day }),
  );
}

function festumPanel(feast) {
  const year = state.day.getUTCFullYear();
  return el("div", {},
    annulus(tonus, {
      year, day: state.day, selected: state.anchor,
      onSelect: (key) => {
        const p = tonus.pascha(year);
        if (p[key]) { state.day = new Date(p[key]); state.anchor = key; state.chant = null; }
        render();
      },
    }),
    feast && pairs([
      ["nomen", feast.nomen], ["ritus", feast.ritus], ["gradus", feast.grade],
      ["tempus", feast.tempus], ["dies", feast.weekday],
      ["a", String(feast.seasonStart).slice(0, 10)],
      ["ad", String(feast.seasonEnd).slice(0, 10)],
    ]),
    annulusTabula(tonus, {
      year, day: state.day, selected: state.anchor,
      onSelect: (key) => {
        const p = tonus.pascha(year);
        if (p[key]) { state.day = new Date(p[key]); state.anchor = key; state.chant = null; }
        render();
      },
    }),
  );
}

function corpusPanel() {
  const c = tonus.corpus();
  const rows = (obj) => Object.entries(obj ?? {})
    .sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]);
  return el("div", {},
    pairs([["cantus", c.count], ["distincti", c.distinct], ["summa", c.total]]),
    el("h2", {}, "genera"), pairs(rows(c.genera)),
    el("h2", {}, "modi"), pairs(rows(c.modes)),
  );
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
  { key: "tabula", name: "Tabula", panel: tabulaPanel },
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
const SCORE_FONTS = {
  dropcap:    { family: "Junicode", weight: 700 },
  title:      { family: "Junicode", weight: 620 },
  annotation: { family: "Junicode", weight: 640 },
  lyric:      { family: "Junicode", weight: 400, scale: 1.06 },
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
      fonts: SCORE_FONTS,
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

/** The score's own tabula — a row per note, selection shared with the score. */
function tabulaPanel() {
  const t = el("table", { class: "tabula" });
  t.append(el("thead", {}, el("tr", {},
    ...["nota", "hz", "nomen", "neuma", "syllaba"].map((h) => el("th", {}, h)))));
  const b = el("tbody");
  state.score.tabula.forEach((r, i) => {
    const tr = el("tr", {
      class: state.note === i ? "sel" : null,
      tabindex: "0",
      onclick: () => { state.note = i; render(); },
      onkeydown: (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); state.note = i; render(); }
      },
    },
      el("td", { class: "mono" }, r.spn ?? ""),
      el("td", { class: "mono num" }, r.hz != null ? r.hz.toFixed(1) : ""),
      el("td", {}, r.nomen ?? ""),
      // A neume is a shape, not a string — the row wants what it is called.
      el("td", {}, r.neume?.type ?? ""),
      el("td", {}, r.lyric ?? ""),
    );
    b.append(tr);
  });
  t.append(b);
  return t;
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
  { key: "calendarium", name: "Calendarium", build: calendarium, panels: calendariumPanels },
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

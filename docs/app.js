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
import { el, tabs } from "./components/tabs.js";
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

function calendarium() {
  const [feast] = tonus.festum({ date: state.day });
  const dies = state.day.toISOString().slice(0, 10);

  // ── left: the day, and what it sings ──
  const left = el("div", { class: "column" });
  left.append(
    el("div", { class: "subject" },
      el("h1", {}, feast?.nomen ?? "—"),
      el("p", { class: "sub" }, feast?.tempus ?? feast?.season ?? ""),
    ),
    el("div", { class: "settings" },
      el("span", { class: "set-name" }, "dies"),
      el("input", {
        type: "date", value: dies, class: "date",
        onchange: (e) => {
          const d = new Date(`${e.target.value}T00:00:00Z`);
          if (!Number.isNaN(d.getTime())) { state.day = d; state.chant = null; render(); }
        },
      }),
    ),
  );

  if (feast) {
    left.append(tabs({
      label: "officium",
      active: state.office,
      onChange: (k) => { state.office = k; render(); },
      tabs: OFFICES.map((o) => ({
        key: o.key,
        name: o.name,
        panel: () => {
          let chants = [];
          try { chants = o.of(feast).filter((c) => c.gabc); } catch { chants = []; }
          if (!chants.length) {
            return el("p", { class: "ghost" }, "Nothing is sung here today.");
          }
          return chantList(tonus, chants, {
            selectedId: state.chant?.id,
            onSelect: openChant,
          });
        },
      })),
    }));

    // ── the day's census: every chant of it, together ──
    left.append(panel("census — the day", dayCensus(feast)));
  }

  // ── right: the readings ──
  const right = el("div", { class: "column" }, tabs({
    label: "lectio",
    active: state.right.calendarium,
    onChange: (k) => { state.right.calendarium = k; render(); },
    tabs: [
      { key: "harmonia", name: "Harmonia Mundi", panel: harmoniaPanel },
      { key: "festum", name: "Festum", panel: () => festumPanel(feast) },
      { key: "corpus", name: "Corpus", panel: corpusPanel },
    ],
  }));

  return el("div", { class: "columns" }, left, right);
}

/** The day's music against the corpus — chant by chant.
 *
 * Not as one averaged profile: a group's mean lands on the corpus mean, so
 * fifteen chants averaged read 0.96–0.99 on every dimension and say nothing.
 * What is worth seeing is the SPREAD — which of today's chants is ordinary and
 * which is singular. */
function dayCensus(feast) {
  const seen = new Map();
  for (const o of OFFICES) {
    try {
      for (const c of o.of(feast)) if (c.id && !seen.has(c.id)) seen.set(c.id, c);
    } catch { /* this office has nothing today */ }
  }

  const rows = [];
  for (const [id, chant] of seen) {
    try { rows.push({ chant, census: tonus.census({ id, k: 0 }) }); } catch { /* no block */ }
  }
  if (!rows.length) return el("p", { class: "ghost" }, "No census for today's music.");
  rows.sort((a, b) => a.census.balance.distance - b.census.balance.distance);

  const table = el("table", { class: "tabula" });
  table.append(el("thead", {}, el("tr", {},
    el("th", {}, "cantus"),
    el("th", { class: "num" }, "distantia"),
    el("th", {}, "deviant"),
  )));
  const body = el("tbody");
  for (const { chant, census } of rows) {
    body.append(el("tr", {
      class: state.chant?.id === chant.id ? "sel" : null,
      tabindex: "0",
      onclick: () => openChant(chant),
      onkeydown: (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openChant(chant); }
      },
    },
      el("td", {}, chant.incipit,
        el("span", { class: "gloss" }, chant.modus ?? "")),
      el("td", { class: "mono num" }, census.balance.distance.toFixed(3)),
      el("td", { class: "gloss" }, census.balance.deviantGroups[0] ?? ""),
    ));
  }
  table.append(body);

  const near = rows[0], far = rows[rows.length - 1];
  return el("div", {},
    table,
    el("p", { class: "note" },
      `${rows.length} of today's chants carry a census block. ` +
      `${near.chant.incipit} is the most ordinary of them; ` +
      `${far.chant.incipit} the most singular.`),
  );
}

function harmoniaPanel() {
  const o = {
    date: state.day,
    aspects: state.aspects,
    selected: state.body,
    onSelect: (k) => { state.body = k; render(); },
  };
  return el("div", {},
    el("div", { class: "settings" },
      el("button", {
        type: "button", "aria-pressed": state.aspects ? "true" : "false",
        onclick: () => { state.aspects = !state.aspects; render(); },
      }, "aspectus"),
    ),
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

function canticum() {
  const left = el("div", { class: "column" });

  if (!state.chant || !state.score) {
    left.append(el("p", { class: "ghost" }, "Choose a chant in Calendarium."));
    return el("div", { class: "columns" }, left, el("div", { class: "column" }));
  }

  const { chant } = state.score;
  left.append(
    el("div", { class: "subject" },
      el("h1", {}, chant.incipit),
      el("p", { class: "sub" },
        [chant.genus, chant.modus, chant.source?.book].filter(Boolean).join(" · ")),
    ),
    el("div", { class: "settings" },
      el("span", { class: "set-name" }, "notatio"),
      el("select", {
        onchange: (e) => { state.notation = e.target.value; render(); },
      }, ...["quadrata", "moderna"].map((v) =>
        el("option", { value: v, selected: state.notation === v }, v))),
      el("span", { class: "set-name" }, "tracks"),
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
    scoreFigure(),
    panel("census", chantCensus(chant)),
  );

  const right = el("div", { class: "column" }, tabs({
    label: "lectio",
    active: state.right.canticum,
    onChange: (k) => { state.right.canticum = k; render(); },
    tabs: [
      { key: "temperamentum", name: "Temperamentum", panel: temperamentumPanel },
      { key: "manus", name: "Manus Guidonius", panel: manusPanel },
      { key: "tabula", name: "Tabula", panel: tabulaPanel },
    ],
  }));

  return el("div", { class: "columns" }, left, right);
}

/** The score, with a hit disc over every notehead. */
function scoreFigure() {
  const wrap = el("div", { class: "score" });
  try {
    const { svg, geometry } = tonus.inscriptio(state.score, {
      width: 880,
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
  return wrap;
}

function chantCensus(chant) {
  let c;
  try { c = tonus.census({ id: chant.id }); }
  catch { return el("p", { class: "ghost" }, "This chant carries no census block."); }

  const near = c.neighbors
    .map((n) => ({ n, chant: tonus.cantus({ id: n.id })[0] }))
    .filter((x) => x.chant);

  return el("div", {},
    pairs([
      ["distantia", c.balance.distance.toFixed(4)],
      ["deviant", c.balance.deviantGroups.slice(0, 3).join(", ")],
      ...Object.entries(c.profile)
        .map(([g, p]) => [g, p.typicality.toFixed(3)]),
    ]),
    near.length && el("h2", {}, "vicini"),
    near.length && chantList(tonus, near.map((x) => x.chant), {
      onSelect: openChant,
      aside: (ch) => near.find((x) => x.chant.id === ch.id)?.n.similarity.toFixed(3),
    }),
  );
}

function temperamentumPanel() {
  const mode = modeOf(state.chant);
  const row = state.note != null ? state.score?.tabula[state.note] : null;
  const opts = { mode, selected: row?.spn ?? undefined, tuning: state.tuning };
  const T = tonus.temperamentum({ mode, tuning: state.tuning });
  const M = T.modus(mode);

  return el("div", {},
    el("div", { class: "settings" },
      el("span", { class: "set-name" }, "temperatura"),
      el("select", { onchange: (e) => { state.tuning = e.target.value; render(); } },
        ...TUNINGS.map((v) => el("option", { value: v, selected: state.tuning === v }, v))),
    ),
    pairs([
      ["modus", M.nomen ?? mode], ["maneria", M.maneria],
      ["finalis", M.finalis.pitch.spn], ["tenor", M.reciting.pitch.spn],
      ["ambitus", M.ambitusNotes?.length],
    ]),
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
  { key: "canticum", name: "Canticum", build: canticum },
  { key: "calendarium", name: "Calendarium", build: calendarium },
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

// ---------------------------------------------------------------------------
// docs/components/dial — a date, typed or stepped, and three places to jump
// ---------------------------------------------------------------------------
// IN THE SYSTEM: this file carries RULE 1 and RULE 3 side by side, and the
// contrast between them is the point. (The rules are stated at the top of
// styles.css.)
//
//   THE FIELD holds a value, so it wears a box — one edge around the date and
//   its two spurs, divided by hairlines. The spurs step the value and hold
//   nothing, so they carry no edge of their own: rule 3.
//
//   THE ANCHOR LINKS ARE GONE (2026-08-12). Nativitas, Pascha and Pentecoste
//   sat here as three jump links, and they crowded the row for a reach the
//   ring in Festum already gives: every turning of the year is selectable
//   there, on the figure that shows where it falls.
//
// The whole page is a function of one date, so this input has two jobs that
// pull against each other: land on a named day exactly, and wander from it a
// day at a time to watch the chants and the sky change underneath.
//
// Three sliders did only the second, and did it badly at the year: 1600 years
// across a few hundred pixels put roughly eight years under every pixel, so a
// particular year could not be hit at all — only swept past. A typed field
// does the first job perfectly and the second not at all, which is why the
// spurs sit beside it: click to walk, type to arrive.
//
// THE INPUT OUTLIVES A RENDER. Typing fires `change` and the page redraws; a
// field rebuilt each time would lose focus and the caret mid-entry. The
// element is built once, kept, and its value written in place — the rest of
// the page redraws around it. This is also why `syncDateDial` exists: a day
// chosen elsewhere has to be told to the field rather than rebuilt into it.

import { el } from "./tabs.js";

const iso = (d) => `${String(d.getUTCFullYear()).padStart(4, "0")}`
  + `-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
  + `-${String(d.getUTCDate()).padStart(2, "0")}`;

let dial = null;

/**
 * @param {Date} date                     the day, read in UTC
 * @param {(d: Date) => void} onChange    fires when the date lands
 * @param {object} [opts]
 * @param {object} [opts.anchors]         a `tonus.pascha(year)` record
 * @param {string} [opts.anchor]          which anchor is current, if any
 */
export function dateDial(date, onChange, { anchors, anchor } = {}) {
  if (!dial) dial = build();
  dial.onChange = onChange;
  dial.sync(date, anchors, anchor);
  return dial.node;
}

/** Move the dial to a date chosen ELSEWHERE — a ring anchor, a table row.
 *
 *  The dial deliberately outlives a render, so a repaint that leaves the input
 *  row alone (which is what lets a drag survive) also leaves the field showing
 *  the day the reader has just navigated away from. This tells it, without
 *  rebuilding the element the pointer may be holding. */
export function syncDateDial(date, { anchors, anchor } = {}) {
  dial?.sync(date, anchors, anchor);
}

function build() {
  const made = {};

  // A date field parses and validates for us, and gives a picker for free.
  // `min` reaches back past the corpus so a medieval year is typeable at all —
  // the default epoch is 991, which most date pickers will not offer.
  const field = el("input", {
    type: "date", class: "dial-date", "aria-label": "dies",
    min: "0001-01-01", max: "9999-12-31",
  });

  const step = (n, label, glyph) => el("button", {
    type: "button", class: "dial-step", "aria-label": label,
    onclick: () => made.walk(n),
  }, glyph);

  // ONE FIELD, TWO SPURS.
  //
  // The arrows and the date are one object: a value with two ways of nudging
  // it, inside a single edge, divided by hairlines. They were three detached
  // boxes at three type sizes (13.5px arrows around an 11px date), which read
  // as three unrelated controls for one reading of one value.
  made.node = el("div", { class: "dials" },
    el("div", { class: "field" },
      step(-1, "dies prior", "‹"), field, step(1, "dies posterior", "›")),
  );

  /** A typed or picked date. Empty or unparseable input is left alone — the
   *  field keeps what the user is mid-way through typing. */
  field.addEventListener("change", () => {
    const [y, m, d] = field.value.split("-").map(Number);
    if (!y || !m || !d) return;
    made.set(new Date(Date.UTC(y, m - 1, d)));
  });

  /** Walk a day at a time, from the date the dial itself holds.
   *
   *  This deliberately does NOT read the field. A caller may repaint the page
   *  around this input without rebuilding it — that is the whole reason the
   *  element outlives a render — and in that case `sync` never runs and the
   *  field still shows the day we started from. Stepping off the DOM value
   *  therefore computed the same tomorrow forever: the first click moved, and
   *  every one after it repeated that first move. The dial owns the date; the
   *  field is a view of it. */
  made.walk = (n) => {
    if (!made.date) return;
    made.set(new Date(made.date.getTime() + n * 86400000));
  };

  /** Move, remember, and tell — the one path by which this dial changes date. */
  made.set = (date, anchor) => {
    made.date = date;
    field.value = iso(date);
    made.onChange?.(date, anchor);
  };

  /** Take a date from outside — an anchor, the year ring, a link opened. Never
   *  overwrites the field while it holds the caret, so typing is not fought. */
  made.sync = (date, anchors, current) => {
    made.date = date;
    if (document.activeElement !== field) field.value = iso(date);
  };

  return made;
}

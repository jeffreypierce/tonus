// ---------------------------------------------------------------------------
// docs/components/chant-row — a chant, listed
// ---------------------------------------------------------------------------
// The row that appears wherever chants are offered: the day's music in
// Calendarium, a chant's census neighbours in Canticum.
//
// IN THE SYSTEM: this is where STATE is spelled out most fully, and the
// styling lives in styles.css under `.chant-row`. A list of chants is a list
// of CHOICES, so the ones not taken sit at --label and the one taken comes
// forward in full ink.
//
//   HOVER DARKENS  the row's rule --rule → --edge, the name → --ink
//   SELECTED       a 2px ink bar in the margin, the row on --paper-lit
//
// Nothing fills. A wash would also fight the incipit drawn in the same row,
// which is the second reason it is gone.
//
// THE GEOMETRY IS LOAD-BEARING. The music starts at the 40% mark and runs to
// the edge, which means the LEFT column is the fixed one — sizing the right
// instead lets the gap shift where the music begins, and the column stops
// reading as notation and starts reading as ragged fragments. The row carries
// no horizontal padding for the same reason; the text column takes its own
// inset. See the comment on `.chant-row button` before changing either.
//
// The render is the library's, at a small staff: notatio then inscriptio, the
// same call the full score makes. Cached per id, because a list of neighbours
// re-renders whenever anything else on the page moves and the notation for a
// given chant never changes.

import { el } from "./tabs.js";

const cache = new Map();   // id → { svg, score }

/** The row's render, cached WHOLE: the markup and the score it came from.
 *
 * The cache used to keep only the SVG and throw the score away — but
 * `.prosody` and `.imprint` ride every score, so keeping it makes a chant's
 * numbers free to anything else that wants them (the Census reading reads
 * a whole day through this), at a cost the incipit is already paying.
 *
 * The markup half is still MARKUP, not a node: a node can only be in one
 * place, so handing a cached one out twice moves it out of the first list
 * into the second. That reasoning does not bar the score — it is data,
 * read rather than adopted. Failures degrade each half to null alone: a
 * score whose drawing throws is still a score. */
function entryOf(tonus, chant, { scale = 18 } = {}) {
  let e = cache.get(chant.id);
  if (e === undefined) {
    let score = null, svg = null;
    try {
      score = tonus.notatio(chant);
      // Rendered as ONE long system and clipped by the box it sits in. Passing
      // a narrow width instead wraps the whole chant into five stacked staves,
      // which is a score, not an incipit — the row wants the first few notes,
      // and the cheapest true way to get them is to draw the line and show its
      // beginning.
      //
      // `scale` is the staff height. It replaced `staffHeight`/`noteScale`,
      // which this row went on passing after they were removed — an unknown
      // option is ignored rather than refused, so every incipit was quietly
      // drawn at the full default size and clipped by its box.
      svg = tonus.inscriptio(score, {
        scale,
        // Junicode by REFERENCE — the page loads the face, the SVG only names
        // it. Nothing is embedded here or in the full score.
        //
        // It goes under `theme`, like the score's. Passed flat it was ignored
        // in the same silent way as staffHeight above, and every incipit fell
        // back to the emitter's default serif stack.
        theme: { fonts: { lyric: { family: "Junicode", weight: 400, scale: 1.06 } } },
      }).svg;
    } catch { /* either call failing leaves that half absent */ }
    e = { svg, score };
    cache.set(chant.id, e);
  }
  return e;
}

/** A chant's score, from the same cache the incipit fills — the reason the
 *  cache keeps it. Null when the gabc will not parse. */
export function scoreOf(tonus, chant) {
  return entryOf(tonus, chant).score;
}

/** The first notes, drawn small. Failures degrade to a dash rather than
 * throwing — a chant whose gabc will not parse should not empty the list. */
function incipit(tonus, chant, opts) {
  const { svg } = entryOf(tonus, chant, opts);
  if (svg == null) return el("span", { class: "ghost" }, "—");
  const node = el("span", { class: "incipit" });
  node.innerHTML = svg;
  return node;
}

/**
 * One chant in a list.
 *
 * @param {object} tonus
 * @param {object} chant                  a Chant from the corpus
 * @param {object} [opts]
 * @param {boolean} [opts.selected]
 * @param {string}  [opts.aside]          a number to set at the right — a
 *                                        census similarity, say
 * @param {string}  [opts.label]          what this chant is here AS — the
 *                                        office it is sung at, when a list
 *                                        mixes several
 * @param {boolean} [opts.length]         append the note count to the subline
 * @param {(chant: object) => void} [opts.onSelect]
 */
export function chantRow(tonus, chant, { selected = false, aside, label, length = false, onSelect } = {}) {
  // What a chant IS, not which book it was copied from: the source code ("ky",
  // "gr") named a shelf the reader cannot see. An ordinary is named by its own
  // text — Gloria, Credo — which REPLACES its genus rather than joining it,
  // every ordinary's genus being the word "Ordinarium" over again.
  const kind = chant.ordinarium || chant.genus;
  // The note count and melisma figures were BUILT here at five marks and CUT
  // the same evening (2026-08-11): a bare number in a list has no header to
  // say what it is, and the line has no room for one — "random numbers don't
  // help anyone." The score cache that made them free stays; the Census
  // reading feeds on it.
  //
  // LENGTH COMES BACK, carrying its own unit. It is the one figure that
  // survives that ruling: "67 notes" needs no header, because the word IS the
  // header — which is exactly what the cut numbers lacked.
  //
  // It answers the question the row cannot otherwise: the incipit draws only
  // the opening, so a 33-note antiphon and a 194-note responsory look alike
  // down the column. Measured over 120 Similes lists, the count spreads a
  // median 78 notes within a single one. Opt-in, because a list that has no
  // room for it should not pay for it.
  // A NON-BREAKING SPACE holds the figure to its unit. The day's list carries
  // an office label too, so the line can run to four fields and wrap — and it
  // broke between "125" and "notes", orphaning the word that does the
  // labelling and leaving a bare number on a line of its own, which is the
  // very thing that got the earlier figures cut.
  const notes = length ? scoreOf(tonus, chant)?.prosody?.noteCount : null;
  // THE OFFICE LEAVES THE SUBLINE. It is a CATEGORY, not a property of the
  // chant the way its genus and mode are, and at the head of the line it was
  // the first thing read on every row while being the field that varies
  // least. It rides the notation's tail end instead (see .chant-row-cat),
  // where the staff has run out and there is white to sit in.
  const meta = [kind, chant.modus, notes != null && `${notes} notes`]
    .filter(Boolean).join(" · ");

  // Name first, notation last. A list is scanned down its left edge, and what
  // a reader is scanning for is the chant's name — the incipit is what they
  // check once they have found it, so it sits at the end of the line.
  return el("li", { class: "chant-row", "aria-selected": selected ? "true" : "false" },
    el("button", { type: "button", onclick: () => onSelect?.(chant) },
      // Text and aside share the left half; the notation owns the right. Two
      // grid columns, not three, so the staff's left edge lands on the
      // halfway mark exactly — a third column between them would push the
      // music off that vertical by its own width and gap.
      el("span", { class: "chant-row-head" },
        el("span", { class: "chant-row-text" },
          el("span", { class: "chant-row-name" }, chant.incipit),
          el("span", { class: "chant-row-meta" }, meta || chant.id),
        ),
        aside != null && el("span", { class: "chant-row-aside" }, aside),
      ),
      // The notation, with the office boxed over its tail. The box is
      // POSITIONED rather than given a column of its own: the comment above
      // holds, and a third column would push the staff off the halfway mark
      // by its own width. It is the notation's last inch that it covers,
      // where a one-line incipit has already run out of notes.
      el("span", { class: "chant-row-music" },
        incipit(tonus, chant),
        label && el("span", { class: "chant-row-cat" }, label),
      ),
    ),
  );
}

/** A list of them. */
export function chantList(tonus, chants, { selectedId, onSelect, aside, label, length } = {}) {
  const list = el("ul", { class: "chant-list" });
  for (const c of chants) {
    list.append(chantRow(tonus, c, {
      selected: c.id === selectedId,
      aside: aside?.(c),
      label: label?.(c),
      length,
      onSelect,
    }));
  }
  return list;
}

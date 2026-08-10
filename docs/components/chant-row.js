// ---------------------------------------------------------------------------
// docs/components/chant-row — a chant, listed
// ---------------------------------------------------------------------------
// The row that appears wherever chants are offered: the day's music in
// Calendarium, a chant's census neighbors in Canticum. Its incipit is drawn
// as real notation rather than named — a few notes of the actual melody, which
// is how a chant is recognised.
//
// The render is the library's, at a small staff: notatio then inscriptio, the
// same call the full score makes. Cached per id, because a list of neighbors
// re-renders whenever anything else on the page moves and the notation for a
// given chant never changes.

import { el } from "./tabs.js";

const cache = new Map();

/** The first notes, drawn small. Failures degrade to a dash rather than
 * throwing — a chant whose gabc will not parse should not empty the list.
 *
 * The cache holds MARKUP, not a node: a node can only be in one place, so
 * handing the cached one out twice moves it out of the first list into the
 * second. Markup is inert and each row builds its own element from it. */
function incipit(tonus, chant, { scale = 18 } = {}) {
  let svg = cache.get(chant.id);
  if (svg === undefined) {
    try {
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
      svg = tonus.inscriptio(tonus.notatio(chant), {
        scale,
        // Junicode by REFERENCE — the page loads the face, the SVG only names
        // it. Nothing is embedded here or in the full score.
        //
        // It goes under `theme`, like the score's. Passed flat it was ignored
        // in the same silent way as staffHeight above, and every incipit fell
        // back to the emitter's default serif stack.
        theme: { fonts: { lyric: { family: "Junicode", weight: 400, scale: 1.06 } } },
      }).svg;
    } catch {
      svg = null;
    }
    cache.set(chant.id, svg);
  }
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
 * @param {(chant: object) => void} [opts.onSelect]
 */
export function chantRow(tonus, chant, { selected = false, aside, label, onSelect } = {}) {
  // What a chant IS, not which book it was copied from: the source code ("ky",
  // "gr") named a shelf the reader cannot see. An ordinary is named by its own
  // text — Gloria, Credo — which REPLACES its genus rather than joining it,
  // every ordinary's genus being the word "Ordinarium" over again.
  const kind = chant.ordinarium || chant.genus;
  const meta = [label, kind, chant.modus].filter(Boolean).join(" · ");

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
      incipit(tonus, chant),
    ),
  );
}

/** A list of them. */
export function chantList(tonus, chants, { selectedId, onSelect, aside, label } = {}) {
  const list = el("ul", { class: "chant-list" });
  for (const c of chants) {
    list.append(chantRow(tonus, c, {
      selected: c.id === selectedId,
      aside: aside?.(c),
      label: label?.(c),
      onSelect,
    }));
  }
  return list;
}

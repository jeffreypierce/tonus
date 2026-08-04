// ---------------------------------------------------------------------------
// docs/components/chant-row — a chant, listed
// ---------------------------------------------------------------------------
// The row that appears wherever chants are offered: the day's music in
// Calendarium, a chant's census neighbours in Canticum. Its incipit is drawn
// as real notation rather than named — a few notes of the actual melody, which
// is how a chant is recognised.
//
// The render is the library's, at a small staff: notatio then inscriptio, the
// same call the full score makes. Cached per id, because a list of neighbours
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
function incipit(tonus, chant, { staffHeight = 20 } = {}) {
  let svg = cache.get(chant.id);
  if (svg === undefined) {
    try {
      // Rendered as ONE long system and clipped by the box it sits in. Passing
      // a narrow width instead wraps the whole chant into five stacked staves,
      // which is a score, not an incipit — the row wants the first few notes,
      // and the cheapest true way to get them is to draw the line and show its
      // beginning.
      svg = tonus.inscriptio(tonus.notatio(chant), { staffHeight, noteScale: 0.7 }).svg;
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
 * @param {(chant: object) => void} [opts.onSelect]
 */
export function chantRow(tonus, chant, { selected = false, aside, onSelect } = {}) {
  const meta = [chant.genus, chant.modus, chant.source?.code]
    .filter(Boolean).join(" · ");

  return el("li", { class: "chant-row", "aria-selected": selected ? "true" : "false" },
    el("button", { type: "button", onclick: () => onSelect?.(chant) },
      incipit(tonus, chant),
      el("span", { class: "chant-row-text" },
        el("span", { class: "chant-row-name" }, chant.incipit),
        el("span", { class: "chant-row-meta" }, meta || chant.id),
      ),
      aside != null && el("span", { class: "chant-row-aside" }, aside),
    ),
  );
}

/** A list of them. */
export function chantList(tonus, chants, { selectedId, onSelect, aside } = {}) {
  const list = el("ul", { class: "chant-list" });
  for (const c of chants) {
    list.append(chantRow(tonus, c, {
      selected: c.id === selectedId,
      aside: aside?.(c),
      onSelect,
    }));
  }
  return list;
}

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
 * throwing — a chant whose gabc will not parse should not empty the list. */
function incipit(tonus, chant, { width = 260, staffHeight = 20 } = {}) {
  if (cache.has(chant.id)) return cache.get(chant.id).cloneNode(true);
  let node;
  try {
    const score = tonus.notatio(chant);
    const { svg } = tonus.inscriptio(score, { width, staffHeight, noteScale: 0.7 });
    node = el("span", { class: "incipit" });
    node.innerHTML = svg;
  } catch {
    node = el("span", { class: "ghost" }, "—");
  }
  cache.set(chant.id, node);
  return node.cloneNode(true);
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

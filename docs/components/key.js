// ---------------------------------------------------------------------------
// docs/components/key — the sigla: what a figure's marks mean, on request
// ---------------------------------------------------------------------------
// One idiom for every figure that carries marks: a thin-ringed ? at the right
// of the figure's title line, opening a small card of entries — THE ACTUAL
// DRAWN MARK, as a swatch in the figure's own ink, then its word in the
// serif. The reader matches ink to ink, not a unicode stand-in to a shape.
//
// ON REQUEST, not furniture: the always-on key lines and their global switch
// were built and rejected the same evening ("i don't like the sigla
// interaction") — a key is something a reader asks for once, so every key is
// a popover and there is nothing to toggle. The tracks' reading instruction
// shares the same spur and card through popover() below.
//
// Named sigla as a critical edition names the page that decodes its symbols
// (ruled 2026-08-11; clavis is the clef, legenda the saints' lives).

import { el } from "./tabs.js";
import { INK, RUBRICA, STRATUM, STROKE } from "../diagrams/ink.js";

const NS = "http://www.w3.org/2000/svg";

function n(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}

/** A swatch's little canvas — one size, so the marks line up down a card. */
function sw(...kids) {
  const svg = n("svg", { class: "key-swatch", viewBox: "0 0 16 14",
    width: 16, height: 14, "aria-hidden": "true" });
  for (const k of kids) svg.append(k);
  return svg;
}

/** The marks a key can show — each drawn exactly as its figure draws it. */
export const marks = {
  /** The comb's corpus mark: an ink upright. */
  upright: () => sw(n("line", { x1: 8, y1: 2, x2: 8, y2: 12,
    stroke: INK, "stroke-width": STROKE.firm * 2 })),
  /** A rubrica-ringed circle — the comb's own-kind mark, the chosen note. */
  ring: () => sw(n("circle", { cx: 8, cy: 7, r: 4,
    fill: "var(--paper, #FDFDFC)", stroke: RUBRICA,
    "stroke-width": STROKE.firm * 2 })),
  /** The comb's gap segment: heavy ink, washed. */
  gap: () => sw(n("line", { x1: 2, y1: 7, x2: 14, y2: 7,
    stroke: INK, "stroke-opacity": STRATUM.bracket,
    "stroke-width": STROKE.heavy * 2 })),
  /** The weight chart's stem. */
  stem: () => sw(n("line", { x1: 8, y1: 2, x2: 8, y2: 12,
    stroke: INK, "stroke-opacity": STRATUM.wave, "stroke-width": 4 })),
  /** The final's rubrica triangle, pointing down at its stem. */
  finial: () => sw(n("path", { d: "M 3.5 4 L 12.5 4 L 8 11 Z", fill: RUBRICA })),
  /** A rubrica upright — the chosen degree on the string. */
  rubric: () => sw(n("line", { x1: 8, y1: 2, x2: 8, y2: 12,
    stroke: RUBRICA, "stroke-width": STROKE.heavy * 2 })),
  /** The ordo's dashed route, with its direction. */
  dashes: () => sw(
    n("line", { x1: 1, y1: 7, x2: 11, y2: 7, stroke: INK,
      "stroke-opacity": STRATUM.wave, "stroke-width": STROKE.firm * 2,
      "stroke-dasharray": "3 2" }),
    n("path", { d: "M 11 3.5 L 15 7 L 11 10.5", fill: "none", stroke: INK,
      "stroke-opacity": STRATUM.wave, "stroke-width": STROKE.firm * 2 })),
  /** The mutatio ring: the piece around the hand. */
  arc: () => sw(n("path", { d: "M 2 12 A 9 9 0 0 1 14 12", fill: "none",
    stroke: INK, "stroke-opacity": STRATUM.wave,
    "stroke-width": STROKE.firm * 2 })),
  /** The annulus's season band: a thick arc of the ring's own wash. */
  band: () => sw(n("path", { d: "M 2 11 A 9 9 0 0 1 16 11", fill: "none",
    stroke: INK, "stroke-opacity": STRATUM.block,
    "stroke-width": 5 })),
  /** A feast on the orbit: an ink dot. Larger ones are the greater feasts. */
  dot: () => sw(n("circle", { cx: 8, cy: 7, r: 2.6,
    fill: INK, "fill-opacity": STRATUM.letters })),
  /** The chosen feast: a rubricated roundel, the one colour the ring spends. */
  roundel: () => sw(
    n("circle", { cx: 8, cy: 7, r: 5, fill: "none", stroke: RUBRICA,
      "stroke-width": STROKE.fine * 2 }),
    n("circle", { cx: 8, cy: 7, r: 2.4, fill: RUBRICA })),
  /** The standing day: a rubrica radius out through the ring, with its dot. */
  radius: () => sw(
    n("line", { x1: 8, y1: 13, x2: 8, y2: 3, stroke: RUBRICA,
      "stroke-opacity": STRATUM.spark, "stroke-width": STROKE.firm * 2 }),
    n("circle", { cx: 8, cy: 6, r: 2.4, fill: RUBRICA })),
  /** The rota's aspect chord: a line across the wheel, weighted by strength. */
  chord: () => sw(n("line", { x1: 2, y1: 11, x2: 14, y2: 3,
    stroke: INK, "stroke-opacity": STRATUM.spark,
    "stroke-width": STROKE.firm * 2 })),
  /** A mark that IS text — a ratio, a letter — set as the figure sets it. */
  text: (t, { italic = false } = {}) =>
    el("span", { class: `key-mark${italic ? " key-italic" : ""}` }, t),
};

/** THE popover: a ringed ? spur and the card it opens. Content is built at
 *  open time by `fill`, so a card always shows the current state. Esc and
 *  click-away close it; the spur keeps `aria-expanded` and takes focus back.
 *  The one popover idiom on the site — the keys and the tracks both wear it. */
export function popover(ariaLabel, fill) {
  const card = el("div", { class: "key-card", role: "note", hidden: "" });
  const spur = el("button", { type: "button", class: "key-spur",
    "aria-expanded": "false", "aria-label": ariaLabel }, "?");
  const close = () => {
    card.setAttribute("hidden", "");
    spur.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("pointerdown", onAway);
    spur.focus();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  const onAway = (e) => {
    if (!card.contains(e.target) && e.target !== spur) close();
  };
  spur.addEventListener("click", () => {
    if (!card.hasAttribute("hidden")) { close(); return; }
    card.replaceChildren(...fill());
    card.removeAttribute("hidden");
    spur.setAttribute("aria-expanded", "true");
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onAway);
  });
  return el("span", { class: "key-info" }, spur, card);
}

/**
 * A figure's key, as a spur. The first argument is the card's TOP LINE — one
 * short sentence saying what the figure draws, in its own style — then the
 * entries, [mark, word] pairs; falsy entries are dropped so callers can pass
 * conditionals; an empty list yields no spur at all — a figure with nothing
 * to decode wears nothing.
 */
export function keySpur(desc, ...entries) {
  const live = entries.filter(Boolean);
  if (!live.length) return null;
  return popover("what the marks mean", () => [
    el("p", { class: "key-desc" }, desc),
    // A third element GLOSSES the entry: the word names the mark, the gloss
    // says what it measures. Optional, so a mark whose word is self-evident
    // ("the corpus", "the gap") stays a bare line and is not padded out.
    ...live.map(([mark, word, gloss]) =>
      el("p", { class: "key-entry" }, ...(mark ? [mark, " "] : []), word,
        ...(gloss ? [el("span", { class: "key-gloss" }, gloss)] : []))),
  ]);
}

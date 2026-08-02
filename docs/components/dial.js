// ---------------------------------------------------------------------------
// docs/components/dial — a date as three sliders
// ---------------------------------------------------------------------------
// Day, month, year, each on its own track. A date field would be tidier and
// duller: dragging the day moves the standing mark round the year ring, drags
// the Sun through the zodiac, and swaps the chants beneath — the whole page is
// a function of this date, and three sliders make that legible by letting you
// watch it happen.
//
// The month's length follows the month and the year, so February is 28 days or
// 29, and a day past the end of a shorter month clamps rather than rolling
// over into the next one.
//
// THE DIALS OUTLIVE A RENDER. Dragging fires input continuously, and the page
// redraws on every one — so a strip rebuilt each time would tear the slider out
// of the document under the pointer and the drag would die after a single step.
// A click still worked, which is what made the bug look like a slider that
// almost worked. The element is built once, kept, and its readouts written in
// place; the rest of the page is free to redraw around it.

import { el } from "./tabs.js";

const MONTHS = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun",
  "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysIn = (y, m) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30,
  31, 31, 30, 31, 30, 31][m];

/**
 * @param {Date} date                     the day, read in UTC
 * @param {(d: Date) => void} onChange    fires as a slider moves
 * @param {object} [opts]
 * @param {number} [opts.minYear]
 * @param {number} [opts.maxYear]
 */
let dials = null;

export function dateDial(date, onChange, { minYear = 500, maxYear = 2100, onDrag, settle } = {}) {
  if (!dials) dials = build(minYear, maxYear);
  dials.onChange = onChange;
  dials.onDrag = onDrag;
  dials.settle = settle;
  dials.sync(date);
  return dials.node;
}

function build(minYear, maxYear) {
  const made = {};

  const slider = (name, min, max) => {
    const input = el("input", {
      type: "range", min, max, step: 1, value: min, "aria-label": name,
    });
    const read = el("span", { class: "dial-read" });
    input.addEventListener("input", () => made.emit());
    // The page must not rebuild this element while it is being dragged.
    input.addEventListener("pointerdown", () => made.onDrag?.(true));
    for (const done of ["pointerup", "pointercancel", "blur"]) {
      input.addEventListener(done, () => { made.onDrag?.(false); made.settle?.(); });
    }
    return {
      input, read,
      node: el("label", { class: "dial" },
        el("span", { class: "dial-name" }, name), input, read),
    };
  };

  const day = slider("dies", 1, 31);
  const month = slider("mensis", 1, 12);
  const year = slider("annus", minYear, maxYear);

  made.node = el("div", { class: "dials" }, day.node, month.node, year.node);

  /** Read the three, and say what date they mean. */
  made.emit = () => {
    const yy = Number(year.input.value);
    const mm = Number(month.input.value) - 1;
    // A shorter month clamps the day rather than spilling into the next one:
    // dragging months across February should not silently become March.
    const dd = Math.min(Number(day.input.value), daysIn(yy, mm));
    made.paint(yy, mm, dd);
    made.onChange?.(new Date(Date.UTC(yy, mm, dd)));
  };

  /** Write the readouts and the day's ceiling, without rebuilding anything. */
  made.paint = (yy, mm, dd) => {
    day.input.max = String(daysIn(yy, mm));
    day.read.textContent = String(dd).padStart(2, "0");
    month.read.textContent = MONTHS[mm];
    year.read.textContent = String(yy);
  };

  /** Take a date from outside — a click on the year ring, a link opened. Never
   * moves a slider the pointer is holding, so a drag is not fought. */
  made.sync = (date) => {
    const yy = date.getUTCFullYear();
    const mm = date.getUTCMonth();
    const dd = date.getUTCDate();
    if (document.activeElement !== day.input) day.input.value = String(dd);
    if (document.activeElement !== month.input) month.input.value = String(mm + 1);
    if (document.activeElement !== year.input) year.input.value = String(yy);
    made.paint(yy, mm, dd);
  };

  return made;
}

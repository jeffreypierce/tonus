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
export function dateDial(date, onChange, { minYear = 500, maxYear = 2100 } = {}) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  const emit = (yy, mm, dd) => {
    // A shorter month clamps the day rather than spilling into the next one:
    // dragging months across February should not silently become March.
    const clamped = Math.min(dd, daysIn(yy, mm));
    onChange(new Date(Date.UTC(yy, mm, clamped)));
  };

  const slider = (name, value, min, max, read, onInput) =>
    el("label", { class: "dial" },
      el("span", { class: "dial-name" }, name),
      el("input", {
        type: "range", min, max, value, step: 1,
        "aria-label": name,
        oninput: (e) => onInput(Number(e.target.value)),
      }),
      el("span", { class: "dial-read" }, read),
    );

  return el("div", { class: "dials" },
    slider("dies", d, 1, daysIn(y, m), String(d).padStart(2, "0"),
      (v) => emit(y, m, v)),
    slider("mensis", m + 1, 1, 12, MONTHS[m],
      (v) => emit(y, v - 1, d)),
    slider("annus", y, minYear, maxYear, String(y),
      (v) => emit(v, m, d)),
  );
}

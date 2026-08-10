// ---------------------------------------------------------------------------
// site/diagrams/tabula — the table beside every diagram
// ---------------------------------------------------------------------------
// Every panel in the site pairs a figure with a table: the ring with its
// feasts, the monochord with its ratios, the score with its notes. The figure
// carries shape, the table carries text and number — which is also how the
// crowding problem solves itself. Fifteen feast names cannot ride a ring
// (Good Friday and Easter are two degrees apart) but they sit in a table
// without argument.
//
// Selection is shared, not duplicated: a row and its mark in the figure are
// the same selection, so clicking either moves both. That is the site's whole
// interaction model in one component.
//
// Columns declare their own register. A `mono` column is machine data — dates,
// ratios, hz — and sets in the mono face; a `num` column is right-aligned with
// tabular figures so digits line up down the column. Everything else is
// content and stays in the serif.

/**
 * @typedef {object} Column
 * @property {string} key       field on each row
 * @property {string} head      column heading (uppercased by CSS)
 * @property {boolean} [mono]   machine register — the mono face
 * @property {boolean} [num]    right-aligned, tabular figures
 * @property {boolean} [symbol] a glyph, not a word — set larger and centred
 * @property {boolean} [pair]   a two-element array of glyphs, set either side
 *                              of a dot on a fixed three-cell grid so the
 *                              separator aligns down the column
 * @property {(v: any, row: object) => string} [format]  cell text
 * @property {(row: object) => string} [gloss]  quiet secondary text after the value
 */

/**
 * Build a tabula.
 *
 * @param {object[]} rows
 * @param {Column[]} columns
 * @param {object}   [opts]
 * @param {string}   [opts.idKey]     field identifying a row (default "key")
 * @param {string}   [opts.selected]  id of the selected row
 * @param {(id: string) => void} [opts.onSelect]
 * @param {(row: object) => boolean} [opts.marked]  rows to highlight, when
 *                                   what is selected elsewhere implicates
 *                                   SEVERAL rows rather than identifying one
 * @param {string}   [opts.caption]   accessible caption
 * @returns {HTMLTableElement}
 */
export function tabula(rows, columns,
  { idKey = "key", selected, onSelect, marked, caption } = {}) {
  const table = document.createElement("table");
  table.className = "tabula";

  if (caption) {
    const cap = document.createElement("caption");
    cap.textContent = caption;
    table.appendChild(cap);
  }

  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  for (const c of columns) {
    const th = document.createElement("th");
    if (c.num) th.className = "num";
    th.textContent = c.head;
    hr.appendChild(th);
  }
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const id = row[idKey];
    const tr = document.createElement("tr");
    if ((id != null && id === selected) || marked?.(row)) tr.className = "sel";

    for (const c of columns) {
      const td = document.createElement("td");
      const cls = [c.mono ? "mono" : null, c.num ? "num" : null,
        c.symbol ? "symbol" : null, c.pair ? "pair" : null].filter(Boolean).join(" ");
      if (cls) td.className = cls;
      const raw = row[c.key];

      if (c.pair) {
        // Three cells: glyph, dot, glyph. The grid does the aligning, so the
        // dot sits on one vertical however wide the glyphs either side are.
        //
        // The grid goes on a span INSIDE the td, never on the td itself:
        // `display: grid` on a table cell takes it out of the table's own
        // layout, and the column stops sizing with its neighbours while the
        // row's rule and padding go with it.
        const [a, b] = Array.isArray(raw) ? raw : [raw, null];
        const cell = (t, klass) => {
          const s = document.createElement("span");
          if (klass) s.className = klass;
          s.textContent = t ?? "";
          return s;
        };
        const grid = document.createElement("span");
        grid.className = "pair-grid";
        grid.appendChild(cell(a));
        grid.appendChild(cell(b == null ? "" : "·", "pair-dot"));
        grid.appendChild(cell(b));
        td.appendChild(grid);
      } else {
        td.textContent = c.format ? c.format(raw, row) : (raw ?? "");
      }

      const g = c.gloss?.(row);
      if (g) {
        const span = document.createElement("span");
        span.className = "gloss";
        span.textContent = g;
        td.appendChild(span);
      }
      tr.appendChild(td);
    }

    if (onSelect && id != null) {
      tr.tabIndex = 0;
      tr.addEventListener("click", () => onSelect(id));
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id); }
      });
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

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
 * @param {string}   [opts.caption]   accessible caption
 * @returns {HTMLTableElement}
 */
export function tabula(rows, columns, { idKey = "key", selected, onSelect, caption } = {}) {
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
    if (id != null && id === selected) tr.className = "sel";

    for (const c of columns) {
      const td = document.createElement("td");
      const cls = [c.mono ? "mono" : null, c.num ? "num" : null].filter(Boolean).join(" ");
      if (cls) td.className = cls;
      const raw = row[c.key];
      td.textContent = c.format ? c.format(raw, row) : (raw ?? "");
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

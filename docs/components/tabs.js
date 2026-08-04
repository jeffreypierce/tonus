// ---------------------------------------------------------------------------
// docs/components/tabs — one tab strip, used three times
// ---------------------------------------------------------------------------
// The view switch, the office cascade on the left, and the analysis panels on
// the right are all the same thing: a row of names, one of them current, one
// panel showing. Written once so they cannot drift apart, and so the keyboard
// behaviour is right in all three rather than in whichever got attention.
//
// Follows the WAI-ARIA tabs pattern: arrows move between tabs, Home and End
// jump to the ends, and only the current tab is in the tab order — so a
// keyboard reaches the strip once and steps THROUGH the panel, not through
// every tab on the way past.

export const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return e;
};

/**
 * A tab strip and its panel.
 *
 * @param {object} opts
 * @param {{key: string, name: string, panel: () => Node}[]} opts.tabs
 * @param {string} [opts.active]              which key is current
 * @param {(key: string) => void} [opts.onChange]
 * @param {string} [opts.label]               what the strip is, for a reader
 * @param {string} [opts.className]           extra class on the wrapper
 * @returns {HTMLElement}
 */
export function tabs({ tabs: items, active, onChange, label = "views", className,
  stripOnly = false, variant }) {
  const current = items.some((t) => t.key === active) ? active : items[0]?.key;
  const wrap = el("div", { class: ["tabbed", className].filter(Boolean).join(" ") });

  const strip = el("div", {
    class: ["tabstrip", variant && `tabstrip-${variant}`].filter(Boolean).join(" "),
    role: "tablist", "aria-label": label,
  });
  const buttons = [];

  items.forEach((t, i) => {
    const isCurrent = t.key === current;
    const b = el("button", {
      type: "button",
      role: "tab",
      id: `tab-${label}-${t.key}`,
      "aria-selected": isCurrent ? "true" : "false",
      "aria-controls": `panel-${label}-${t.key}`,
      tabindex: isCurrent ? "0" : "-1",
      onclick: () => onChange?.(t.key),
      onkeydown: (e) => {
        const go = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (go) {
          e.preventDefault();
          const next = buttons[(i + go + buttons.length) % buttons.length];
          next.focus();
          onChange?.(items[buttons.indexOf(next)].key);
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          const next = e.key === "Home" ? buttons[0] : buttons[buttons.length - 1];
          next.focus();
          onChange?.(items[buttons.indexOf(next)].key);
        }
      },
    }, t.name);
    buttons.push(b);
    strip.append(b);
  });

  // The strip alone, when the panel belongs in another row of the page's grid
  // — the two columns' headers must align across the page, so a strip cannot
  // always carry its own panel directly beneath it.
  if (stripOnly) return strip;

  wrap.append(strip);

  // Only the current panel is built. A tab nobody opened costs nothing, which
  // matters when a panel draws a wheel or censuses two hundred chants.
  const shown = items.find((t) => t.key === current);
  if (shown) {
    wrap.append(el("div", {
      class: "tabpanel",
      role: "tabpanel",
      id: `panel-${label}-${shown.key}`,
      "aria-labelledby": `tab-${label}-${shown.key}`,
      tabindex: "0",
    }, shown.panel()));
  }
  return wrap;
}

/** Just the panel a strip would have shown — its other half. */
export function tabPanel({ tabs: items, active, label = "views" }) {
  const shown = items.find((t) => t.key === active) ?? items[0];
  if (!shown) return el("div");
  return el("div", {
    class: "tabpanel", role: "tabpanel",
    id: `panel-${label}-${shown.key}`,
    "aria-labelledby": `tab-${label}-${shown.key}`,
    tabindex: "0",
  }, shown.panel());
}

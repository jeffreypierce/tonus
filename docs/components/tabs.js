// ---------------------------------------------------------------------------
// docs/components/tabs — one tab strip, used three times
// ---------------------------------------------------------------------------
// IN THE SYSTEM: this is RULE 2 — an underline means this is where you are.
// A name, and the current one darkening a line that runs the strip's whole
// width. Boxes belong to rule 1 and live in dial.js; a set of parts belongs
// to rule 4 and is the `.segset` in styles.css. (The four rules are stated at
// the top of styles.css.)
//
// The view switch, the office cascade, and the analysis panels on the right
// are the same thing: a row of names, one of them current, one panel showing.
// Written once so they cannot drift apart, and so the keyboard behaviour is
// right in all of them rather than in whichever got attention.
//
// SIZE IS A VARIANT, NOT A COPY. `variant: "large"` gives the view switch the
// title step, because choosing a view is the largest choice on the page. It
// is the same strip underneath — the alternative was twenty-six duplicated
// declarations and an ARIA contract that only one of them kept.
//
// Follows the WAI-ARIA tabs pattern: arrows move between tabs, Home and End
// jump to the ends, and only the current tab is in the tab order — so a
// keyboard reaches the strip once and steps THROUGH the panel, not through
// every tab on the way past.
//
// `el` HERE BUILDS HTML. diagrams/frame.js exports an `el` of the same name
// that builds SVG and handles neither listeners nor `class`. Two same-named
// imports doing different things: check which one a file pulled in.

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
  stripOnly = false, variant, controls }) {
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
      // A strip usually names the panel it will build. The view switch is the
      // exception: its panel is the page's own <main>, which exists before any
      // tab does and is found by id elsewhere — so `controls` names that
      // instead of a panel id nothing would ever carry.
      "aria-controls": controls ?? `panel-${label}-${t.key}`,
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

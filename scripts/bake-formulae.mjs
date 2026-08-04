// ---------------------------------------------------------------------------
// scripts/bake-formulae — Apel's mode-5 Gradual alphabet → data/formulas.ts
// ---------------------------------------------------------------------------
// Reads the verified transcription of Apel Figure 104 (GRADUALS V: standard
// phrases) and bakes it into the FORMULAE catalogue as "gr:5".
//
// Source: working/spikes/apel_mode5_formulae_VERIFIED.json, transcribed from
// Jeffrey's photographs of pp. 348-349 by three independent readers, diffed
// formula by formula and adjudicated against the crops (the earlier PDF-scan
// read was ~75dpi, below the line-vs-space threshold on dense ligatures).
// Provenance and per-formula adjudications: the sibling verification report.
//
// The steps arrive already diatonic-relative-to-F, which is the encoding
// Formula.steps wants (0 = the mode's final), so no conversion happens here.
// This script's job is slotting, ordering, and carrying the uncertainty flags
// into the shipped comment rather than dropping them.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dir, "../working/spikes/apel_mode5_formulae_VERIFIED.json");
const TAB = resolve(__dir, "../working/spikes/apel_mode5_tabulation_VERIFIED.json");
const OUT = resolve(__dir, "../src/engines/score/data/formulas.ts");

const alphabet = JSON.parse(readFileSync(SRC, "utf8"));
const tabulation = JSON.parse(readFileSync(TAB, "utf8"));

const ticks = alphabet._ticks ?? {};
const uncertain = alphabet._uncertain ?? {};
const symbols = Object.keys(alphabet).filter((k) => !k.startsWith("_"));

// ── The tabulation, tokenized ───────────────────────────────────────────────
// A bar-segment can hold MORE THAN ONE symbol, and an earlier version of this
// script took only the first, which made eleven symbols invisible and
// undercounted six more. The grammar, measured over all 47 rows:
//   "ID"  "N+ID"  "ID+ID"  "ID+ID+ID"  "ID ID"  "... ID"  "= Chant"  "(ID)"
// where "..." is a free section, "N+" means the formula enters N notes in,
// a trailing prime is a variant form, and "= Chant" refers to another row.
function tokenize(segment) {
  let s = segment.trim();
  if (s.startsWith("=")) return [];            // "= Chant" — as the named chant
  s = s.replace(/\(([^)]*)\)/g, " ")           // "(a)" — a notation, not a symbol
       .replace(/\.\.\./g, " ")                 // free section
       .replace(/^\d+\+/, "");                 // leading entry offset
  const ids = [];
  for (const part of s.split(/[+\s]+/)) {
    const m = /^(?:\d+\+)?([A-Za-z]\w*?)'?$/.exec(part.trim());
    if (m && m[1]) ids.push(m[1]);
  }
  return ids;
}

/** Every unit (respond or verse) as its ordered symbol sequence. */
function units() {
  const out = [];
  for (const rows of Object.values(tabulation.groups ?? {})) {
    for (const row of rows) {
      for (const part of ["respond", "verse"]) {
        const ids = String(row[part] ?? "")
          .split("|")
          .map((seg) => tokenize(seg).filter((id) => alphabet[id]));
        if (ids.flat().length) out.push({ part, segments: ids });
      }
    }
  }
  return out;
}

const UNITS = units();

// ── Slots, MEASURED then arbitrated by Apel's own remark ───────────────────
// Apel, Remarks A.1 (p. 350), verbatim: "The standard phrases are rather
// strictly divided into initial, final, and intermediate formulae. To the
// first category belong A10, A11, A12, A13, A14(C14), C10, C11, and M.
// Exceptionally, A10 appears as an intermediate phrase in Tribulationes
// (group VII). Nearly all the verses close with either F10 or F11."
//
// So the three categories are HIS, not a guess from prefix letters — the
// letter rule this script used before misfiled Fa/Fb/Fc/Fd (the responds'
// initial phrases) and M (an opening melisma) as terminations.
//
// Measured against the tabulation, his list holds: A12/A13/C10/C11 open 100%
// of their verses, A10 83% (his stated exception is the other 17%), M 75%.
// A11 measures 0% "first" only because it is always JOINED to a tiny
// intonation — i1+A11, i3+A11 — which is itself evidence that the i-symbols
// are intonations prefixed to an initial rather than initials in their own
// right. Nearly all verses do close on F10/F11: 97% and 100% final.
const APEL_INITIAL = new Set(["A10", "A11", "A12", "A13", "A14", "C14", "C10", "C11", "M"]);

/** Where a symbol actually sits, over every unit that uses it. */
function positions() {
  const stat = {};
  for (const { segments } of UNITS) {
    const flat = segments.flat();
    if (!flat.length) continue;
    // Position is judged by SEGMENT, not by symbol index: a segment like
    // "i1+A11" is one position holding two symbols, and counting the second
    // as "not first" would contradict Apel over a notational detail.
    segments.forEach((seg, si) => {
      const lastSeg = segments.length - 1;
      for (const id of seg) {
        const v = (stat[id] ??= { first: 0, mid: 0, last: 0, n: 0 });
        v.n++;
        if (si === 0) v.first++;
        else if (si === lastSeg) v.last++;
        else v.mid++;
      }
    });
  }
  return stat;
}

const POS = positions();

/**
 * The slot a symbol fills. Apel's named categories decide first; where he is
 * silent, the measured position does, and the shares ride into the baked
 * comment so the claim is checkable rather than asserted.
 */
function slotFor(id) {
  if (APEL_INITIAL.has(id)) return "opening";
  const v = POS[id];
  // A symbol Apel does not name and the tabulation never shows: the intonations
  // (i1-i3) and the shortened forms fall here. The tick forms inherit their
  // parent's slot; a bare unknown defaults by its own shape below.
  if (!v || !v.n) {
    const parent = ticks[id]?.parent;
    if (parent) return slotFor(parent);
    return id[0].toLowerCase() === "i" ? "intonation" : "opening";
  }
  if (id[0].toLowerCase() === "i") return "intonation";
  const share = (x) => x / v.n;
  // Closes its unit more than anything else → a termination. Apel: "nearly all
  // the verses close with either F10 or F11", and the tabulation agrees at 97%.
  if (share(v.last) >= 0.5) return "termination";
  if (share(v.first) >= 0.5) return "opening";
  if (share(v.mid) >= 0.5) return "mediant";
  return v.last > v.first ? "termination" : "opening";
}

// How often each symbol is actually used — evidence of how standard a
// "standard phrase" really is, counted with the tokenizer above.
const uses = new Map();
for (const { segments } of UNITS) {
  for (const id of segments.flat()) uses.set(id, (uses.get(id) ?? 0) + 1);
}

// Order: by slot in performance order, then by descending attestation, so the
// matcher tries the best-attested phrase of a slot first.
const SLOT_ORDER = ["intonation", "opening", "mediant", "flex", "termination", "close"];
const rows = symbols
  .map((id) => ({
    id,
    slot: slotFor(id),
    steps: alphabet[id],
    n: uses.get(id) ?? 0,
    tick: ticks[id]?.parent,
    flags: uncertain[id]?.length ?? 0,
  }))
  .sort((a, b) =>
    SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot) ||
    b.n - a.n ||
    a.id.localeCompare(b.id));

const body = rows
  .map((r) => {
    const notes = [];
    if (r.tick) notes.push(`shortened from ${r.tick}`);
    if (r.n) {
      const v = POS[r.id];
      const pct = (x) => `${Math.round((x / v.n) * 100)}%`;
      // The measured position IS the evidence for the slot — print it, so the
      // assignment stays checkable against Apel's tabulation without re-running
      // the bake.
      notes.push(`${r.n}× in Apel's tabulation (${pct(v.first)} first, ` +
        `${pct(v.mid)} mid, ${pct(v.last)} last)`);
    } else {
      notes.push("not in the tabulation as read");
    }
    if (APEL_INITIAL.has(r.id)) notes.push("named initial by Apel, Remarks A.1");
    if (r.flags) notes.push(`${r.flags} note${r.flags > 1 ? "s" : ""} flagged uncertain`);
    return `  // ${r.id} — ${notes.join("; ")}\n` +
      `  { id: ${JSON.stringify(r.id)}, slot: ${JSON.stringify(r.slot)}, steps: [${r.steps.join(", ")}] },`;
  })
  .join("\n");

const bySlot = SLOT_ORDER
  .map((s) => [s, rows.filter((r) => r.slot === s).length])
  .filter(([, n]) => n > 0)
  .map(([s, n]) => `${n} ${s}`)
  .join(", ");

const src = readFileSync(OUT, "utf8");
const marker = "export const FORMULAE: Record<string, Formula[]> = {";
const head = src.slice(0, src.indexOf(marker));

const file = head + marker + `
  // ── Graduals, mode 5 ── Apel Figure 104 [biblio: apel-chant, pp. 344-349].
  // ${rows.length} standard phrases (${bySlot}), steps diatonic from F.
  // Transcribed from photographs by three independent readers and adjudicated
  // per formula; the earlier PDF-scan read was superseded. Slots are DERIVED
  // from Apel's own tabulation (pp. 346-347), which is also the matcher's
  // validation oracle: 47 Graduals decoded into formula sequences.
  //
  // Two known gaps, carried openly rather than guessed: C14 and C16 are the
  // shortened A14/A16 closing on c' (his explanation 3 - derived, never
  // drawn), and f7 is referenced by two chants but has no staff in the figure
  // as read. Neither is invented here.
  "gr:5": [
${body}
  ],
};

/** The formula catalogue for a genre × mode, or an empty list if none exists. */
export function formulaeFor(office: string, mode: number): Formula[] {
  return FORMULAE[\`\${office}:\${mode}\`] ?? [];
}
`;

writeFileSync(OUT, file);
console.log(`baked ${rows.length} mode-5 Gradual formulae (${bySlot}) -> src/engines/score/data/formulas.ts`);

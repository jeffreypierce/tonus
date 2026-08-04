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

// ── Slots, read off the tabulation rather than assumed ─────────────────────
// Apel does not label his symbols by slot; the tabulation shows where each one
// sits in a chant's sequence, and the answer is unambiguous by prefix letter:
//   F, G  close a unit          (49 of 89 appearances final; never opening-only)
//   i     intonation            (11 of 12 appearances first)
//   A, C  the body after it     (43 and 29 appearances, NEVER last)
//   M     an ending-less body   (always first; takes c10/a17 as its ending)
// A slot is therefore derived, not transcribed — and this is where to look if
// the matcher ever disagrees with Apel's own tabulation.
function slotFor(id) {
  const letter = id[0].toUpperCase();
  if (letter === "I") return "intonation";
  if (letter === "F" || letter === "G") return "termination";
  if (letter === "M") return "mediant";
  return "opening"; // A, C — the phrase that follows an intonation
}

// Count each symbol's appearances in the tabulation: a frequency the catalogue
// can carry as evidence of how standard a "standard phrase" really is.
const uses = new Map();
for (const rows of Object.values(tabulation.groups ?? {})) {
  for (const row of rows) {
    for (const part of ["respond", "verse"]) {
      for (const raw of String(row[part] ?? "").split("|")) {
        const m = /^(?:\d+\+)?([A-Za-z]\w*)/.exec(raw.trim());
        if (!m) continue;
        const id = m[1].replace(/'$/, "");
        uses.set(id, (uses.get(id) ?? 0) + 1);
      }
    }
  }
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
    notes.push(r.n ? `${r.n}× in Apel's tabulation` : "not in the tabulation as read");
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

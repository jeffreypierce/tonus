#!/usr/bin/env node
// ---------------------------------------------------------------------------
// extract-smufl-glyphs.mjs — bake SMuFL chant glyph outlines into tonus
// ---------------------------------------------------------------------------
// Reads the Bravura reference font and emits src/data/smufl-glyphs.json:
//
//     { "meta": { … },
//       "glyphs": { "E990": { "name": "…", "path": "M0 -97…Z",
//                             "advance": 160, "bbox": [xMin,yMin,xMax,yMax] }, … } }
//
// Paths are in FONT UNITS, y-UP (font convention, baseline at 0), unitsPerEm in
// meta.upm. SMuFL standardizes 1 em = 4 staff spaces, so one staff space =
// upm/4 font units — the renderer's scale factor derives from that, and the
// per-glyph bbox lets it register glyphs whose origin is not the notehead
// center (base-registered components, staff-centered divisiones, zero-advance
// stacking components like chantPodatusUpper). The SVG emitter places each
// glyph with translate(x, y) scale(s, -s); glyph-internal coordinates stay
// authoritative, so we never re-encode them here.
//
// Bravura is the canonical SMuFL reference font (SIL OFL 1.1). The codepoint
// set is the plainchant range used by tonus's renderer, mirroring
// gabc-smufl/data/gabc-map.json (whose codepoints are "verified against Bravura
// 1.392").
//
// Ported from extract-smufl-glyphs.py (fontTools) 2026-08-16. The port is
// gated on BYTE-IDENTICAL output: a changed path re-renders every chant, so
// `npm run glyphs` must leave src/data/smufl-glyphs.json unmodified in git
// unless the codepoint list itself changed. See toFontToolsSVG below for the
// one place that took real work.
//
// Run:  npm run glyphs
// Requires: fontkit (devDependency); Bravura.otf in vendor/ or ../gabc-smufl.

import { writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as fk from "fontkit";

const fontkit = fk.default ?? fk;
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");

// Vendored first: the repo's own copy is the one this script is gated against.
// The sibling path stays as a fallback for a checkout that predates vendoring.
const BRAVURA_CANDIDATES = [
  resolve(REPO, "vendor", "Bravura.otf"),
  resolve(REPO, "..", "gabc-smufl", "sources", "Bravura.otf"),
];
const OUT = resolve(REPO, "src", "data", "smufl-glyphs.json");

// Chant-range codepoints the renderer references (SMuFL plainchant PUA).
// Staves/divisiones + clefs + single notes + note components + articulations.
const CODEPOINTS = [
  // staff + divisiones
  0xe8f0, 0xe8f3, 0xe8f4, 0xe8f5, 0xe8f6, 0xe8f7,
  // clefs
  0xe902, 0xe906,
  // single notes
  0xe990, 0xe991, 0xe992, 0xe993, 0xe994, 0xe995, 0xe996, 0xe997,
  0xe998, 0xe999, 0xe99a, 0xe99b, 0xe99c, 0xe99d, 0xe99e, 0xe99f,
  0xe9a0, 0xe9a1,
  // note components (pes/clivis/torculus ligature primitives)
  0xe9b0, 0xe9b1, 0xe9b2, 0xe9b3,
  0xe9b4, 0xe9b5, 0xe9b6, 0xe9b7, 0xe9b8, // entry line asc 2nd–6th
  0xe9b9, 0xe9ba, 0xe9bb, 0xe9bc,         // ligatura desc 2nd–5th
  0xe9bd, 0xe9be, 0xe9bf, 0xe9c0, 0xe9c1, // connecting line asc
  0xe9c2, 0xe9c3, 0xe9c4, 0xe9c5,         // strophicus liquescens
  // articulations
  0xe9d0, 0xe9d1, 0xe9d2, 0xe9d3, 0xe9d4, 0xe9d5,
  0xe9d6, 0xe9d7, 0xe9d8, 0xe9d9,
  // accidentals: medieval/Renaissance (soft-b flat, hard-b, natural, croix…)
  0xe9e0, 0xe9e1, 0xe9e2, 0xe9e3, 0xe9e4, 0xe9e5,
  // accidentals: standard (flat, natural, sharp) as fallbacks
  0xe260, 0xe261, 0xe262,
  // ── notatio moderna: the modern round-note transcription ──
  0xe052,         // gClef8vb — treble clef with 8 below (male chant range)
  0xe0a3, 0xe0a4, // noteheadHalf (hollow, = double mora), noteheadBlack
  0xe1e7,         // augmentationDot (mora / dotted note)
  // THE CUSTOS, all six cuts. A small head on the baseline with a stem
  // running AWAY from the staff, and the stem's length says how far the
  // pitch sits from the staff's middle — which is what Lowest/Low/Middle
  // name. Narrow (60 units) because the stem is the sign.
  0xea04, 0xea05, 0xea06, // stem up:   lowest, low, middle
  0xea07, 0xea08, 0xea09, // stem down: middle, high, highest
  0xea20,         // medRenQuilismaCMN — the fused quilisma squiggle
];

// ── HEJI intonation channel: Extended Helmholtz–Ellis accidentals ──
// The just-intonation notation whose baseline IS the Pythagorean chain (a clean
// staff under the default tuning; comma arrows bloom only for just tunings).
// The Bravura block is U+E2C0–E2FF; names are resolved from the font's own
// SMuFL metadata, NOT guessed by codepoint, so the map is authoritative.
for (let cp = 0xe2c0; cp < 0xe300; cp++) CODEPOINTS.push(cp);

/**
 * A glyph outline written the way fontTools' SVGPathPen writes one.
 *
 * THIS IS THE WHOLE PORT. fontkit's own `path.toSVG()` describes the same
 * geometry in different words, and the difference is not cosmetic here: the
 * baked JSON is compared byte-for-byte, so an equivalent path is still a
 * failed port. Three conventions had to be matched, each found by diffing
 * against the 138 glyphs fontTools had already written:
 *
 *   1. A horizontal line is H and a vertical line is V. fontkit writes L for
 *      both, which differed on 119 of the 138.
 *   2. A moveTo IMPLIES a following lineTo, so "M10 -118 82 -106" is two
 *      commands and the L is left out. 19 glyphs carry one.
 *   3. Nothing else elides. Consecutive L's repeat their letter, and so do
 *      consecutive C's — the obvious generalisation of (2) is wrong, and
 *      produced 37 mismatches before it was narrowed to moveTo alone.
 */
function toFontToolsSVG(path) {
  let x = 0;
  let y = 0;
  let last = "";
  const out = [];
  const emit = (cmd, nums) => {
    if (cmd === "L" && last === "M") out.push(` ${nums.join(" ")}`);
    else { out.push(cmd + nums.join(" ")); last = cmd; }
  };
  for (const c of path.commands) {
    const a = c.args;
    switch (c.command) {
      case "moveTo":
        emit("M", [a[0], a[1]]); x = a[0]; y = a[1]; break;
      case "lineTo":
        if (a[1] === y && a[0] !== x) emit("H", [a[0]]);
        else if (a[0] === x && a[1] !== y) emit("V", [a[1]]);
        else emit("L", [a[0], a[1]]);
        x = a[0]; y = a[1]; break;
      case "quadraticCurveTo":
        emit("Q", a); x = a[2]; y = a[3]; break;
      case "bezierCurveTo":
        emit("C", a); x = a[4]; y = a[5]; break;
      case "closePath":
        out.push("Z"); last = ""; break;
      default:
        throw new Error(`unhandled path command: ${c.command}`);
    }
  }
  return out.join("");
}

/** JSON in Python's `json.dumps(indent=1)` shape — one space per level, and a
 *  space after the key's colon, which JSON.stringify already does. */
const dumps = (o) => JSON.stringify(o, null, 1);

const src = BRAVURA_CANDIDATES.find((c) => existsSync(c));
if (!src) {
  console.error("extract-smufl-glyphs: Bravura.otf not found. Looked in:\n  "
    + BRAVURA_CANDIDATES.join("\n  "));
  process.exit(1);
}

const font = fontkit.openSync(src);
const upm = font.unitsPerEm;
const glyphs = {};
const missing = [];

for (const cp of CODEPOINTS) {
  const g = font.glyphForCodePoint(cp);
  // fontkit hands back glyph 0 (.notdef) for an absent codepoint rather than
  // null, so a missing glyph is caught by its id, not by a nullish check.
  if (!g || g.id === 0) { missing.push(`U+${cp.toString(16).toUpperCase().padStart(4, "0")}`); continue; }
  const b = g.bbox;
  const empty = b.minX === 0 && b.minY === 0 && b.maxX === 0 && b.maxY === 0;
  glyphs[cp.toString(16).toUpperCase().padStart(4, "0")] = {
    // Record the font's own glyph name (Bravura names its glyphs by their
    // SMuFL canonical name), so downstream mappings — especially the HEJI
    // accidentals — bind to a named glyph, not a bare codepoint read by eye.
    name: g.name,
    path: toFontToolsSVG(g.path),
    advance: g.advanceWidth,
    bbox: empty ? [0, 0, 0, 0] : [b.minX, b.minY, b.maxX, b.maxY],
  };
}

if (missing.length) {
  console.error(`  warning: ${missing.length} codepoints missing from Bravura: `
    + missing.join(", "));
}

const out = {
  meta: {
    source: "Bravura.otf (Steinberg Media, SIL OFL 1.1)",
    smufl: "plainchant PUA (U+E8F0–U+E9D9)",
    upm,
    coordinates: "font units, y-up (baseline at 0); emitter applies scale(s, -s)",
    regenerate: "npm run glyphs",
    count: Object.keys(glyphs).length,
  },
  glyphs,
};

writeFileSync(OUT, `${dumps(out)}\n`, "utf8");
console.log(`Wrote ${OUT}  (${Object.keys(glyphs).length} glyphs, upm=${upm})`);

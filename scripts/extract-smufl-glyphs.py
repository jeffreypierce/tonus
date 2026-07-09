#!/usr/bin/env python3
"""
extract-smufl-glyphs.py — bake SMuFL chant glyph outlines into tonus.

Reads the Bravura reference font and emits src/data/smufl-glyphs.json:

    { "meta": { ... },
      "glyphs": { "E990": { "path": "M0 -97…Z", "advance": 160,
                            "bbox": [xMin, yMin, xMax, yMax] }, … } }

Paths are in FONT UNITS, y-UP (font convention, baseline at 0), unitsPerEm in
meta.upm. SMuFL standardizes 1 em = 4 staff spaces, so one staff space =
upm/4 font units — the renderer's scale factor derives from that, and the
per-glyph bbox lets it register glyphs whose origin is not the notehead
center (base-registered components, staff-centered divisiones, zero-advance
stacking components like chantPodatusUpper). The SVG emitter places each
glyph with translate(x, y) scale(s, -s); glyph-internal coordinates stay
authoritative, so we never re-encode them here.

Bravura is the canonical SMuFL reference font (SIL OFL). The codepoint set is
the plainchant range used by tonus's renderer, mirroring
gabc-smufl/data/gabc-map.json (whose codepoints are "verified against Bravura
1.392").

Run:  python3 scripts/extract-smufl-glyphs.py
Requires: fontTools;  Bravura.otf at ../gabc-smufl/sources/Bravura.otf
"""

import json
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen

REPO = Path(__file__).resolve().parent.parent
BRAVURA_CANDIDATES = [
    REPO.parent / "gabc-smufl" / "sources" / "Bravura.otf",
    REPO / "vendor" / "Bravura.otf",
]
OUT = REPO / "src" / "data" / "smufl-glyphs.json"

# Chant-range codepoints the renderer references (SMuFL plainchant PUA).
# Staves/divisiones + clefs + single notes + note components + articulations.
CODEPOINTS = [
    # staff + divisiones
    0xE8F0, 0xE8F3, 0xE8F4, 0xE8F5, 0xE8F6, 0xE8F7,
    # clefs
    0xE902, 0xE906,
    # single notes
    0xE990, 0xE991, 0xE992, 0xE993, 0xE994, 0xE995, 0xE996, 0xE997,
    0xE998, 0xE999, 0xE99A, 0xE99B, 0xE99C, 0xE99D, 0xE99E, 0xE99F,
    0xE9A0, 0xE9A1,
    # note components (pes/clivis/torculus ligature primitives)
    0xE9B0, 0xE9B1, 0xE9B2, 0xE9B3,
    0xE9B4, 0xE9B5, 0xE9B6, 0xE9B7, 0xE9B8,           # entry line asc 2nd–6th
    0xE9B9, 0xE9BA, 0xE9BB, 0xE9BC,                   # ligatura desc 2nd–5th
    0xE9BD, 0xE9BE, 0xE9BF, 0xE9C0, 0xE9C1,           # connecting line asc
    0xE9C2, 0xE9C3, 0xE9C4, 0xE9C5,                   # strophicus liquescens
    # articulations
    0xE9D0, 0xE9D1, 0xE9D2, 0xE9D3, 0xE9D4, 0xE9D5,
    0xE9D6, 0xE9D7, 0xE9D8, 0xE9D9,
    # accidentals: medieval/Renaissance (soft-b flat, hard-b, natural, croix…)
    0xE9E0, 0xE9E1, 0xE9E2, 0xE9E3, 0xE9E4, 0xE9E5,
    # accidentals: standard (flat, natural, sharp) as fallbacks
    0xE260, 0xE261, 0xE262,
    # ── notatio moderna (Phase 4): a modern round-note transcription ──
    0xE052,          # gClef8vb — treble clef with 8 below (male chant range)
    0xE0A3, 0xE0A4,  # noteheadHalf (hollow, = double mora), noteheadBlack
    0xE1E7,          # augmentationDot (mora / dotted note)
    0xEA20,          # medRenQuilismaCMN — the fused quilisma squiggle
]

# ── HEJI intonation channel (Phase 5): Extended Helmholtz–Ellis accidentals ──
# The just-intonation notation whose baseline IS the Pythagorean chain (a clean
# staff under the default tuning; comma arrows bloom only for just tunings).
# The Bravura block is U+E2C0–E2FF; names are resolved from the font's own SMuFL
# metadata below, NOT guessed by codepoint, so the map is authoritative.
HEJI_RANGE = range(0xE2C0, 0xE300)
CODEPOINTS += list(HEJI_RANGE)


def find_bravura():
    for c in BRAVURA_CANDIDATES:
        if c.exists():
            return c
    sys.exit(f"Bravura.otf not found. Looked in:\n  " +
             "\n  ".join(str(c) for c in BRAVURA_CANDIDATES))


def main():
    src = find_bravura()
    font = TTFont(str(src))
    upm = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    hmtx = font["hmtx"]

    glyphs = {}
    missing = []
    for cp in CODEPOINTS:
        name = cmap.get(cp)
        if name is None:
            missing.append(f"U+{cp:04X}")
            continue
        pen = SVGPathPen(glyph_set)
        glyph_set[name].draw(pen)
        path = pen.getCommands()
        advance = hmtx[name][0]
        bounds_pen = BoundsPen(glyph_set)
        glyph_set[name].draw(bounds_pen)
        bbox = list(bounds_pen.bounds) if bounds_pen.bounds else [0, 0, 0, 0]
        # Record the font's own glyph name (Bravura names its glyphs by their
        # SMuFL canonical name), so downstream mappings — especially the HEJI
        # accidentals — bind to a named glyph, not a bare codepoint read by eye.
        glyphs[f"{cp:04X}"] = {
            "name": name, "path": path, "advance": advance, "bbox": bbox,
        }

    if missing:
        print(f"  warning: {len(missing)} codepoints missing from Bravura: "
              + ", ".join(missing), file=sys.stderr)

    out = {
        "meta": {
            "source": "Bravura.otf (Steinberg Media, SIL OFL 1.1)",
            "smufl": "plainchant PUA (U+E8F0–U+E9D9)",
            "upm": upm,
            "coordinates": "font units, y-up (baseline at 0); emitter applies scale(s, -s)",
            "regenerate": "python3 scripts/extract-smufl-glyphs.py",
            "count": len(glyphs),
        },
        "glyphs": glyphs,
    }
    OUT.write_text(json.dumps(out, indent=1) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}  ({len(glyphs)} glyphs, upm={upm})")


if __name__ == "__main__":
    main()

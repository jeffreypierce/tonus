# vendor — build inputs, never shipped

Files here are read at build time and do not travel to npm. `package.json`'s
`files` field is an allowlist (`dist`, `docs/api`, LICENSE, CHANGELOG,
BIBLIOGRAPHY), so this directory is excluded by omission rather than by an
ignore rule — verify with `npm pack --dry-run` if you add anything.

## Bravura.otf

The SMuFL reference font (Steinberg Media Technologies), and the source of
every glyph outline in `src/data/smufl-glyphs.json`. `npm run glyphs` reads it
and rewrites that file.

It lives here because the extractor used to resolve it from
`../gabc-smufl/sources/` — a sibling checkout that may not exist on another
machine, which made the baked glyph data effectively unregenerable away from
its author's disk. A build input belongs with the build.

**Licence: SIL OFL 1.1** (`OFL.txt`, beside it — the OFL requires the licence
travel with the font). Vendoring is permitted; what is not permitted is
shipping it under a different name, and tonus ships no font bytes at all.

tonus emits font-family *references* and, where a caller supplies `embed`,
carries the CALLER's bytes. Bravura's outlines are baked as path data — which
is glyph geometry in a JSON file, not a font — and the SVG they draw needs no
font installed to render.

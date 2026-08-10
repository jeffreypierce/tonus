# Fonts — self-hosted, all SIL Open Font License 1.1

Every face here ships under the OFL, which permits bundling and web use as long
as the license travels with the font. Do not sell the fonts themselves.

| file | family | role | source |
| --- | --- | --- | --- |
| `JunicodeVFsubset.woff2` | Junicode (variable subset) | serif — body, score lyrics, italics | psb1558/Junicode-font (OFL 1.1), `Junicode-OFL.txt` here |
| `IBMPlexMono.woff2` | IBM Plex Mono (Regular) | numeric, version tags, code | IBM (OFL 1.1), Bold Monday sources |
| `Jacquard24.woff2` | Jacquard 24 | blackletter display — wordmark + dropcaps | Typearture (OFL 1.1) via Google Fonts |
| `Jacquard12.woff2` | Jacquard 12 | blackletter at small sizes | Typearture (OFL 1.1), `Jacquard-OFL.txt` here |

**Both text faces are SUBSETS, and both have been wrong once.** Junicode
shipped cut to bare ASCII, so the corpus's `á æ é í ó` fell back to a system
serif — invisible in Chrome, broken in Safari. IBM Plex Mono shipped as the
ITALIC cut under an upright `@font-face`, so every table header and figure was
slanted. Rebuild either from its roman source with:

```sh
pyftsubset SOURCE.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0100-017F,U+0300-0301,U+0304,U+0308,\
U+0366,U+0384-03CE,U+2010-2011,U+2013-2014,U+2018-201D,U+2020-2021,\
U+2032-2033,U+2192,U+2609,U+263D-2644,U+266D-266F" \
  --layout-features="kern,liga,ccmp,mark,mkmk,smcp,c2sc,onum,lnum,tnum" \
  --flavor=woff2 --output-file=OUT.woff2
```

`--layout-features` is a WHITELIST: anything not named is discarded. It once
read `kern,liga,ccmp,mark,mkmk`, which shipped a Junicode with no small caps
and no oldstyle figures — `font-variant-caps: small-caps` then had the browser
FAKE them by scaling capitals, so a word wore two stem weights. `smcp`/`c2sc`
carry the small caps the site labels its figures with; `onum` the oldstyle
figures for prose and years; `lnum`/`tnum` the lining tabular figures a numeric
column needs. Measure the file size after: small-cap glyph closure grows it.

`mark`/`mkmk` are required for combining accents; Junicode's `wght`/`wdth`/
`ENLA` axes survive subsetting — verified 2026-08-10 in the shipped file, which
is why the gamut column's `"ENLA" 100` does real work. Two gaps are by design: Plex Mono has no Greek
(it falls through to Junicode), and NEITHER has the planetary symbols
`☉☾♀♂♃♄`, which is why the symbol columns name their own stack in `styles.css`.

**Bravura is deliberately absent.** The music notation needs no webfont: tonus
bakes the SMuFL glyphs as inline SVG `<path>`s inside `inscriptio` output, so the
rendered score is self-contained. Add a Bravura woff only if live SMuFL glyphs are
ever needed *outside* a tonus SVG. Bravura is also SIL OFL (Steinberg Media).

The full Junicode OFL text is in `Junicode-OFL.txt`. IBM Plex and Jacquard 24 are
the same OFL 1.1; their copyright/reserved-font-name notices:

- IBM Plex © 2017 IBM Corp. — "IBM Plex" is the Reserved Font Name.
- Jacquard 24 © 2023 The Jacquard Project Authors — "Jacquard" is reserved.

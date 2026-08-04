# Fonts — self-hosted, all SIL Open Font License 1.1

Every face here ships under the OFL, which permits bundling and web use as long
as the license travels with the font. Do not sell the fonts themselves.

| file | family | role | source |
| --- | --- | --- | --- |
| `JunicodeVFsubset.woff2` | Junicode (variable subset) | serif — body, score lyrics, italics | psb1558/Junicode-font (OFL 1.1), `Junicode-OFL.txt` here |
| `IBMPlexSans.woff2` | IBM Plex Sans | labels, small-caps captions, nav | IBM (OFL 1.1) via Google Fonts |
| `IBMPlexMono.woff2` / `-Italic` | IBM Plex Mono | numeric, version tags, code | IBM (OFL 1.1) via Google Fonts |
| `Jacquard24.woff2` | Jacquard 24 | blackletter display — wordmark + dropcaps | Typearture (OFL 1.1) via Google Fonts |
| `Jacquard12.woff2` | Jacquard 12 | blackletter at smaller sizes | scfried/soft-type-jacquard (OFL 1.1), `Jacquard-OFL.txt` here |

**Bravura is deliberately absent.** The music notation needs no webfont: tonus
bakes the SMuFL glyphs as inline SVG `<path>`s inside `inscriptio` output, so the
rendered score is self-contained. Add a Bravura woff only if live SMuFL glyphs are
ever needed *outside* a tonus SVG. Bravura is also SIL OFL (Steinberg Media).

The full Junicode OFL text is in `Junicode-OFL.txt`. IBM Plex and Jacquard 24 are
the same OFL 1.1; their copyright/reserved-font-name notices:
- IBM Plex © 2017 IBM Corp. — "IBM Plex" is the Reserved Font Name.
- Jacquard 24 © 2023 The Jacquard Project Authors — "Jacquard" is reserved.

# Archived Emitters

These modules implemented the `score.midi()` and `score.musicxml()` methods
in v1.0 drafts. In the shipped v1 API they're no longer methods on the Score
object — Score is pure data now (`phrases`, `tabula`, `prosody`, `imprint`).

The emitter code is retained here, outside the public API, for two reasons:

1. Tests in `tests/api.test.mjs` and `tests/score.test.mjs` still exercise
   these functions directly as regression protection.
2. In v1.1 these will return as top-level emitters:
   - `tonus.midi(source)` — source can be a Score or a raw IR phrase array
   - `tonus.musicxml(source)` — same
   Both will consume whatever shape the Score object exposes then; the
   implementation here is a reasonable starting point.

**Not exported from `src/index.ts`.** Import directly from
`dist/engines/score/emitters/_archive/*.js` if you need them.

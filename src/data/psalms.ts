// ---------------------------------------------------------------------------
// data/psalms — psalm and canticle verses (2612 + 579 from DO Psalterium)
// ---------------------------------------------------------------------------
import { createRequire } from "node:module";
import type { PsalmVerse } from "../engines/chant/types.js";

const require = createRequire(import.meta.url);

export type { PsalmVerse };
export const PSALMS: PsalmVerse[] = require("./psalms.json") as PsalmVerse[];

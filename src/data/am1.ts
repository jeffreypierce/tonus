// am1.ts — Antiphonale monasticum I
// Extracted from GregoBase (source ID 17) by scripts/extract-gregobase.mjs
// Chants: 1
import type { Chant } from "./types.js";
import type { ChantData } from "./gr.js";

export const AM1_SOURCE: Chant["source"] = {
  book: "Antiphonale monasticum I",
  fullTitle: null,
  edition: "De tempore",
  year: 2005,
  editor: "Solesmes",
  scanSource: "Scan courtesy of Dominique Crochu",
  code: "am1",
};

export const AM1_DATA: ChantData[] = [
  {
    id: "gregobase:4440",
    incipit: "Super te Ierusalem orietur",
    gabc: "(c4) SU(e)per(e) te,(e) Ie(fd)rú(e)sa(f)lem,(ggo<) *(;) O(e)ri(f)é(dc)tur(d) Dó(f)mi(f)nus.(e) (::) <sp>V/</sp>. Et(c) gló(de)ri(e)a(e) e(ef~)ius(e) (,) in(e) te(e) vi(fd)dé(e)bi(f)tur.(ggo<) <sp>V/</sp>.(::) Gló(e)ri(g)a(g) Pa(gh)tri,(h) et(h) Fí(g)li(h)o,(e) (,) et(e) Spi(e)rí(e)tu(fe)i(d) San(e!f<)cto.(g) (::)",
    office: "rb",
    mode: null,
    pages: [
    { page: "4", sequence: 0, extent: 1 }
    ],
  }
];

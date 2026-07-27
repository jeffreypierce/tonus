// ar2.ts — Antiphonale Romanum II
// Extracted from GregoBase (source ID 6) by scripts/extract-gregobase.mjs
// Chants: 2
import type { Chant } from "./types.js";
import type { ChantData } from "./gr.js";

export const AR2_SOURCE: Chant["source"] = {
  book: "Antiphonale Romanum II",
  fullTitle: null,
  edition: "Ad Vesperas in dominicis et festis",
  year: 2009,
  editor: "Solesmes",
  scanSource: null,
  code: "ar2",
};

export const AR2_DATA: ChantData[] = [
  {
    id: "gregobase:7834",
    incipit: "Venite et videte",
    gabc: "(c4)VE(g)ní(j)te,(ig) et(i) vi(j)dé(h)te(g) lo(hg)cum(f) (;) u(g)bi(g) pó(g)si(g)tus(g) e(f)rat(h) Dó(j)mi(j)nus,(i) (,) al(g)le(ij)lú(h)ia(gf) al(gh)le(h)lú(g)ia.(g) (::) E(j) u(j) o(i) u(j) a(h) e.(g) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "201", sequence: 2, extent: 2 }
    ],
  },
  {
    id: "gregobase:7876",
    incipit: "Tollite iugum meum",
    gabc: "(f3)TOl(fc)li(ef)te(f) <v>$\\star$</v>() iu(fg)gum(fe) me(f)um(hg) su(hi)per(fgFE) vos,(e) (`) di(f)cit(hg) Dó(f)mi(ef)nus,(f) (:) et(fe) dí(h)sci(ij)te(jvIH) a(ij) me(hvGF) (,) qui(f)a(i) mi(h)tis(hg) sum(fg) et(f) hú(fe)mi(f)lis(hg) cor(ffo)de;(e) (:) iu(c)gum(ef) e(f)nim(f) me(fg)um(f) su(f)á(g)ve(fe) est(e) (`) et(h) o(hg)nus(h) me(i)um(hg) le(f)ve.(f) (::) E(h) u(h) o(h) u(g) a(ef) e.(f) (::)\r\n",
    office: "an",
    mode: "2",
    pages: [
    { page: "301", sequence: 2, extent: 2 }
    ],
  }
];

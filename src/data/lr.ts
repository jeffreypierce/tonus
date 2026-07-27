// lr.ts — Liber Responsorialis
// Extracted from GregoBase (source ID 56) by scripts/extract-gregobase.mjs
// Chants: 5
import type { Chant } from "./types.js";
import type { ChantData } from "./gr.js";

export const LR_SOURCE: Chant["source"] = {
  book: "Liber Responsorialis",
  fullTitle: null,
  edition: "juxta ritum monasticum",
  year: 1895,
  editor: "Solesmes",
  scanSource: "Digitized by the University of North Texas",
  code: "lr",
};

export const LR_DATA: ChantData[] = [
  {
    id: "gregobase:16189",
    incipit: "Sanctis qui in terra",
    gabc: "(c4) San(f)ctis(d) * qui(e) in(f) ter(g)ra(f) sunt(d) e(f)jus,(ed) (;) mi(c)ri(d)fi(e)cá(f)vit(e) om(f)nes(d) vo(e)lun(f)tá(g)tes(f) me(fe)as(dc) in(d)ter(f) il(e)los.(e) (::)",
    office: "an",
    mode: "4",
    pages: [
    { page: "177", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:17966",
    incipit: "In lege",
    gabc: "(c4) IN(d) le(ff)ge(d!ewfEC) (::) Dó(fh)mi(g)ni(ixhg/hih) (;) fu(h)it(g) vo(f)lún(fg)tas(f) e(fe)jus(c) di(eg)e(e) ac(f) noc(d)te.(d) (::) E(h) u(h) o(g) u(f) a(gf) e.(d) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "149", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:17967",
    incipit: "Praedicans",
    gabc: "(c4) PRǽ(ixdh!iv)di(h)cans(h) (::) præ(h)cép(h)tum(g) Dó(h)mi(g)ni,(f) (;) con(f)sti(f)tú(fg)tus(f) est(f) in(f) mon(fe)te(c) san(ege)cto(fe) e(d)jus.(d) (::) E(h) u(h) o(g) u(f) a(g) e.(gh) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "149", sequence: 2, extent: 1 }
    ],
  },
  {
    id: "gregobase:17988",
    incipit: "Adorate Dominum",
    gabc: "(c4) AD(g)o(g)rá(g)te(fh) Dó(j)mi(k)num(j) (::) in(j) au(ji)la(h) sanc(jh)ta(ih) e(g)jus.(g) (::) E(j) u(j) o(i) u(j) a(h) e.(g) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "233", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:18273",
    incipit: "Ecce merces sanctorum",
    gabc: "(c4)Ec(f)ce(d) mer(f)ces(e) san(d)ctó(c)rum(c) * co(d)pi(dg)ó(g)sa(f) est(ef) a(g)pud(f) De(e)um:(e) (:) ip(d)si(e) ve(gh)ro(h) (;) mór(h)tu(g)i(f) sunt(g) pro(g) Chri(fe)sto,(d) (;) et(d) vi(d)vent(c) in(e) æ(eg)tér(e)num.(e) (::) E(h) u (g) o(h) u(ih) a(gf) e(e) (::)",
    office: "an",
    mode: "4",
    pages: [
    { page: "181", sequence: 0, extent: 0 }
    ],
  }
];

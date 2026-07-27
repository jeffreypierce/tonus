// am1.ts — Antiphonale monasticum I
// Extracted from GregoBase (source ID 17) by scripts/extract-gregobase.mjs
// Chants: 5
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
    id: "gregobase:4352",
    incipit: "Ecce iam venit",
    gabc: "(c3) EC(h)ce(h) iam(hf~) ve(hi)nit(h) *() ple(h)ni(gxg)tú(f)do(e) tém(f)po(e)ris,(d) (;) in(d) quo(f) mi(fe)sit(d) De(ef)us(f) (,) Fí(h)li(h)um(h) su(e)um(e) in(f) ter(ed~)ras.(d) (::) E(h) u(h) o(i) u(gxg) a(h) e.(f) (::)",
    office: "an",
    mode: "5",
    pages: [
    { page: "39", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:4390",
    incipit: "Annuntiate populis",
    gabc: "(c3) AN(f)nun(e)ti(f)á(hi)te(i!/io) *(,) pó(h)pu(i)lis(j) et(ih~) dí(i)ci(i)te :(i) (;) Ec(fi)ce(hg) De(fe)us(f) (,) Sal(e>)vá(d)tor(e) nos(f)ter(h>) vé(f)ni(ef)et.(f) (::) <eu>E(i) u(h) o(i) u(j) a(h) e.(f) (::)</eu>",
    office: "an",
    mode: "4",
    pages: [
    { page: "42", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:4414",
    incipit: "Beatam me dicent",
    gabc: "(c4) BE(g)á(gj)tam(h>) *() me(g) di(h)cent(gf~) om(gh>)nes(g) ge(h)ne(gf)ra(g)ti(gh)ó(f)nes,(f) (;) qui(f)a(g) an(f)cíl(g)lam(h) hú(jk)mi(j)lem(ji!/jkj) (,) res(h)pé(j)xit(i) De(g)us.(g) (::) E(j) u(j) o(i) u(j) a(h) e.(g) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "29", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:4440",
    incipit: "Super te Ierusalem orietur",
    gabc: "(c4) SU(e)per(e) te,(e) Ie(fd)rú(e)sa(f)lem,(ggo<) *(;) O(e)ri(f)é(dc)tur(d) Dó(f)mi(f)nus.(e) (::) <sp>V/</sp>. Et(c) gló(de)ri(e)a(e) e(ef~)ius(e) (,) in(e) te(e) vi(fd)dé(e)bi(f)tur.(ggo<) <sp>V/</sp>.(::) Gló(e)ri(g)a(g) Pa(gh)tri,(h) et(h) Fí(g)li(h)o,(e) (,) et(e) Spi(e)rí(e)tu(fe)i(d) San(e!f<)cto.(g) (::)",
    office: "rb",
    mode: null,
    pages: [
    { page: "4", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:7474",
    incipit: "Ave Maria... tecum",
    gabc: "(c4) A(h)ve,(g) Ma(f)rí(gh)a,(g) *() grá(h)ti(f)a(h) ple(ji)na,(h) (,) Dó(h)mi(gf)nus(gh) te(g)cum.(g) (::) E(j) u(j) o(i) u(j) a(h) e.(g) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "5", sequence: 0, extent: 1 }
    ],
  }
];

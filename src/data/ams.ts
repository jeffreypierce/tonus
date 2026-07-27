// ams.ts — Antiphonale Monasticum Solesmense
// Extracted from GregoBase (source ID 38) by scripts/extract-gregobase.mjs
// Chants: 11
import type { Chant } from "./types.js";
import type { ChantData } from "./gr.js";

export const AMS_SOURCE: Chant["source"] = {
  book: "Antiphonale Monasticum Solesmense",
  fullTitle: null,
  edition: null,
  year: 1935,
  editor: "Solesmes",
  scanSource: "Scan courtesy of Dominique Crochu",
  code: "ams",
};

export const AMS_DATA: ChantData[] = [
  {
    id: "gregobase:9299",
    incipit: "Gertrudis arca Numinis",
    gabc: "(c4)GEr(g)trú(hi)dis,(j) ar(ih)ca(g) Nú(h')mi(f)nis,(g'_) (,)\r\nSpon(i)só(k')que(j) junc(i)ta(k) Vír(ji)gi(h)num,(g.) (;)\r\nDa(g) nup(h')ti(f)á(g)lis(e) pán(fe)ge(d)re(c'_) (,)\r\nCas(g)tos(hi) a(j)mó(ih)res(g) fœ(h')́de(f)ris.(g.) (::)\r\n",
    office: "hy",
    mode: "8",
    pages: [
    { page: "1223", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:9301",
    incipit: "Annulis septem subarrhavit me",
    gabc: "(c3)AN(i)nu(i)lis(i) sep(i')tem(g) sub(i')ar(j>)rhá(i)vit(hi~) me(i.) *(,) Dó(ij)mi(i)nus(i) me(i')us(g) Je(hi)sus(g) Chris(e.)tus,(e.) (;) et(e) tam(g)quam(hf~) spon(h_)sam(g'_) (,) de(f)co(e')rá(f_)vit(f'_) me(h) co(g)ró(e.)na.(e.) (::)",
    office: "an",
    mode: "7",
    pages: [
    { page: "1225", sequence: 2, extent: 1 }
    ],
  },
  {
    id: "gregobase:9302",
    incipit: "Habuit Gertrudis potestatem",
    gabc: "(c4)HA(d)bu(e)it(c') Ger(d)trú(dh'!iv)dis(h.) *(,) pot(hg)es(gf)tá(ghg')tem(h_/iih.) (,) cláu(h>)de(j)re(jk) cæ(ji)lum(hg~) nú(h)bi(ij)bus,(h.) (;) et(h_ggo) a(e)pe(f')rí(g)re(g_e) por(gh)tas(fe) e(d!ewf_e)jus:(dc..) (;) qui(e)a(ed) lin(cd~)gua(d) e(e_f)jus(ghg/hiHGgo) (,) cla(e')vis(f) cæ(g)li(fe) fac(d)ta(cd) est.(d.) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "1225", sequence: 3, extent: 2 }
    ],
  },
  {
    id: "gregobase:9304",
    incipit: "Ad sacros Virgo",
    gabc: "(f3)Ad(c) sa(f')cros(e) vir(f.)go(h.) (,) thá(g)la(f)mos(g') an(h)hé(g.)lans(f.) (;)\r\nNúp(ff)ti(f')as(g) cæ(h.)lo(e.) (,) ce(h)le(i)brá(j')re(kxk) ges(i.)tit,(j.) (:)\r\nEt(j) pi(i')is(h) vo(g.)tis(i.) (,) ní(f)mi(f)um(g') mo(e)rán(d.)tem(c.) (,)\r\nPró(h)vo(f')cat(g) ho(e.)ram.(f.) (::)\r\n",
    office: "hy",
    mode: "2",
    pages: [
    { page: "1226", sequence: 2, extent: 2 }
    ],
  },
  {
    id: "gregobase:9306",
    incipit: "Casta columba nidificans",
    gabc: "(c4)Cas(h)ta(f') co(g)lúm(gh)ba(g.) (,) ni(gh)dí(hg)fi(f)cans(g'_) in(f) ca(g')vér(h)na(g') ma(h)cé(hj)ri(h)æ(h.) (,) sa(i)cri(j) lá(k')te(j)ris(ji) Je(h)su(hi) Chris(h)ti,(g.) (;) mel(ghg') su(e)a(fg)vís(g)si(fe)mum(d.) (,) de(e_f) pe(gf)tra(gh) su(h)gé(g.)bat.(g.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "1229", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:9307",
    incipit: "Loquebatur Christus ad dilectam",
    gabc: "(c4)LO(d)que(e_f)bá(g)tur(g) Chris(gh)tus(g'_) *() ad(g) di(g')léc(g)tam(d') Ger(e)trú(fe)dem(e'_) (,) fá(f)ci(fe)e(f') ad(g) fá(gh)ci(g)em,(g.) (;) sic(i_j)ut(h) so(h)let(gf) lo(g)qui(d) ho(e_f)mo(g'_) (,) ad(g) a(gf)mí(g)cum(ghg) su(e.)um.(e.) (::)",
    office: "an",
    mode: "4",
    pages: [
    { page: "1229", sequence: 2, extent: 1 }
    ],
  },
  {
    id: "gregobase:9308",
    incipit: "Beatae Gertrudis verba",
    gabc: "(c3)BE(e)á(e)tæ(g') Ger(h)trú(i_h)dis(g_h) ver(i_j)ba(i'_) *(,) di(i)ví(j')ni(i) e(hi)rant(h') a(h)mó(hg)ris(fe) já(fe)cu(de)la:(e.) (;) lám(f')pa(e)des(d) e(e_f)jus,(f.) (,) lám(g')pa(h)des(i) i(hg)gnis(fe) at(d)que(f_h) flam(g)má(e.)rum.(e.) (::)",
    office: "an",
    mode: "7",
    pages: [
    { page: "1229", sequence: 3, extent: 1 }
    ],
  },
  {
    id: "gregobase:9309",
    incipit: "Dilectae animam e carcere corporis",
    gabc: "(c4)DI(f)léc(gh)tæ(f) á(g')ni(f)mam(f'_) *(,) e(f) cár(e')ce(f)re(d') cór(c)po(d)ris(fe) ex(gh)e(gh)ún(fv_2fv_2//ggf)tem(f.) (;) ac(f)cé(ixf!gwh!io)pit(h) Chris(hj)tus(h') in(h) ul(h')nas(g) su(hv_GF)as,(f.) (;) et(e) cor(fg~) su(gf)um(d_c) il(f)li(fg) a(g)mán(gf)ter(g) a(ghg)pé(f')ru(f)it.(f.) (::)",
    office: "an",
    mode: "6",
    pages: [
    { page: "1230", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:9321",
    incipit: "Damasci praepositus",
    gabc: "(c3)DA(e!fwh)má(f)sci,(fe) *() præ(d)pó(ef)si(f)tus(e.) (,) gen(g')tis(h) A(i')ré(h)tæ(f') re(h)gis(g.) (;) vó(h')lu(h)it(h') me(h) com(hg~)pre(f)hén(g_h)de(g)re :(e.) (:) a(e) frá(ef)tri(e)bus(ef) per(e) mu(e_fE'D)rum(d'_) (,) sub(d)mís(e')sus(d) sum(e') in(f) spor(h_i)ta:(htg/hih.) (;) et(h) sic(i) e(g')vá(h)si(f') ma(h)nus(e') e(f>)jus(e'_) (,) in(e>) nó(c_d)mi(ef)ne(f') Dó(e)mi(de)ni.(e.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "812", sequence: 3, extent: 2 }
    ],
  },
  {
    id: "gregobase:9322",
    incipit: "Ter virgis caesus sum",
    gabc: "(c3)TER(e!fwh) vir(f>)gis(ed) cæ(ef)sus(f) sum,(e.) *(,) se(g')mel(h) la(i)pi(hf)dá(h')tus(h) sum:(g.) (;) ter(i) nau(i)frá(h')gi(h)um(h) pér(ij)tu(i)li(hg/hih.) (,) pro(fe) Chris(f!gwh_f)ti(g') nó(e)mi(de)ne.(e.) (::) E(h) u(h) o(g) u(h) a(f) e.(e.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "813", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:10402",
    incipit: "Gratia Dei in me",
    gabc: "(c3)\r\nGRá(f)ti(e)a(f) De(h_i)i(ii) *(,)\r\nin(h) me(i) vá(j')cu(h)a(ij) non(j>) fu(i.)it:(i.) (;)\r\nsed(i) grá(f_i)ti(h')a(g) e(f_e~)jus(f_e) (,)\r\nsem(d')per(e) in(f') me(h) ma(f.)net.(f.) (::) E(i) u(h) o(i) u(j) a(h) e.(f.) (::)\r\n",
    office: "an",
    mode: "4",
    pages: [
    { page: "812", sequence: 2, extent: 1 }
    ],
  }
];

// lr.ts — Liber Responsorialis
// Extracted from GregoBase (source ID 56) by scripts/extract-gregobase.mjs
// Chants: 29
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
    id: "gregobase:13364",
    incipit: "Jesu Rex admirabilis",
    gabc: "(c4)JE(c)su,(d) Rex(eg) ad(gf)mi(ede)rá(f)bi(e)lis,(d) (:) Et(ce) tri(g)um(h)phá(h)tor(g) nó(h!iwjIH)bi(g)lis,(h) (:) Dul(hih)cé(g)do(fg) in(e)ef(dc)fá(d)bi(e)lis,(fe) (:) To(c)tus(d) de(eg)si(gf)de(ede)rá(f)bi(e)lis:(d) (::)",
    office: "hy",
    mode: "1",
    pages: [
    { page: "431", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:15398",
    incipit: "Alleluia, Spiritus",
    gabc: "(c3) AL(d/fh~)le(h)lú(hhh)ia,(hihjvIH'Ghf..) (;) Spí(fh)ri(f)tus(fe) Dó(fg)mi(f)ni(f.) (,) re(f)plé(fg)vit(e) or(f!gwh)bem(e) ter(fh)rá(h)rum,(gf..) (;)\r\n<sp>*</sp> Ve(f!gwh)ní(e)te(fh) a(h)do(g)ré(hg)mus,(f.) (,)\r\nal(f!gwh)le(ev.de'f)lú(feede)ia.(ed..) <i>Ps.</i> (::)\r\n Ve(h)ní(h)te.(hihh!fgf) (::) ",
    office: "an",
    mode: "5",
    pages: [
    { page: "107", sequence: 2, extent: 1 }
    ],
  },
  {
    id: "gregobase:15672",
    incipit: "Annuntiaverunt inter gentes",
    gabc: "(c4)AN(e)nun(ed-)ti(g)a(h)ve(gh/jj)runt(j) (::) in(i)ter(j) gen(k)tes(ji) glo(h)ri(g)am(h) Do(i)mi(hg)ni,(g) (:) in(h) om(j)ni(i)bus(gh) po(e)pu(f)lis(g) (;) mi(g)ra(f)bi(gh)li(g)a(g) e(e)jus.(e) (::) E(j) u(j) o(i) u(hi) a(h) e(gh) (::)\r\n",
    office: "an",
    mode: "3",
    pages: [
    { page: "140", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16131",
    incipit: "In conceptióne sua",
    gabc: "(c4)IN(d) Con(f)cep(e)ti(f)ó(g)ne(ed) su(fe)a(dc) *() ac(f)cé(ixfgi)pit(ih) Ma(g)rí(gh)a(h) (;) be(h)ne(h)di(f)cti(h)ó(j)nem(hg) a(ixi) Dó(gh)mi(g)no,(f) (:) et(h) mi(gf)se(g)ri(f)cór(f)di(e)am(de) a(c) De(df)o(f) sa(e)lu(f)tá(gh)ri(fe) su(d)o.(d) (::) E(h) u(h) o(g) u(f) a(gh) e.(gf) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "261", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16133",
    incipit: "Adjúvit eam",
    gabc: "(c3)Ad(f)jú(d)vit(f) e(hi)am(h) *() De(gh)us(f) ma(hi)ne(ij) di(ih)lú(i)cu(h)lo:(h) (;) sanc(fi)ti(i)fi(h)cá(h/jkJH)vit(h) ta(g)ber(h)ná(i)cu(h)lum(gh) su(fe)um(ed) Al(e)tís(ef)si(e)mus.(d) (::) E(h) u(h) o(i) u(g) a(h) e.(f) (::) ",
    office: "an",
    mode: "5",
    pages: [
    { page: "261", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16134",
    incipit: "Per unum hóminem",
    gabc: "(c4)Per(d) u(cd)num(d) hó(d)mi(d)nem(dfd/evDC/dc//) *(;) pec(d)cá(d!ewf/gf)tum(fd) in(f) hunc(gh) mun(ixhvGF!gwh/ivHG~)dum(hg) in(fhg)trá(ge/fvEDe)vit,(dvcd/ed) (:) \r\nin(cd) quo(dc) om(fe/ghGF~)nes(gf) pec(h)ca(gh)vé(fvED)runt.(d/f/fd/fghv/hg) *(:) Ne(h) tí(ixfg/hg/hi)me(h)as(h) Ma(h)rí(hjIG/h!iwj)a,(ih) (;) in(dh~)ve(hg)ní(ixghGF!gwhivHGFgh)sti(h) grá(h/jkJH/hg/hvGF/gvFD;fgd/fvECd/ce/gv/efe)ti(cd)am(d) (,) a(d)pud(de) De(evDCd!ef)um.(ed) (Z) (::) <sp>V/</sp>. E(h)rí(h)pu(h)it(hg/hg/gf) Dó(gh)mi(g)nus(g) (;) á(g)ni(g)mam(g) tu(hf)am(gh) de(gh) mor(ixhih)te,(h) (;) et(gf) con(gh)tra(h) i(h)ni(h)mí(ixhi)cum(h) (;) fa(h)ctus(h) est(h) pro(hg/hg)té(gf)ctor(f!gh) tu(hvGFEgh)us.(gf) *(::) Ne(h) tí(ixfg/hg/hi)me(h)as.(h) (::)",
    office: "re",
    mode: "1",
    pages: [
    { page: "262", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16187",
    incipit: "Admirábile est nomen tuum",
    gabc: "(c4) AD(c)mi(d)rá(ixdhiv)bi(h)le(h) est(h) *() no(h)men(g) tu(f!gh)um(h) Dó(d)mi(cd)ne :(d) (:) qui(dh)a(h) gló(j)ri(h)a(g) et(h) ho(g)nó(h)re(h) co(h)ro(gf)nás(e)ti(f) San(g)ctos(fe) tu(d)os,(d) (:) et(dgfg) con(g)sti(f)tu(g)í(h)sti(fe) e(d!ef)os(fc) su(c)per(d) ó(f)pe(g)ra(f) má(h)nu(g)um(fe) tu(fgf)á(d)rum.(d) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "382", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16188",
    incipit: "Dómine qui operáti justítiam",
    gabc: "(c4) DÓ(f)mi(f)ne,(efd/dc) *() qui(f) o(g)pe(f)rá(g)ti(g) sunt(g) jus(h)tí(f)ti(ef)am,(f) (;) ha(ixih)bi(g)tá(i)bunt(h) in(g) ta(f)ber(g)ná(de)cu(f)lo(g) tu(fd)o,(dc) (:) et(cd) re(f)qui(f)é(gg)scent(f) in(h) mon(g)te(f) san(g)cto(ghg) tu(f)o.(f) (::)",
    office: "an",
    mode: "6",
    pages: [
    { page: "382", sequence: 0, extent: 1 }
    ],
  },
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
    id: "gregobase:16204",
    incipit: "Ego sum panis vitæ",
    gabc: "(c3)E(e)go(g!hi) sum(i_) *\r\npa(ji)nis(hi) vi(ij/klj/klk)tæ:(ji..) (:)\r\npa(hg)tres(hi) ve(ih)stri(ffe) man(fe)du(de)ca(e')vé(e/ihi)runt(i) man(ikj/lv/jki)na(h) in(jk) de(i)sér(hi)to,(i.) (:)\r\net(ei) mór(ijIH'hf/hvGF'E)tu(de)i(ef@gvFEf) sunt:(fe) *(:)\r\nHic(e) est(e) pa(e_hg)nis(hi) de(hj) cæ(jikvJI)lo(h_i) de(i)scén(iji)dens,(i_) (:)\r\nut,(i) si(e) quis(i) ex(hg) i(fg)pso(e) man(hvGFhj)dú(hi)cet,(i.) (:) non(ij!k'l) mo(kmkl)ri(lvKJ'IjvI__Hi ; ei@jvIHih'hvGF'E)á(de)tur.(effe.) \r\n\r\n<sp>V/</sp>.(::)\r\n\r\nE(ih)go(fe) sum(e) pa(ehg)nis(hi) vi(iji)vus,(i) (;) qui(i) de(kj) cæ(kl)lo(kvJI) de(ji)scén(hi)di:(i) (:)\r\nsi(e) quis(i) man(i)du(i)cá(ji)ve(hi)rit(i) ex(k) hoc(jvIH) pa(i)ne,(i) (;) vi(ih)vet(hg) in(hi) æ(hvGFh)tér(efe)num.(e) *(::) Hic.(e) est.(e) (::)\r\n",
    office: "re",
    mode: "7",
    pages: [
    { page: "128", sequence: 0, extent: 2 }
    ],
  },
  {
    id: "gregobase:16421",
    incipit: "Caro mea vere est cibus",
    gabc: "(c3)Ca(ei)ro(ivHG) me(hi)a(ji) *(,) ve(hvGF)re(g) est(f) ci(e)bus,(e) (:) et(ei) san(h)guis(i) me(j)us(i) ve(jk/lk)re(j) est(i) po(hi)tus;(i) (:) qui(i) man(g)dú(hg)cat(f) car(h)nem(i) me(j)am,(i) (;) et(i) bi(j)bit(i) sán(h)gui(h)nem(f) me(h)um,(g) (;) ha(h)bé(i)bit(h) vi(g)tam(h) æ(f)tér(fe)nam,(d) di(ef)cit(f) Dó(e)mi(e)nus.(e) (::)",
    office: "an",
    mode: "7",
    pages: [
    { page: "130", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16690",
    incipit: "Gaudete et exsultate",
    gabc: "(c4)Gau(h)dé(fg)te(g) *(,) et(h) ex(j)sul(j)tá(hig)te,(g) (;) qui(g)a(g) nó(h)mi(g)na(g) ve(fe)stra(d) (,) scrip(e)ta(f) sunt(gh) in(h) cæ(gg)lis,(f) di(gh)cit(h) Dó(g)mi(g)nus.(g) (::) E(j) u(j) o(i) u(j) a(h) e.(g) (::)\r\n",
    office: "an",
    mode: "8",
    pages: [
    { page: "144", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16733",
    incipit: "Homo natus est in ea",
    gabc: "(c3)HO(ig/ij)mo(i) *() na(ij)tus(i) est(h) in(h) e(ghf/fe)a,(e) (:) et(f) ip(hg)se(f) fun(gh)dá(i)vit(g) e(h)am(f) Al(e)tís(fg)si(f)mus.(e) (::)",
    office: "an",
    mode: "7",
    pages: [
    { page: "74", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16765",
    incipit: "Reges Tharsis",
    gabc: "(c4)Re(f)ges(e) Thar(d)sis(d) *(,) et(d) in(e)su(f)læ(ixghg/hih) (;) mú(h)ne(g)ra(f) óf(g)fe(f)rent(fe~) Re(g)gi(fe) Dó(d)mi(d)no.(d) (::)\r\n",
    office: "an",
    mode: "1",
    pages: [
    { page: "70", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16766",
    incipit: "Afferte Domino",
    gabc: "(c3)Af(e)fér(g)te(h) Dó(i)mi(j)no,(i) *() fí(ij)li(h)i(f) De(hhi)i,(h) (:) a(h)do(i)rá(g)te(h) Dó(f)mi(e)num(f) (;) in(d) au(e)la(f) san(g)cta(f) e(e)jus.(e) \r\n(::)",
    office: "an",
    mode: "7",
    pages: [
    { page: "69", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16767",
    incipit: "Adorate Deum omnes angeli",
    gabc: "(c3)Ad(e)o(f)rá(h)te(h) De(hj)um,(i) *() om(h)nes(i) An(k)ge(j)li(i) e(hi)jus:(i) (:) au(g)dí(ij)vit(i) (;) et(j) læ(ih)tá(i)ta(h) est(fgf) Si(e)on.(e) (::)",
    office: "an",
    mode: "7",
    pages: [
    { page: "338", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16803",
    incipit: "Omnis terra adoret te",
    gabc: "(c4)Om(f)nis(d) ter(f)ra(fd) *() a(ef)dó(g)ret(f) te,(e) et(f) psal(e)lat(cd) ti(d)bi:(d) (:) psal(c)mum(df) di(f)cat(f) nó(f)mi(f)ni(f) tu(f)o,(f) Dó(d)mi(f)ne.(e) (::)",
    office: "an",
    mode: "4",
    pages: [
    { page: "70", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16806",
    incipit: "Hodie in Jordane",
    gabc: "(c4)Hó(g)di(hj)e(j) *() in(jji~) Jor(h)dá(hjji)ne(gh!iwjIH/ijgg/efe) (:) bap(e)ti(fg)zá(g)to(hgg) Dó(f)mi(ixghg/hi)no(h) (;)\r\na(h)pér(jh/jjj)ti(g) sunt(ghGFghg) cœ(egff)li,(fe) (:) et(gef) si(ed)cut(gh) co(g)lúm(ig/h/jj/kjj)ba(ji) (;) su(g)per(ghj) e(ji/ih/ivHGh)um(hg) (;) Spí(j)ri(j)tus(ih) man(jvIHivH~G~)sit,(hg) (:)\r\net(gh) vox(jkjk) Pa(ij)tris(h) in(g)tó(hgh)nu(ege/fvEDe)it :(ed) *(:) Hic(gff/ded/ghjvIH!ij) est(j) (;) Fí(j)li(ji)us(hg) me(h)us(gf) di(gh)lé(g)ctus,(ge/fvED/ed) (:) in(f) quo(ghg) mi(ixhiHGFgh)hi(g) (;) be(gh)ne(g) com(gh!iwjIHjg/hiHG)plá(e)cu(egff)i.(fe) \r\n<sp>V/</sp>.(::) De(j)scén(ikjj)dit(h!iwjIHG) Spí(j)ri(j)tus(j) San(ij)ctus(h) (;) cor(h)po(h)rá(h)li(h) spé(hi)ci(h)e(h) (;) si(h)cut(h) co(h)lúm(hg)ba(h) in(j) i(ikjj)psum,(ji) (:) et(hg) vox(hj) de(j) cæ(kjjh/iji)lo(hg) fa(ghj)cta(jiih/ivHGh) est:(hg) *(::) Hic(gff/ded/ghjvIH!ij) est(j) (::)",
    office: "re",
    mode: "3",
    pages: [
    { page: "71", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:17645",
    incipit: "Consurgens Joseph",
    gabc: "(c4) Con(f)súr(fe)gens(de) Jo(e)seph,(e) *(,)\r\nac(g)cé(g)pit(e) Pú(f)e(e)rum(d) et(e) Ma(f)trem(gf) e(g)jus(gh) no(e)cte,(e) (;)\r\net(ixdh!iv) se(h)cés(hvGF)sit(g) in(ghg) Æ(fe)gýp(de)tum:(e) (:) et(e!fg) e(fe)rat(de) i(d)bi(c) us(g)que(g) ad(f) ó(gh)bi(g)tum(g) He(fgf)ró(e)dis.(e) (::)\r\n",
    office: "an",
    mode: "4",
    pages: [
    { page: "304", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:17648",
    incipit: "Admonitus in somnis Ioseph",
    gabc: "(c4) Ad(g)mó(gd)ni(e)tus(f) in(g) so(gh)mnis(h) Jo(g)seph(g) *(;) se(h)cés(hj)sit(h) in(g) par(h)tes(gf) Ga(g)li(g)læ(hvGF)æ:(f) (:)\r\net(f) vé(g)ni(f)ens(g) ha(j)bi(ih)tá(j)vit(g) in(g) ci(f)vi(g)tá(h)te,(g) quæ(h) vo(gf)cá(g)tur(gh) Ná(f)za(f)reth;(d!efEC) (:) ut(f) ad(g)im(h)ple(j)ré(ji)tur(h) (,)\r\nquod(j) di(k)ctum(i) est(ji) per(hg) pro(fg)phé(g)tas:(g) (;)\r\nQuó(gh)ni(g)am(gd) Na(e)za(f)ræ(gf)us(gh) vo(h)cá(g)bi(g)tur.(g) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "308", sequence: 0, extent: 2 }
    ],
  },
  {
    id: "gregobase:17667",
    incipit: "Justus germinabit",
    gabc: "(c4)JUs(f)tus(e) (::) ger(f)mi(de)ná(ed)bit(c) si(d)cut(f) lí(fe)li(de)um,(e) (;) &(e) flo(g)ré(gh)bit(g) in(h) æ(f)tér(gf)num(dc) an(g)te(fe) Dó(d)mi(de)num.(e) (::) E(h) u(g) o(h) u(ji) a(hg) e(e) (::)  ",
    office: "an",
    mode: "4",
    pages: [
    { page: "198", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:17798",
    incipit: "Factus est repente",
    gabc: "(c3) FAc(h)tus(h) est(h) re(h)pén(h)te(h) de(h) cæ(h)lo(h) so(hih)nus(hgh) (::) ad(h)ve(f)ni(h)én(gf)tis(e)\r\nspí(e)ri(e)tus(ef) ve(d)he(f)mén(hf~)tis,(gh) (;)\r\nal(f)le(e)lú(f)ia,(g) al(f)le(d)lú(f)ia.(e) (::) E(h) u(h) o(f) u(h) a(i) e.(h) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "108", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:17799",
    incipit: "Emitte Spiritum tuum",
    gabc: "(c3)E(h)mít(h)te(h) Spí(h)ri(h)tum(h) tu(hih)um,(hgh) (::) &(h) cre(f)a(h)bún(gf)tur (e) :(:) &(f) re(d)no(f)vá(hg)bis(e) fá(f)ci(h)em(g) ter(h)ræ,(f) (;) al(f)le(e)lú(f)ia,(g) al(f)le(d)lú(f)ia.(e) (::) E(h) u(h) o(f) u(h) a(i) e.(h) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "115", sequence: 0, extent: 1 }
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
    id: "gregobase:17994",
    incipit: "Dominus in templo",
    gabc: "(c4) DO(j)mi(j)nus(i) in(g) tem(i)plo(j) (::) sanc(h)to(g) su(hg)o,(fh) (:) Dó(j)mi(j)nus(i) in(g) cæ(i)lo(j) se(h)des(h) e(g)jus.(g) (::) E(j) u(j) o(h) u(j) a(k) e.(j) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "232", sequence: 2, extent: 1 }
    ],
  },
  {
    id: "gregobase:18053",
    incipit: "Exaltabo te Domine",
    gabc: "(c4) EX(g)al(g)tá(g)bo(h) te,(gf) Dó(g)mi(h)ne,(g) (::) quó(f)ni(h)am(j) su(j)sce(i)pí(h)sti(j) me,(ih) al(g)le(f)lú(hh)ia.(g) (::) E(j) u(j) o(i) u(j) a(h) e.(g) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "96", sequence: 3, extent: 1 }
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

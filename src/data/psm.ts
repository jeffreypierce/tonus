// psm.ts — Psalterium Monasticum
// Extracted from GregoBase (source ID 24) by scripts/extract-gregobase.mjs
// Chants: 60
import type { Chant } from "./types.js";
import type { ChantData } from "./gr.js";

export const PSM_SOURCE: Chant["source"] = {
  book: "Psalterium Monasticum",
  fullTitle: null,
  edition: "Office divin selon le rit bénédictin",
  year: 1981,
  editor: "Solesmes",
  scanSource: "Scan courtesy of Dominique Crochu",
  code: "psm",
};

export const PSM_DATA: ChantData[] = [
  {
    id: "gregobase:3252",
    incipit: "Domine in virtute",
    gabc: "(c4) DO(f)mi(fg)ne,(g) *() in(g) vir(g)tú(gh)te(g) tu(g) a(f) (,) l<sp>ae</sp> -(h) tá(hjh)bi(i)tur(h) rex.(g) (::) (z) \r\nE(j) u(j) o(i) u(j) a(h) e.(g) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "31", sequence: 2, extent: 1 }
    ],
  },
  {
    id: "gregobase:3304",
    incipit: "Nonne sic",
    gabc: "(c4) NOn(f)ne(fg) sic(g_') *() o(h)pór(j)tu(j)it(i') pa(j)ti(h) Chri(j)stum,(g.) (;)\r\net(g) in(g)trá(hi)re(h') in(g) gló(h)ri(g)am(f) su(fe)am?(d_') + Al(f)le(gh)lú(g.)ia.(g.) (::) (z)\r\n<v>(</v><i>In Quadr.</i><v>)</v>() + di(f)cit(gh) Dó(g)mi(fg)nus.(g.) (::)\r\n<eu>E(j) u(j) o(i) u(j) a(h) e.(g.) </eu>(::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "363", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:7476",
    incipit: "Veniet ecce Rex",
    gabc: "(c4) Ve(e)ni(c)et(d) ec(dhghiv)ce(h) Rex(gh_h_g) ex(f)cél(ee)sus(d.) *(,) cum(d) pot(e)e(f)stá(g)te(fe) ma(de)gna,(ddc) (,) ad(d) sal(dd)ván(c)das(d) gen(fg)tes,(ec) al(d)le(ef)lú(d.)ia.(d.) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "31", sequence: 0, extent: 0 }
    ],
  },
  {
    id: "gregobase:7477",
    incipit: "In adventu summi",
    gabc: "(c4) IN(c) ad(d)vén(cdwefo)tu(e) *() sum(e)mi(fg) Re(gvFDe)gis(e.) (,) mun(dh)dén(h)tur(hg~) cor(hih)da(gf) hó(ghg)mi(fd)num,(e.) (;) ut(efwg!FE) di(de)gne(ddc) am(c)bu(de)lé(fe)mus(d.) (,) in(dg) oc(gf)cúr(gh)sum(gf) il(de)lí(e.)us(e.) (;) qui(cdwefo)a(e) ec(e)ce(fg) vé(gf)ni(dc)et(c_') (,) et(d) non(fe~) tar(de)dá(e.)bit.(e.) (::)",
    office: "an",
    mode: "4",
    pages: [
    { page: "37", sequence: 0, extent: 0 }
    ],
  },
  {
    id: "gregobase:7561",
    incipit: "Christo datus est",
    gabc: "(c4)CHris(g)to(gv_FD) da(f)tus(gh) est(g.) *(,)\r\nprin(g)ci(g)pa(h')tus(g) et(f) ho(gh)nor(g) reg(fef)ni:(d!ewf.) (;)\r\nom(c)ni(d') po(f)pu(fg)lus,(g.) (,) \r\ntri(h)bus(g) et(hj) lin(jij)guæ(ih__) ser(ij)vi(h)ent(g) e(hg)i(e_f) in(gh) æ(h)ter(g.)num.(g.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "372", sequence: 1, extent: 2 }
    ],
  },
  {
    id: "gregobase:7563",
    incipit: "Beati qui lavant",
    gabc: "(c4)BE(h)á(f_g)ti(g_') *(,) qui(g) la(h)vant(gf) sto(g)las(gh) su(f.)as(f.) (;) in(hj) sán(jv_IH)gui(i)ne(hi) Ag(g)ni,(g_0h) al(i)le(h)lú(g.)ia.(g.) (::) E(j) u(j) o(i) u(j) a(h) e.(g.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "368", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:7564",
    incipit: "Omnes gentes quascumque",
    gabc: "(c4) OM(f)nes(d) gen(e)tes,(fd__) *(,) quas(ef)cúm(g)que(f') fe(e)cís(cd)ti,(d.) (;) \r\nvé(c)ni(d)ént(e) et(e) a(e)do(f)rá(df)bunt(e_') (,) \r\nco(e)ram(e) te,(ef) Dó(d)mi(f)ne.(e.) (::) E(g) u(g) o(h) u(f) a(g) e.(e.) (::)",
    office: "an",
    mode: "4",
    pages: [
    { page: "377", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:7732",
    incipit: "Rectos decet",
    gabc: "(c4)RE(h)ctos(g) de(h)cet(gf) *() col(e)lau(f)dá(g)ti(f)o.(e.) (::) E(h) u(g) o(h) u(ih) a(gf) e.(e.) (::)",
    office: "an",
    mode: "4",
    pages: [
    { page: "85", sequence: 0, extent: 0 }
    ],
  },
  {
    id: "gregobase:7763",
    incipit: "Per singulos dies",
    gabc: "(c3)PER(h) sín(h)gu(g)los(fe) di(f)es(e'_) *(,) be(d)ne(e)dí(f)cam(g>) te,(e) Dó(fg)mi(fe)ne.(e) (::) E(h) u(h) o(g) u(h) a(f) e.(e) (::)",
    office: "an",
    mode: null,
    pages: [
    { page: "342", sequence: 0, extent: 0 }
    ],
  },
  {
    id: "gregobase:7804",
    incipit: "Iuste et pie",
    gabc: "(f3)IU(ff)ste(e) et(f) pi(g_h)e(i) vi(hg)vá(f.)mus,(f.) *(;) ex(e)spe(f)ctán(hv_2/hv_)tes(f) be(e)á(g)tam(ig~) spem,(hg__) (,) et(e) ad(f)vén(h)tum(g) Dó(e)mi(gh)ni.(f.) (::) E(h) u(h) o(h) u(g) a(ef) e.(f.) (::)",
    office: "an",
    mode: "2",
    pages: [
    { page: "387", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:8655",
    incipit: "Non confundas me Domine",
    gabc: "(c4) NON(d) con(d)fún(d_c~)das(f) me,(g) Dó(f)mi(gh)ne,(h'_) *(,) ab(h) ex(hg)spec(h)ta(g)ti(ef)ó(g)ne(fe) me(d.)a.(d.) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "272", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:8657",
    incipit: "Quam admirabile est",
    gabc: "(c4) QUam(e>) ad(c')mi(d)rá(dh/iv)bi(h)le(h) est(h_') * no(h)men(g) tu(h)um,(gf~) Dó(g)mi(gh)ne,(h'_) (,) in(f) u(e)ni(f)vér(g>)sa(fe) ter(d.)ra.(d.) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "8", sequence: 1, extent: 2 }
    ],
  },
  {
    id: "gregobase:8660",
    incipit: "Ut quid Domine recessisti",
    gabc: "(f3)Ut(f) quid,(hg) Dó(h)mi(g)ne,(f.) *(,) re(gh)ces(fe)sís(f)ti(gh) lon(f.)ge ?(f.) (::)",
    office: "an",
    mode: "2",
    pages: [
    { page: "11", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:8661",
    incipit: "Tu Domine servabis nos",
    gabc: "(c4) Tu(h) Dó(f)mi(fg)ne(g') *() ser(g)vá(h)bis(g) nos,(f.) (;) et(f) cu(g)stó(f)di(g)es(h) nos(h!iwjh__) in(i) æ(h)tér(g.)num.(g.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "13", sequence: 2, extent: 2 }
    ],
  },
  {
    id: "gregobase:8664",
    incipit: "Inclina Domine aurem tuam",
    gabc: "(c3) IN(ig~)clí(i')na,(j) Dó(i)mi(hi)ne,(i'_) *(,) au(i)rem(g) tu(h)am(g) mi(e.)hi,(e.) (;) et(e) ex(g_h)áu(f_0h>_0)di(gf__) ver(e_f)ba(gf__) me(e.)a.(e.) (::)",
    office: "an",
    mode: "7",
    pages: [
    { page: "18", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:8666",
    incipit: "Diligam te Domine",
    gabc: "(c4)Dí(f)li(g)gam(gh) te,(f) *() Dó(g)mi(fe)ne,(d'_) vir(f)tus(g) me(g)a.(f.) (::) ",
    office: "an",
    mode: "6",
    pages: [
    { page: "20", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:8667",
    incipit: "Vivit Dominus",
    gabc: "(c3)VI(g)vit(h) Dó(i')mi(j)nus,(i.) (,)et(ih__) be(f)ne(h)díc(gf__)tus(e'_) De(f)us(e) sa(d)lú(ef)tis(f) me(e.)æ.(e.) (::)",
    office: "an",
    mode: "7",
    pages: [
    { page: "22", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:9061",
    incipit: "Credidi",
    gabc: "(c3)Cré-(h)di-(hg)di,(f'_) * (,) prop(f)ter(e') quod(f) lo(e)cú-(f)tus(de) sum.(e.) (::)\r\n()E(h) u(h) o(g) u(h) a(f) e(e.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "312", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:9062",
    incipit: "Inclinavit Dominus",
    gabc: "(c4)In-(f)cli-(g)ná-(h)vit(gf) * () Dó(g)mi(f)nus(f'_) au(e)rem(f) su(g)am(fe) mi-(d.)hi.(d.) (::)(z)\r\n()E(h) u(h) o(g) u(f) a(gh) e(g.) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "312", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:9063",
    incipit: "Nos qui vivimus",
    gabc: "(c4)Nos(c) qui(d') ví(f)-vi(fg)mus,(g'_) *(,) be-(h)ne-(ixi)dí-(h)ci(g)mus(f) Dó(gh)mi-(h)no.(g.) (::)()E(g) u(g) o(g) u(d) a(f) e(ed..) (::)",
    office: "an",
    mode: "p",
    pages: [
    { page: "309", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:9064",
    incipit: "Saepe expungaverunt me",
    gabc: "(f3)Sæ-(h_g_)pe(f') *  ex(f)pu(g)gna(h)vé(i)runt(j) me(i'_) (,) a(i) iu(i)-ven(g>)tú(h_i)te(g) me-(h)a.(f.) (::)\r\n()E(i) u(h) o(i) u(j) a(h) e(f.) (::)",
    office: "an",
    mode: null,
    pages: [
    { page: "314", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:9065",
    incipit: "Sana animam",
    gabc: "(c4) SA-(f)na(f) á(g)ni(f)mam(f) me-(g_h)am,(h.) *(;) Qui(g)a(f) pec(gh)cá-(g_f_)vi(g) ti(g.)bi.(f.) (::)  <sp>V/</sp>.  E(f)go(f) di(f)xi:(f) Dó(g)mi(f)ne,(f'_) (,) mi(f)se(f)ré(f)re(f) me(g_h)i.(h.) *(::) <sp>V/</sp>. Gló-(f)ri-(f)a(f) Pa(gh)tri,(h'_) et(h) Fí(ixhi)li(h)o,(h'_) (,) et(h) Spi-(h)rí-(h)tu-(g)i(h) San(gf~)cto(f.) (::) ",
    office: "rb",
    mode: null,
    pages: [
    { page: "315", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:9091",
    incipit: "Ecce quam bonum",
    gabc: "(c4)EC(h)ce(h_') quam(g) bo-(hg)num(e') * et(f) quam(g>) iu-(e)cún(fe)dum(d_') ha-(e)bi(f)tá-(h)re(gf) fra(e_f)tres(g) in(fe) u-(d.)num(d.) (::) ()E(h) u(h) o(g) u(f) a(g) e(go@hv.) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "321", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:9104",
    incipit: "Dominus pascit me",
    gabc: "(c4) Do(f)mi-(f)nus(f') pas(g)cit(gh) me(h.), *(;) Et(g) ni-(f)hil(gh) mi-(g_f_)hi(g) dé-(g)e-(f)rit.(f.) (::) Do(f)mi-(f)nus(f') (::) <sp>V/</sp>.  In(h) pás(hixi)cu-(h)is(h') vi-(g)rén(gh)ti(g)-bus(g'_) (,) me(h) col(g)lo-(f)cá-(gh)vit(h.) *(::) Et(g) ni-(f)hil(gh) mi-(g_f_)hi(g) dé-(g)e-(f)rit.(f.) (::) <sp>V/</sp>. Gló-(h)ri-(h)a(h) Pa(hixi)tri,(h'_) et(g) Fí(gh)li(g)o,(g'_) (,) et(g) Spi-(g)rí-(h)tu-(g)i(gf) San(g)cto(g.h.) ()(::) Do(f)mi-(f)nus(f') (::)",
    office: "rb",
    mode: null,
    pages: [
    { page: "315", sequence: 2, extent: 2 }
    ],
  },
  {
    id: "gregobase:9158",
    incipit: "Domine in caelo",
    gabc: "(f3) DO(h)mi(h)ne,(g') in(h) cæ(fe)lo(g'_) *(,) mi(f)se(g')ri(h)cór(f')di(e)a(f') tu(gh)a.(f.) (::) E(h) u(h) o(h) u(g) a(ef) e.(f.) (::)",
    office: "an",
    mode: null,
    pages: [
    { page: "112", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:9159",
    incipit: "Intellege clamorem",
    gabc: "(c3) IN-(h)tél-(h>_)le-(gh)ge(f.) * cla-(ed)mó-(e)rem(f') me(g)um,(f>') Dó(e)mi-(de)ne.(e.) (::) \r\n()E(h) u(h) o(g) u(h) a(f) e.(e.) (::)",
    office: "an",
    mode: null,
    pages: [
    { page: "110", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:9162",
    incipit: "Laudate Dominus de caelis",
    gabc: "(c4) LAu(hg~)dá(h)te(g) * Dó(e')mi(f)num(g) de(fe) cæ(d.)lis.(d.) (::) (z)\r\nE(h) u(h) o(g) u(f) a(g) e.(gohv.) (::)",
    office: "an",
    mode: null,
    pages: [
    { page: "114", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:11322",
    incipit: "Benedicentur",
    gabc: "(c3)Be(f)ne(e)di(f)cén(h)tur(h) in(h) ip(h_j)so(ii) *(,) \r\nom(h')nes(i) tri(j)bus(ih) terr(i.)æ :(i.) (;) \r\nom(f_i>)nes(hg__) gen(fe__)tes(f_') (,) ma(e)gni(d)fi(e)cá(f')bunt(h) e(f.)um.(f.) (::)\r\nE(i) u(h) o(i) u(j) a(h) e.(f.) (::)\r\n",
    office: "an",
    mode: "2",
    pages: [
    { page: "161", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:11323",
    incipit: "Ego autem",
    gabc: "(c4)E(ed)go(g) {a}u(hi~)tem(i.) *(,) con(i)sti(j)tú(k')tus(j) sum(ji>) rex(h) ab(ji) e(hg)o(g.) (;) su(j)per(i) Si(g!hwig)on,(h_')\r\nmon(g>)tem(e) sanc(f)tum(gh) e(gvFD~)ius,(d_') (,) pr<sp>'ae</sp>(f)di(d)cans(e_f) præ(gf)cép(g)tum(ghg>) e(e.)ius.(e.) (::)\r\nE(i) u(i) o(j) u(hi) a(h) e.(go!hv.) (::)\r\n",
    office: "an",
    mode: "3",
    pages: [
    { page: "3", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:15476",
    incipit: "Sanctificavit tabernaculum",
    gabc: "(c4)Sanc(g)ti(i)fi(h)cá(ji)vit(g_h,) ta(f)ber(h)ná(j)cu(k)lum(i') su(j)um(h.,) Al(hg~)tís(hi)si(hg)mus(g.) (::) E(j) u(j) o(i) u(j) a(h) e(g.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "119", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:15673",
    incipit: "Scio cui credidi",
    gabc: "(c4)Sci(h)o(hf) cu(gh)i(hg) cré(h)di(fe)di,(d'_) <v>\\greheightstar</v>(,) et(f) cer(g)tus(f) sum(f'_) qui(f)a(f) pot(gh)ens(g>) est(f.) (;) de(f)po(fg)si(f)tum(f) me(fg)um(f) ser(f)va(fe)re(c.) (,) in(e) il(g)lum(f) di(fe)em(dc) ius(d)tus(fe) iu(d.)dex.(.d.) (::)E(h) u(h) o(g) u(f) a(g) e(goh.) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "386", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16102",
    incipit: "In noctibus",
    gabc: "(c4) IN(cd) nóc(f)ti(fg)bus(g) *(,) be(h)ne(ixi)dí(h)ci(g)te(f) Dó(gh)mi(h)num.(g) (::)",
    office: "an",
    mode: "d",
    pages: [
    { page: "", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:16898",
    incipit: "Alleluia (Ant. cantica ad Vigilas Dom. per annum)",
    gabc: "(c4)\r\nAL(h>)le(gf)lú(gh)ia,(g'_) <v>\\greheightstar</v>(,) al(h)le(ixi)lú(h>)ia,(gf) al(gh)le(h)lú(g.)ia.(g.) (::) E(g) u(f) o(g) u(h) a(f) e.(g.) (::)",
    office: "an",
    mode: "d",
    pages: [
    { page: "56", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:16899",
    incipit: "Clamaverunt iusti",
    gabc: "(c3)Cla(e)ma(e)vé(-ehg)runt(h) iu(ih/ij)sti(i'_) <v>\\greheightstar</v>(,) et(i) Dó(hgh)mi(gf)nus(e'_) e(f)xau(ed~)dí(ef)vit(f) e(e.)os.(e. ::) E(i) u(i) o(j) u(i) a(h) e(g.f. ::)",
    office: "an",
    mode: "7",
    pages: [
    { page: "87", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:16900",
    incipit: "Lætétur cor",
    gabc: "(c4)Læ(h)té(f_g)tur(g'_) <v>\\greheightstar</v>() cor(h) quæ(ixi)rén(h)ti(g)um(f) Dó(gh)mi(h)num.(g. ::) E(g) u(f) o(g) u(h) a(f) e.(g. ::)",
    office: "an",
    mode: "d",
    pages: [
    { page: "239", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:17590",
    incipit: "Esto mihi",
    gabc: "(c4)E(f)sto(g) mi(h)hi,(gf) Dó(g)mi(f)ne,(f) *(,) in(d) De(f)um(ef) pro(g)te(fe)ctó(d)rem.(f) (::) E(h) u(h) o(g) u(f) a(gh) e.(e) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "158", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:17654",
    incipit: "Salva nos Domine",
    gabc: "(c4)Sal(g)va(hi) nos,(i) *() Dó(ik)mi(j)ne,(ji) vi(h)gi(i)lán(h>)tes,(g.) (;) cu(g)stó(i)di(j) nos(k') dor(j)mi(h)én(j>)tes,(i.) (;) ut(i) vi(g)gi(i)lé(k')mus(j) cum(h) Chri(j)sto(i_j) (,) et(h) re(h)qui(h)e(h)scá(gf)mus(gh) † in(gf) pa(e.)ce.(e.) T. P.(::)  †() in(gf) pa(e)ce,(e_f) al(g)le(gf)lú(e.)ia.(e.) (::) E(i) u(i) o(j) u(h) a(j) e.(ih) (::)",
    office: "an",
    mode: "3",
    pages: [
    { page: "358", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:17689",
    incipit: "Ecce iam venit",
    gabc: "(c4)EC(f)ce(efddc) (/) *() iam(f) ve(fg)nit(g) ple(g)ni(gf)tú(g)do(gh) tém(f)po(g)ris(f.) (;) in(f!gwh) quo(hg__) mi(ixi)sit(h') De(g)us(f.) (,) Fí(g)li(f)um(f') su(g)um(f') in(f) ter(ixfhiv_HG)ras,(h_g_) (;) na(g)tum(g') de(g) Vír(gh)gi(gf)ne,(f.) (,) fac(fg)tum(f) sub(f) le(dec)ge,(c.) (;) ut(c_d) e(ffg)os(f) qui(g) sub(f) le(gh)ge(h) e(hj)rant(hg__) red(hg)í(f)me(f)ret.(f.) (::) E(h) u(h) o(f) u(gh) a(g) e.(f.) (::)",
    office: "an",
    mode: "6",
    pages: [
    { page: "53", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:17803",
    incipit: "Salva nos Domine (T. P.)",
    gabc: "(c4)SAl(g)va(hi) nos,(i) *() Dó(ik)mi(j)ne,(ji) vi(h)gi(i)lán(h>)tes,(g.) (;) cu(g)stó(i)di(j) nos(k') dor(j)mi(h)én(j>)tes,(i.) (;) ut(i) vi(g)gi(i)lé(k')mus(j) cum(h) Chri(j)sto(i_j) (,) et(h) re(h)qui(h)e(h)scá(gf)mus(gh) in(gf) pa(e)ce,(e_f) al(g)le(gf)lú(e.)ia.(e.) (::) E(i) u(i) o(j) u(h) a(j) e.(ih..) (::)",
    office: "an",
    mode: "3",
    pages: [
    { page: "358", sequence: 0, extent: 0 }
    ],
  },
  {
    id: "gregobase:17833",
    incipit: "Beati mundo corde",
    gabc: "(c4)BE(d)á(d)ti(dc) mun(f)do(g) cor(f!gwh>)de,(h.) <sp>*</sp>(,) quó(h)ni(g)am(f) i(f_0fg)psi(f) De(e_f)um(g) vi(fe)dé(d.)bunt.(d.) (::)\r\nE(h) u(h) o(g) u(f) a(gh) e.(gf..) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "391", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:17834",
    incipit: "Cantabimus et psallemus",
    gabc: "(c3) CAn(h)tá(h)bi(h)mus(g') et(h) psal(f)lé(e)mus(g'_) *(,) vir(f)tú(g)tes(h) tu(f)as,(e) Dó(f)mi(e)ne.(e.) (::) E(h) u(h) o(g) u(h) a(f) e.(e.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "31", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:17905",
    incipit: "Ego sum qui sum",
    gabc: "(f3)E(h)go(g_h) sum(f_g) qui(e_f) sum,(f.) *(,) et(h) con(i)sí(j)li(i)um(h') me(i)um(h.) non(hg__) est(i) cum(hg) ím(f)pi(ef)is;(f.) (;) sed(ii) in(gh) le(ij>)ge(i) Dó(hi)mi(h)ni(h.) (,) vo(h)lún(i>)tas(h') me(f)a(h) est,(gf__) al(e)le(eg)lú(f.)ia.(f.) (::) E(h) u(h) o(h) u(g) a(ef) e.(f) (::)\r\n",
    office: "an",
    mode: "2",
    pages: [
    { page: "452", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:17907",
    incipit: "Ego dormivi ",
    gabc: "(c4)E(j)go(j) dor(j)mí(jkj)vi(jij.) *(,) et(j) som(ji>__)num(h_j) ce(ji__)pi;(g.) (;) et(h) ex(f)sur(h)ré(ji__)xi,(g.) (,) quó(g)ni(g)am(g_h) Dó(f)mi(h)nus(j') su(j)scé(i)pit(j) me,(h.) (,)  al(h>)le(g)lú(h)ia(i') al(h>)le(f)lú(h>)ia.(g.) (::) E(j) u(j) o(h) u(j) a(k) e.(j) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "28", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:18038",
    incipit: "Filii Sion",
    gabc: "(c3) FI(h)li(h)i(h) Si(hih)on(hgh.) *(,) ex(f)súl(ed)tent(e) in(fh~) re(hg~)ge(fgf) su(e.)o.(e.) (::) E(h) u(h) o(f) u(h) a(i) e.(h.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "78", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:18039",
    incipit: "Erexit Dominus nobis",
    gabc: "(c3) E(e)ré(g)xit(h) Dó(i)mi(h)nus(g) no(h_i)bis(i.) *(,) cor(ji~)nu(j) sa(kj)lú(i.)tis,(i.) (;) in(j>) do(iv_HF)mo(h') Da(h)vid(g.) (,) pú(iv_HF)e(g)ri(fg) su(e.)i.(e.) (::) E(i) u(i) o(j) u(i) a(h) e.(gf..) (::)",
    office: "an",
    mode: "7",
    pages: [
    { page: "143", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:18040",
    incipit: "Beati qui ambulant",
    gabc: "(c4) BE(g)á(gj)ti(h) qui(g) ám(h>)bu(g)lant(g'_) *(,) in(f) le(g)ge(h') tu(i)a,(hg) Dó(h)mi(g)ne.(g.) (::) E(j) u(j) o(i) u(j) a(h) e.(g.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "261", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:18042",
    incipit: "Exaudiat te Dominus",
    gabc: "(c4) EX(h)áu(g)di(f)at(g) te(h) Dó(j)mi(k)nus(j.) *(,) in(j) di(j)e(j) tri(i)bu(h)la(j_h_)ti(i_h_)ó(g.)nis.(g.) (::) E(j) u(j) o(i) u(j) a(h) e.(g.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "25", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:18043",
    incipit: "Retribuit mihi Dominus",
    gabc: "(c4) RE(e)trí(g)bu(f)et(e') mi(f)hi(dc) Dó(d)mi(f)nus(e.) *(,) se(e)cún(g)dum(gh) iu(h)stí(gf)ti(g)am(gf~) me(e.)am.(e.) (::) E(g) u(g) o(h) u(f) a(g) e.(e.) (::)",
    office: "an",
    mode: "4",
    pages: [
    { page: "20", sequence: 2, extent: 1 }
    ],
  },
  {
    id: "gregobase:18044",
    incipit: "In toto corde meo",
    gabc: "(c4) IN(d) to(d)to(dc) cor(f)de(g) me(f_h)o(h_') *(,) ex(h)qui(h)sí(ixi)vi(h) te,(g) Dó(h)mi(fe)ne:(d.) (;) ne(g) re(g)péll(h)as(g) me(f_') a(e) man(d)dá(g)tis(fe) tu(d.)is.(d.) (::) E(h) u(h) o(g) u(f) a(gh) e.(gf..) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "262", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:18045",
    incipit: "Illuminatio mea",
    gabc: "(c3) IL(h)lu(h)mi(h)ná(h)ti(h)o(g) me(e!fwg)a,(g'_) *(,) et(f) sa(g)lus(h) me(f)a(e) Dó(f)mi(e)nus.(e.) (::) E(h) u(h) o(g) u(h) a(f) e.(e.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "42", sequence: 3, extent: 1 }
    ],
  },
  {
    id: "gregobase:18049",
    incipit: "Magnus Dominus",
    gabc: "(c4) MA(hg~)gnus(h) Dó(g)mi(g)nus(e_') * et(e) lau(f)dá(ge)bi(gh)lis(fe) ni(d.)mis.(d.) (::Z) <eu>E(h) u(h) o(g) u(f) a(g) e.(goh.) </eu>(::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "121", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:18050",
    incipit: "Vivam et custodiam",
    gabc: "(c4) VI(f_g)vam,(g) *(,) et(h) cus(j)tó(jkj)di(ij)am(h>) ser(g)mó(hi)nes(g) tu(hg)os,(f) Dó(gh)mi(h)ne.(g.) (::) E(j) u(j) o(i) u(j) a(h) e.(g.) (::)",
    office: "an",
    mode: "8",
    pages: [
    { page: "262", sequence: 2, extent: 2 }
    ],
  },
  {
    id: "gregobase:18051",
    incipit: "Qui te exspectant",
    gabc: "(c4) QUi(d) te(d) ex(c)spéc(f)tant,(g) Dó(f)mi(gh)ne,(h.) *(,) non(ge~) con(gh>)fun(fe>)dén(d.)tur.(d.) (::) E(h) u(h) o(g) u(f) a(gh) e.(gf..) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "38", sequence: 2, extent: 1 }
    ],
  },
  {
    id: "gregobase:18052",
    incipit: "Oculi mei",
    gabc: "(c4) O(e')cu(d)li(e) me(gh)i(h_') *(,) sem(h>)per(g) ad(f) Dó(g)mi(f)num.(e.) (::) <eu>E(h) u(g) o(h) u(ih) a(gf) e.</eu>(e.) (::)",
    office: "an",
    mode: "4",
    pages: [
    { page: "38", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:18054",
    incipit: "Expugna impugnantes",
    gabc: "(c4) EX(h)pú(h)gna(gf) * im(e)pu(f)gnán(g>)tes(f) me.(e.) (::) E(h) u(g) o(h) u(i) a(g) e.(h.) (::)",
    office: "an",
    mode: "4",
    pages: [
    { page: "88", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:18057",
    incipit: "Iubilate Deo",
    gabc: "(c4) IU(e)bi(f)lá(g)te(f) De(de)o,(e_') * om(e)nis(e_f) ter(d_f)ra.(e.) (::) E(g) u(g) o(h) u(f) a(g) e.(e.) (::)",
    office: "an",
    mode: "4",
    pages: [
    { page: "220", sequence: 1, extent: 1 }
    ],
  },
  {
    id: "gregobase:18058",
    incipit: "Visitavit et fecit",
    gabc: "(c3) VI(d)si(fh)tá(h)vit(hg) et(fe~) fe(h_0hi)cit(h) * re(i)demp(h>)ti(gh)ón(f)em(e) Dó(f)mi(e)nus(ed~) ple(e)bis(ef) su(d.)æ.(d.) (::) E(h) u(h) o(i) u(g) a(h) e.(f.) (::)",
    office: "an",
    mode: "5",
    pages: [
    { page: "230", sequence: 2, extent: 1 }
    ],
  },
  {
    id: "gregobase:18059",
    incipit: "Inclina cor meum",
    gabc: "(c4) IN(d)clí(d)na(f) cor(d_c_) me(f)um,(g) De(f_h)us,(h.) *(,) in(hg~) te(h)sti(g)mó(e_f)ni(g)a(fe) tu(d.)a.(d.) (::) E(h) u(h) o(g) u(f) a(gh) e.(gf..) (::)",
    office: "an",
    mode: "1",
    pages: [
    { page: "276", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:18060",
    incipit: "Sana Domine",
    gabc: "(f3) SA(h)na,(g') Dó(h)mi(g)ne,(f_') * á(h)ni(h)mam(g') me(h)am,(g.) (,) qui(f)a(e) pec(f)cá(h)vi(g) ti(f.)bi.(f.) (::) E(h) u(h) o(h) u(g) a(ef) e.(f.) (::)",
    office: "an",
    mode: "2",
    pages: [
    { page: "100", sequence: 0, extent: 1 }
    ],
  },
  {
    id: "gregobase:18061",
    incipit: "Adiutor in tribulationibus",
    gabc: "(c4) AD(h)iú(h)tor(g_') * in(g) tri(f)bu(g)la(h')ti(ixi)ó(g)ni(i)bus.(h.) (::) E(h) u(h) o(ixi) u(g) a(ixi) e.(h.) (::)",
    office: "an",
    mode: "e",
    pages: [
    { page: "118", sequence: 0, extent: 1 }
    ],
  }
];

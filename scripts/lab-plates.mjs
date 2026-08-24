// ---------------------------------------------------------------------------
// scripts/lab-plates — the render lab's plate battery
// ---------------------------------------------------------------------------
// One place for the rendering test cases. Consumed two ways:
//   • tests/render-lab.test.mjs — every plate must render without throwing
//     (the render-regression smoke that grows with each feature), and
//   • scripts/render-lab.mjs — writes working/review/svg-lab.html, the
//     visual gallery for eyeball review (npm run lab).
// Face: Junicode throughout (SIL OFL). Plates carry REFERENCES — the lab page
// embeds the variable font once, page-level, so every weight renders without
// bloating each SVG. Exactly one plate embeds for real (the feature proof).
// Keep plates deterministic; no Date.now, no randomness.

const KYRIE = "(c4) Ky(g)ri(h)e(g.) (,) e(h)le(ih)i(g)son.(f.) (::)";
export const JUNICODE = "Junicode";

/**
 * Build the plate list. `fonts.junicode` is an optional FontEmbed (base64
 * woff2) — when present, the EMBED plate carries the face inside its SVG;
 * when absent it falls back to a reference so the battery runs anywhere.
 */
export function buildPlates(tonus, fonts = {}) {
  const kyrie = () =>
    tonus.cantus({ gabc: KYRIE, incipit: "Kyrie", mode: 1, office: "ky" })[0];
  const adTeLevavi = () =>
    tonus.cantus({ incipit: "Ad te levavi", office: "in", source: "gr" })[0];
  // Reference slot — the lab page supplies the face (its page-level embed).
  const jr = (weight, scale) => ({ family: JUNICODE, weight, scale });
  // Embedding slot — the caller's bytes ride inside the SVG (one plate).
  const jw = (weight, scale) => ({
    family: JUNICODE, weight, scale,
    ...(fonts.junicode ? { embed: fonts.junicode } : {}),
  });
  // The house dress: Junicode on every role, lyrics a notch bolder. Black
  // rubrica while refining, so shape reads before colour — drop when settled.
  const JF = {
    fonts: { dropcap: jr(700), title: jr(620), annotation: jr(640), lyric: jr(560, 1.06) },
    colors: { rubrica: "#111" },
  };

  // ── The genus battery ──
  // One real chant per genus, both species, the house dress. This is the
  // breadth check the eye actually needs: a Kyrie exercises almost nothing, and
  // most rendering defects show up on melisma, on length, or on a genus whose
  // shape the layout did not anticipate.
  //
  // The FONT question is one plate, not eight. What a caller can vary — which
  // face per role, referenced or embedded — is documented and tested; it does
  // not need a visual matrix. What needs eyes is whether real chant looks right.
  const byId = (id) => () => tonus.cantus({ id })[0];
  const GENERA = [
    ["Responsory (the longest thing tonus renders)", "nocturnale:A1N1R1"],
    ["Tract — 29 phrases of it", "gregobase:437"],
    ["Hymn — strophic, many short phrases", "gregobase:8704"],
    ["Gradual — melismatic, mode 5", "gregobase:1373"],
    ["Offertory — with verses", "gregobase:15784"],
    ["Alleluia — the jubilus", "gregobase:797"],
    ["Communion — short and syllabic", "gregobase:397"],
  ];
  const genusPlates = GENERA.flatMap(([label, id]) => [
    {
      title: `${label} — quadrata`,
      note: "the house dress: Junicode by reference, the page supplies the face",
      render: () => tonus.inscriptio(tonus.notatio(byId(id)()), {
        width: 900, theme: JF,
      }),
    },
    {
      title: `${label} — moderna`,
      note: "same chant, same options, same staff span — only the notation differs",
      render: () => tonus.inscriptio(tonus.notatio(byId(id)()), {
        width: 900, notation: "moderna", theme: JF,
      }),
    },
  ]);

  // The one font plate that earns its place: proof that a self-contained SVG
  // works. Everything else on this page references the page-level face.
  const fontPlate = {
    title: "Fonts — the true embed (self-contained SVG)",
    note: "this plate's SVG carries Junicode INSIDE itself, so it renders correctly pasted anywhere. Every other plate names the face and lets the page supply it — which is what the docs site does, and why a score there costs no font bytes.",
    render: () => tonus.inscriptio(tonus.notatio(kyrie()), {
      title: "Kyrie", annotation: "auto", dropcap: true,
      theme: {
        fonts: { dropcap: jw(700), title: jw(620), annotation: jw(640), lyric: jw(560, 1.06) },
        colors: { rubrica: "#111" },
      },
    }),
  };

  return [
    ...genusPlates,
    fontPlate,
    {
      title: "Quadrata — baseline (Junicode)",
      note: "the square-note render, Junicode lyrics at weight 560",
      render: () => tonus.inscriptio(tonus.notatio(kyrie()), { theme: JF }),
    },
    {
      title: "Quadrata — front matter + dropcap",
      note: "cap owns the first system's margin; lyric carries the remainder",
      render: () => tonus.inscriptio(tonus.notatio(kyrie()), {
        title: "Kyrie", annotation: "auto", dropcap: true, theme: JF,
      }),
    },
    {
      title: "Moderna — baseline (Junicode)",
      note: "round-note transcription: treble-8, slurs, centred hyphens",
      render: () => tonus.inscriptio(tonus.notatio(kyrie()), { notation: "moderna", theme: JF }),
    },
    {
      title: "Moderna — transposed up a tone",
      note: "chromatics carry their sign; without it Ab and A share a slot unmarked",
      render: () => tonus.inscriptio(
        tonus.notatio(kyrie(), { temperamentum: { transpose: 2 } }),
        { notation: "moderna", theme: JF },
      ),
    },
    {
      title: "Moderna — transposed down a minor third",
      note: "the written octave floats so a low chant stays off the ledger lines",
      render: () => tonus.inscriptio(
        tonus.notatio(kyrie(), { temperamentum: { transpose: -3 } }),
        { notation: "moderna", theme: JF },
      ),
    },
    {
      title: "Moderna — transposed a full octave",
      note: "the lift absorbs it: same slots as the baseline, one clef throughout",
      render: () => tonus.inscriptio(
        tonus.notatio(kyrie(), { temperamentum: { transpose: 12 } }),
        { notation: "moderna", theme: JF },
      ),
    },
    {
      title: "Moderna — ledger lines",
      note: "a chant wider than the staff: one line per line passed, behind the head",
      render: () => {
        const [c] = tonus.cantus({
          gabc: "(c4) Am(a)bi(c)tus(e) lar(g)gus(i) est(k) hic.(m) (::)",
          incipit: "Ambitus largus", mode: 1,
        });
        return tonus.inscriptio(tonus.notatio(c), { notation: "moderna", theme: JF });
      },
    },
    {
      title: "Moderna — heji on a flatted chant",
      note: "b molle under Pythagorean: no arrows, no throw (chain regression)",
      render: () => {
        const [c] = tonus.cantus({ gabc: "(c3) A(gxg)b(h)c(i)d(gxg) (::)", incipit: "Flat test", mode: 2 });
        return tonus.inscriptio(tonus.notatio(c), { notation: "moderna", accidentals: "heji", theme: JF });
      },
    },
    {
      title: "Moderna — cents under meantone",
      note: "signed deviations against the chant's home intonation",
      render: () => {
        const [c] = tonus.cantus({ gabc: KYRIE, incipit: "Kyrie", mode: 1 });
        return tonus.inscriptio(
          tonus.notatio(c, { temperamentum: tonus.temperamentum({ tuning: "meantone" }) }),
          { notation: "moderna", accidentals: "cents", theme: JF },
        );
      },
    },
    {
      title: "Quadrata — figure zoo",
      note: "pes, clivis, torculus, porrectus (now with its left stem), scandicus, strophae, quilisma",
      render: () => {
        const gabc = "(c4) pes(fg) cli(hg) tor(ghf) por(hfg) scan(fgh) stro(hhh) quil(fwhg) (::)";
        const [c] = tonus.cantus({ gabc, incipit: "Figurae", mode: 1 });
        return tonus.inscriptio(tonus.notatio(c), { theme: JF });
      },
    },
    {
      title: "Quadrata — phrase boundary (grouping regression)",
      note: "a(f) (;) men(gf): both lyrics + both divisios must render",
      render: () => tonus.inscriptio(tonus.notatio(
        tonus.cantus({ gabc: "(c4) a(f) (;) men(gf) (::)", incipit: "Amen", mode: 1 })[0],
      ), { theme: JF }),
    },
    {
      title: "Quadrata — flat on a figure's upper note",
      note: "a(jix): the b rotundum prints before the figure (Solesmes)",
      render: () => tonus.inscriptio(tonus.notatio(
        tonus.cantus({ gabc: "(c4) a(jix) (::)", incipit: "Ficta", mode: 1 })[0],
      ), { theme: JF }),
    },
    {
      title: "Quadrata — lyric markup (℣, italics, rubric, ligatures)",
      note: "GABC text tags decoded: <sp>V/</sp> → ℣ (with its breath of space), <i>ij.</i> italic, Ps. normalized rubric, <sp>'ae</sp> → ǽ, \\greheightstar → *",
      render: () => tonus.inscriptio(tonus.notatio(tonus.cantus({
        gabc: "(c4) <sp>V/</sp>Ju(f)bi(g)lá(h)te(g) De(f)o(g.) (;) <i>ij.(fgh)</i> (;) o(f)mnis(g) ter(h)ra(g.) (,) <v>\\greheightstar</v>s<sp>'ae</sp>(f)cu(g)la(f.) (;) Ps.(f) Can(g)tá(h)te(g.) (::)",
        incipit: "Markup", mode: 1,
      })[0]), { theme: JF }),
    },
    {
      title: "Moderna — Ad te levavi (full piece)",
      note: "the Advent I introit complete: multi-system, hyphens, modern ♭",
      render: () => tonus.inscriptio(tonus.notatio(adTeLevavi()), {
        notation: "moderna", width: 960, title: "Ad te levavi", annotation: "auto",
        theme: JF,
      }),
    },
    {
      title: "Moderna — Ad te levavi under just intonation (heji)",
      note: "ptolemy-intense: syntonic comma arrows bloom on a real melody",
      render: () => {
        const score = tonus.notatio(adTeLevavi(), {
          temperamentum: tonus.temperamentum({ tuning: "ptolemy-intense" }),
        });
        return tonus.inscriptio(score, { notation: "moderna", width: 960, accidentals: "heji", theme: JF });
      },
    },
    {
      title: "Moderna — Ad te levavi under just intonation (cents)",
      note: "the same departure as floating cents — one label per pitch per phrase, above the staff",
      render: () => {
        const score = tonus.notatio(adTeLevavi(), {
          temperamentum: tonus.temperamentum({ tuning: "ptolemy-intense" }),
        });
        return tonus.inscriptio(score, { notation: "moderna", width: 960, accidentals: "cents", theme: JF });
      },
    },
    {
      title: "Quadrata — Ad te levavi (full dress)",
      note: "b rotundum, Junicode cap + lyrics, custos, multi-system",
      render: () => tonus.inscriptio(tonus.notatio(adTeLevavi()), {
        width: 960, title: "Ad te levavi", annotation: "auto",
        dropcap: true, theme: JF,
      }),
    },
  ];
}

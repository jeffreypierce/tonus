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
  // The house dress: Junicode on every role, lyrics a notch bolder.
  const JF = { dropcap: jr(700), title: jr(620), annotation: jr(640), lyric: jr(560, 1.06) };
  // Black-while-refining: overrides the library's liturgical red (dropcap,
  // annotation, rubric runs) so shape reads before color. Drop when settled.
  const INK = { rubricaColor: "#111" };

  return [
    {
      title: "Quadrata — baseline (Junicode)",
      note: "the square-note render, Junicode lyrics at weight 560",
      render: () => tonus.inscriptio(tonus.notatio(kyrie()), { fonts: JF, ...INK }),
    },
    {
      title: "Quadrata — front matter + dropcap",
      note: "cap owns the first system's margin; lyric carries the remainder",
      render: () => tonus.inscriptio(tonus.notatio(kyrie()), {
        title: "Kyrie", annotation: "auto", dropcap: true, fonts: JF, ...INK,
      }),
    },
    {
      title: "Quadrata — the true embed (self-contained SVG)",
      note: "this plate's SVG carries Junicode INSIDE itself (the embed feature proof); all other plates reference the page-level face",
      render: () => tonus.inscriptio(tonus.notatio(kyrie()), {
        title: "Kyrie", annotation: "auto", dropcap: true,
        fonts: { dropcap: jw(700), title: jw(620), annotation: jw(640), lyric: jw(560, 1.06) },
        ...INK,
      }),
    },
    {
      title: "Moderna — baseline (Junicode)",
      note: "round-note transcription: treble-8, slurs, centred hyphens",
      render: () => tonus.inscriptio(tonus.notatio(kyrie()), { notation: "moderna", fonts: JF, ...INK }),
    },
    {
      title: "Moderna — heji on a flatted chant",
      note: "b molle under Pythagorean: no arrows, no throw (chain regression)",
      render: () => {
        const [c] = tonus.cantus({ gabc: "(c3) A(gxg)b(h)c(i)d(gxg) (::)", incipit: "Flat test", mode: 2 });
        return tonus.inscriptio(tonus.notatio(c), { notation: "moderna", accidentals: "heji", fonts: JF, ...INK });
      },
    },
    {
      title: "Moderna — cents under meantone",
      note: "signed deviations against the chant's home intonation",
      render: () => {
        const [c] = tonus.cantus({ gabc: KYRIE, incipit: "Kyrie", mode: 1 });
        return tonus.inscriptio(
          tonus.notatio(c, { temperamentum: tonus.temperamentum({ tuning: "meantone" }) }),
          { notation: "moderna", accidentals: "cents", fonts: JF, ...INK },
        );
      },
    },
    {
      title: "Quadrata — figure zoo",
      note: "pes, clivis, torculus, porrectus (now with its left stem), scandicus, strophae, quilisma",
      render: () => {
        const gabc = "(c4) pes(fg) cli(hg) tor(ghf) por(hfg) scan(fgh) stro(hhh) quil(fwhg) (::)";
        const [c] = tonus.cantus({ gabc, incipit: "Figurae", mode: 1 });
        return tonus.inscriptio(tonus.notatio(c), { fonts: JF, ...INK });
      },
    },
    {
      title: "Quadrata — phrase boundary (grouping regression)",
      note: "a(f) (;) men(gf): both lyrics + both divisios must render",
      render: () => tonus.inscriptio(tonus.notatio(
        tonus.cantus({ gabc: "(c4) a(f) (;) men(gf) (::)", incipit: "Amen", mode: 1 })[0],
      ), { fonts: JF, ...INK }),
    },
    {
      title: "Quadrata — flat on a figure's upper note",
      note: "a(jix): the b rotundum prints before the figure (Solesmes)",
      render: () => tonus.inscriptio(tonus.notatio(
        tonus.cantus({ gabc: "(c4) a(jix) (::)", incipit: "Ficta", mode: 1 })[0],
      ), { fonts: JF, ...INK }),
    },
    {
      title: "Quadrata — lyric markup (℣, italics, rubric, ligatures)",
      note: "GABC text tags decoded: <sp>V/</sp> → ℣ (with its breath of space), <i>ij.</i> italic, Ps. normalized rubric, <sp>'ae</sp> → ǽ, \\greheightstar → *",
      render: () => tonus.inscriptio(tonus.notatio(tonus.cantus({
        gabc: "(c4) <sp>V/</sp>Ju(f)bi(g)lá(h)te(g) De(f)o(g.) (;) <i>ij.(fgh)</i> (;) o(f)mnis(g) ter(h)ra(g.) (,) <v>\\greheightstar</v>s<sp>'ae</sp>(f)cu(g)la(f.) (;) Ps.(f) Can(g)tá(h)te(g.) (::)",
        incipit: "Markup", mode: 1,
      })[0]), { fonts: JF, ...INK }),
    },
    {
      title: "Moderna — Ad te levavi (full piece)",
      note: "the Advent I introit complete: multi-system, hyphens, modern ♭",
      render: () => tonus.inscriptio(tonus.notatio(adTeLevavi()), {
        notation: "moderna", width: 960, title: "Ad te levavi", annotation: "auto",
        fonts: JF, ...INK,
      }),
    },
    {
      title: "Moderna — Ad te levavi under just intonation (heji)",
      note: "ptolemy-intense: syntonic comma arrows bloom on a real melody",
      render: () => {
        const score = tonus.notatio(adTeLevavi(), {
          temperamentum: tonus.temperamentum({ tuning: "ptolemy-intense" }),
        });
        return tonus.inscriptio(score, { notation: "moderna", width: 960, accidentals: "heji", fonts: JF, ...INK });
      },
    },
    {
      title: "Moderna — Ad te levavi under just intonation (cents)",
      note: "the same departure as floating cents — one label per pitch per phrase, above the staff",
      render: () => {
        const score = tonus.notatio(adTeLevavi(), {
          temperamentum: tonus.temperamentum({ tuning: "ptolemy-intense" }),
        });
        return tonus.inscriptio(score, { notation: "moderna", width: 960, accidentals: "cents", fonts: JF, ...INK });
      },
    },
    {
      title: "Quadrata — Ad te levavi (full dress)",
      note: "b rotundum, Junicode cap + lyrics, custos, multi-system",
      render: () => tonus.inscriptio(tonus.notatio(adTeLevavi()), {
        width: 960, custos: true, title: "Ad te levavi", annotation: "auto",
        dropcap: true, fonts: JF, ...INK,
      }),
    },
  ];
}

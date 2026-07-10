// ---------------------------------------------------------------------------
// scripts/lab-plates — the render lab's plate battery
// ---------------------------------------------------------------------------
// One place for the rendering test cases. Consumed two ways:
//   • tests/render-lab.test.mjs — every plate must render without throwing
//     (the render-regression smoke that grows with each feature), and
//   • scripts/render-lab.mjs — writes working/review/svg-lab.html, the
//     visual gallery for eyeball review (npm run lab).
// Faces: Crimson Pro (the house serif) and Junicode (SIL OFL — reference
// AND embeddable). Keep plates deterministic; no Date.now, no randomness.

const KYRIE = "(c4) Ky(g)ri(h)e(g.) (,) e(h)le(ih)i(g)son.(f.) (::)";
export const JUNICODE = "Junicode";

/**
 * Build the plate list. `fonts.junicode` is an optional FontEmbed (base64
 * woff2) — when present, the embed plates carry the face inside the SVG;
 * when absent they fall back to references so the battery runs anywhere.
 */
export function buildPlates(tonus, fonts = {}) {
  const kyrie = () =>
    tonus.cantus({ gabc: KYRIE, incipit: "Kyrie", mode: 1, office: "ky" })[0];
  const adTeLevavi = () =>
    tonus.cantus({ incipit: "Ad te levavi", office: "in", source: "gr" })[0];
  const jw = (weight, scale) => ({
    family: JUNICODE, weight, scale,
    ...(fonts.junicode ? { embed: fonts.junicode } : {}),
  });

  return [
    {
      title: "Quadrata — default",
      note: "the baseline square-note render, house serif throughout",
      render: () => tonus.inscriptio(tonus.notatio(kyrie())),
    },
    {
      title: "Quadrata — front matter + dropcap (house serif)",
      note: "cap owns the first system's margin; lyric carries the remainder",
      render: () => tonus.inscriptio(tonus.notatio(kyrie()), {
        title: "Kyrie", annotation: "auto", dropcap: true,
      }),
    },
    {
      title: "Quadrata — Junicode cap + title + lyrics",
      note: "the OFL medievalist face on every role; annotation stays serif",
      render: () => tonus.inscriptio(tonus.notatio(kyrie()), {
        title: "Kyrie", annotation: "auto", dropcap: true,
        fonts: { dropcap: jw(700), title: jw(500), lyric: jw(400, 1.08) },
      }),
    },
    {
      title: "Moderna — default",
      note: "round-note transcription: treble-8, slurs, centred hyphens",
      render: () => tonus.inscriptio(tonus.notatio(kyrie()), { notation: "moderna" }),
    },
    {
      title: "Moderna — Junicode lyrics",
      note: "the lyric slot crosses species",
      render: () => tonus.inscriptio(tonus.notatio(kyrie()), {
        notation: "moderna", fonts: { lyric: jw(400, 1.05) },
      }),
    },
    {
      title: "Moderna — heji on a flatted chant",
      note: "b molle under Pythagorean: no arrows, no throw (chain regression)",
      render: () => {
        const [c] = tonus.cantus({ gabc: "(c3) A(gxg)b(h)c(i)d(gxg) (::)", incipit: "Flat test", mode: 2 });
        return tonus.inscriptio(tonus.notatio(c), { notation: "moderna", accidentals: "heji" });
      },
    },
    {
      title: "Moderna — cents under meantone",
      note: "signed deviations against the chant's home intonation",
      render: () => {
        const [c] = tonus.cantus({ gabc: KYRIE, incipit: "Kyrie", mode: 1 });
        return tonus.inscriptio(
          tonus.notatio(c, { temperamentum: tonus.temperamentum({ tuning: "meantone" }) }),
          { notation: "moderna", accidentals: "cents" },
        );
      },
    },
    {
      title: "Quadrata — figure zoo",
      note: "pes, clivis, torculus, porrectus, scandicus, strophae, quilisma",
      render: () => {
        const gabc = "(c4) pes(fg) cli(hg) tor(ghf) por(hfg) scan(fgh) stro(hhh) quil(fwhg) (::)";
        const [c] = tonus.cantus({ gabc, incipit: "Figurae", mode: 1 });
        return tonus.inscriptio(tonus.notatio(c));
      },
    },
    {
      title: "Quadrata — phrase boundary (grouping regression)",
      note: "a(f) (;) men(gf): both lyrics + both divisios must render",
      render: () => tonus.inscriptio(tonus.notatio(
        tonus.cantus({ gabc: "(c4) a(f) (;) men(gf) (::)", incipit: "Amen", mode: 1 })[0],
      )),
    },
    {
      title: "Quadrata — flat on a figure's upper note",
      note: "a(jix): the b rotundum prints before the figure (Solesmes)",
      render: () => tonus.inscriptio(tonus.notatio(
        tonus.cantus({ gabc: "(c4) a(jix) (::)", incipit: "Ficta", mode: 1 })[0],
      )),
    },
    {
      title: "Moderna — Ad te levavi (full piece)",
      note: "the Advent I introit complete: multi-system, hyphens, modern ♭",
      render: () => tonus.inscriptio(tonus.notatio(adTeLevavi()), {
        notation: "moderna", width: 960, title: "Ad te levavi", annotation: "auto",
        fonts: { lyric: jw(400, 1.05) },
      }),
    },
    {
      title: "Moderna — Ad te levavi under just intonation (heji)",
      note: "ptolemy-intense: syntonic comma arrows bloom on a real melody",
      render: () => {
        const score = tonus.notatio(adTeLevavi(), {
          temperamentum: tonus.temperamentum({ tuning: "ptolemy-intense" }),
        });
        return tonus.inscriptio(score, { notation: "moderna", width: 960, accidentals: "heji" });
      },
    },
    {
      title: "Quadrata — Ad te levavi (full dress)",
      note: "b rotundum, Junicode cap + lyrics, custos, multi-system",
      render: () => tonus.inscriptio(tonus.notatio(adTeLevavi()), {
        width: 960, custos: true, title: "Ad te levavi", annotation: "auto",
        dropcap: true,
        fonts: { dropcap: jw(700), lyric: jw(400, 1.08) },
      }),
    },
  ];
}

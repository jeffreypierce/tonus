// ---------------------------------------------------------------------------
// scripts/stress-pieces — the stress battery: one real piece per genus
// ---------------------------------------------------------------------------
// Where lab-plates isolates FEATURES, this battery sweeps BREADTH: a real
// corpus chant from every genus, rendered full dress, plus a couple of
// moderna transcriptions. Consumed by scripts/render-stress.mjs (npm run
// stress → working/review/svg-stress.html) and tests/render-stress.test.mjs.
//
// Selection is deterministic: within a genus, prefer a substantial piece
// that carries lyric markup (the decode paths under real load), else the
// first substantial piece, else the first. No randomness, no dates.

export const JUNICODE = "Junicode";

const GENERA = [
  "Introitus", "Graduale", "Alleluia", "Tractus", "Offertorium", "Communio",
  "Antiphona", "Responsorium", "Hymnus", "Sequentia", "Canticum", "Psalmus",
];

function pick(candidates) {
  const meaty = (c) => c.gabc.length > 600;
  const marked = (c) => /<sp>|<i>|<v>/.test(c.gabc);
  return (
    candidates.find((c) => meaty(c) && marked(c)) ??
    candidates.find(meaty) ??
    candidates[0] ?? null
  );
}

export function buildStressPieces(tonus) {
  // One pool, several books: the Graduale for the Mass propers, the
  // Antiphonale and Liber for office forms, the Nocturnale for responsories.
  const pool = ["gr", "am", "nr", "lu"].flatMap((source) => {
    try { return tonus.cantus({ source }); } catch { return []; }
  });
  const byGenus = new Map();
  for (const c of pool) {
    if (!byGenus.has(c.genus)) byGenus.set(c.genus, []);
    byGenus.get(c.genus).push(c);
  }

  const jr = (weight, scale) => ({ family: JUNICODE, weight, scale });
  const JF = { dropcap: jr(700), title: jr(620), annotation: jr(640), lyric: jr(560, 1.06) };
  const DRESS = {
    width: 960, custos: true, annotation: "auto", dropcap: true,
    fonts: JF, rubricaColor: "#111",
  };

  const pieces = [];
  for (const genus of GENERA) {
    const chant = pick(byGenus.get(genus) ?? []);
    if (!chant) continue;
    pieces.push({
      title: `${genus} — ${chant.incipit}`,
      note: `${chant.source.book} · mode ${chant.mode || "—"} · ${chant.gabc.length} chars of GABC`,
      render: () => tonus.inscriptio(
        tonus.notatio(chant),
        { ...DRESS, title: chant.incipit },
      ),
    });
  }

  // A couple of moderna transcriptions on the same material — the second
  // species under the same load.
  for (const genus of ["Introitus", "Alleluia"]) {
    const chant = pick(byGenus.get(genus) ?? []);
    if (!chant) continue;
    pieces.push({
      title: `${genus} (moderna) — ${chant.incipit}`,
      note: `the same piece transcribed · ${chant.source.book}`,
      render: () => tonus.inscriptio(tonus.notatio(chant), {
        notation: "moderna", width: 960, title: chant.incipit,
        annotation: "auto", fonts: JF, rubricaColor: "#111",
      }),
    });
  }

  return pieces;
}

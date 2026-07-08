// temper/data/tones — psalm tones (Graduale Romanum appendix)
// Pitches as MIDI numbers; tone codes follow DO convention: "1g", "6F", "4e".
// c4 clef reference: f=53 g=55 h=57 i=59 j=60 k=62 l=64 (F3–F4)

export interface Differentia {
  code: string;
  termination: number[];
}

export interface PsalmTone {
  mode: number; // 1–8; 0 = Tonus Peregrinus
  name: string;
  tenor: number;
  intonation: number[];
  flex: number[];
  mediant: number[];
  solemnMediant?: number[]; // ornamented mediant for solemn occasions (Suñol)
  defaultDiff: string;
  differentiae: Differentia[];
}

const f = 53, g = 55, h = 57, i = 59, j = 60, k = 62, l = 64;
const d3 = 50, e3 = 52; // below c4 clef range, needed for Tone II

export const TONES: PsalmTone[] = [
  {
    mode: 1,
    name: "Tonus I",
    tenor: h,                     // A3
    intonation: [f, h, j],        // F-A-C
    flex: [h, g],                 // A-G
    mediant: [j, h, g, h],        // C-A-G-A
    defaultDiff: "1g",
    differentiae: [
      { code: "1g",  termination: [j, h, g, h, g] },   // standard
      { code: "1g2", termination: [j, h, j, h, g] },   // alt
      { code: "1f",  termination: [j, i, h, f] },
      { code: "1D",  termination: [h, g, f, f] },      // ending D
      { code: "1a",  termination: [j, k, j, h] },      // high ending
    ],
  },

  {
    mode: 2,
    name: "Tonus II",
    tenor: f,                     // F3
    intonation: [d3, f],          // D3-F3
    flex: [f, e3],                // F-E
    mediant: [g, f, e3, f],       // G-F-E-F
    defaultDiff: "2D",
    differentiae: [
      { code: "2D",  termination: [g, f, e3, d3] },    // ending D
      { code: "2d",  termination: [g, f, e3, d3] },    // same
      { code: "2e",  termination: [g, f, g, e3] },
      { code: "2f",  termination: [g, f, f] },
    ],
  },

  {
    mode: 3,
    name: "Tonus III",
    tenor: i,                     // B3
    intonation: [g, i, j],        // G-B-C
    flex: [i, h],                 // B-A
    mediant: [k, i, j, i],        // D-B-C-B
    defaultDiff: "3b",
    differentiae: [
      { code: "3b",  termination: [j, i, h, i] },
      { code: "3a",  termination: [k, j, i, h, i] },
      { code: "3g",  termination: [j, i, h, g] },
    ],
  },

  {
    mode: 4,
    name: "Tonus IV",
    tenor: h,                     // A3
    intonation: [f, g, h],        // F-G-A
    flex: [h, f],                 // A-F
    mediant: [j, i, h],           // C-B-A
    defaultDiff: "4e",
    differentiae: [
      { code: "4e",  termination: [h, g, h, f, e3] },  // ending E (standard)
      { code: "4g",  termination: [h, g, f, g] },
      { code: "4A",  termination: [h, i, h, f] },
      { code: "4a",  termination: [i, h, g, h] },
    ],
  },

  {
    mode: 5,
    name: "Tonus V",
    tenor: j,                     // C4
    intonation: [h, j],           // A-C
    flex: [j, i],                 // C-B
    mediant: [l, k, j],           // E-D-C
    defaultDiff: "5a",
    differentiae: [
      { code: "5a",  termination: [l, k, j, j] },      // ending F
      { code: "5f",  termination: [k, j, i, j] },
      { code: "5F",  termination: [k, j, h, j] },
    ],
  },

  {
    mode: 6,
    name: "Tonus VI",
    tenor: f,                     // F3
    intonation: [d3, e3, f],      // D-E-F
    flex: [f, e3],                // F-E
    mediant: [g, f, e3, f],       // G-F-E-F
    defaultDiff: "6F",
    differentiae: [
      { code: "6F",  termination: [g, h, g, f] },      // standard ending F
      { code: "6f",  termination: [g, f, e3, f] },
      { code: "6g",  termination: [g, f, g] },
    ],
  },

  {
    mode: 7,
    name: "Tonus VII",
    tenor: j,                     // C4
    intonation: [h, i, j],        // A-B-C
    flex: [j, i],                 // C-B
    mediant: [k, j, i, j],        // D-C-B-C
    defaultDiff: "7a",
    differentiae: [
      { code: "7a",  termination: [k, j, i, j] },      // ending G-area
      { code: "7c",  termination: [l, k, j, k, j] },
      { code: "7b",  termination: [l, k, i, j] },
      { code: "7d",  termination: [k, j, h, j] },
    ],
  },

  {
    mode: 8,
    name: "Tonus VIII",
    tenor: j,                     // C4
    intonation: [h, j],           // A-C
    flex: [j, h],                 // C-A
    mediant: [k, j],              // D-C
    defaultDiff: "8G",
    differentiae: [
      { code: "8G",  termination: [k, j, h, j] },      // standard ending G
      { code: "8g",  termination: [k, j, i, j] },
      { code: "8c",  termination: [l, k, j, i, j] },
      { code: "8G2", termination: [k, j, h, g, j] },
    ],
  },

  // ── Tonus Peregrinus ── irregular: two different tenors
  {
    mode: 0,
    name: "Tonus Peregrinus",
    tenor: j,                     // C4 (first half tenor)
    intonation: [h, i, j],        // A-B-C
    flex: [j, i],
    mediant: [k, i, h, j],        // D-B-A-C (descends to A then rises)
    defaultDiff: "per",
    differentiae: [
      { code: "per", termination: [i, h, g, h] },      // second half on A
    ],
  },
];

/** Look up a PsalmTone by mode number (1–8, or 0 for Peregrinus) */
export function getTone(mode: number): PsalmTone {
  return TONES.find(t => t.mode === mode) ?? TONES.find(t => t.mode === 8)!;
}

/** Look up a differentia by code, falling back to the tone's defaultDiff */
export function getDifferentia(tone: PsalmTone, code?: string): Differentia {
  if (code) {
    const d = tone.differentiae.find(d => d.code === code);
    if (d) return d;
  }
  return tone.differentiae.find(d => d.code === tone.defaultDiff)
    ?? tone.differentiae[0];
}

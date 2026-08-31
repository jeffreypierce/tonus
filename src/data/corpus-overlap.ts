// corpus-overlap.ts — pre-dedup chant-count relationships between the books
// Extracted from GregoBase (chant-id sets) by scripts/extract-gregobase.mjs
// Generated: 2026-08-31T18:07:52.806Z
//
// tonus stores one copy of each chant (LU primary; LA/LH gap-fill), so a book's
// stored count is less than what it holds. This records, per book: its full
// pre-dedup `total`, how many chants it alone has (`unique`), and how many it
// shares with each other book (`shared`, by GregoBase chant id).

export interface CorpusOverlap {
  total: number;
  unique: number;
  shared: Record<string, number>;
}

export const CORPUS_OVERLAP: Record<string, CorpusOverlap> = {
  "gr": {
    "total": 1378,
    "unique": 430,
    "shared": {
      "lu": 948,
      "la": 6
    }
  },
  "lu": {
    "total": 2457,
    "unique": 434,
    "shared": {
      "gr": 948,
      "la": 1079,
      "am": 5
    }
  },
  "la": {
    "total": 2534,
    "unique": 1453,
    "shared": {
      "lu": 1079,
      "gr": 6,
      "am": 5
    }
  },
  "lh": {
    "total": 362,
    "unique": 360,
    "shared": {
      "am": 2
    }
  },
  "am": {
    "total": 1456,
    "unique": 1447,
    "shared": {
      "lu": 5,
      "la": 5,
      "lh": 2
    }
  },
  "psm": {
    "total": 60,
    "unique": 60,
    "shared": {}
  },
  "nr": {
    "total": 1564,
    "unique": 1564,
    "shared": {}
  }
};

/**
 * What each book HOLDS, before the keep set — the ledger of the cut.
 *
 * `corpus(code)` reports what tonus kept; this reports what was there to keep,
 * in the same genera/modes shape, so every omission is visible rather than
 * merely implied by a smaller number. Only the extractor can measure this: it
 * is the one place that reads the un-cut book.
 *
 * Books outside GregoBase (nr, ky) have no entry — the same "unmeasured, not
 * zero" rule the overlap follows.
 */
export interface CorpusFull {
  total: number;
  genera: Record<string, number>;
  modes: Record<string, number>;
}

export const CORPUS_FULL: Record<string, CorpusFull> = {
  "gr": {
    "total": 1378,
    "genera": {
      "al": 297,
      "in": 244,
      "of": 191,
      "co": 245,
      "gr": 188,
      "tr": 86,
      "re": 8,
      "an": 45,
      "hy": 19,
      "ps": 13,
      "se": 5,
      "su": 2,
      "ca": 4,
      "im": 5,
      "or": 21,
      "tp": 5
    },
    "modes": {
      "1": 263,
      "2": 205,
      "3": 145,
      "4": 139,
      "5": 156,
      "6": 75,
      "7": 128,
      "8": 237,
      "other": 30
    }
  },
  "lu": {
    "total": 2457,
    "genera": {
      "al": 188,
      "in": 169,
      "co": 173,
      "tr": 42,
      "gr": 134,
      "re": 73,
      "of": 142,
      "an": 1147,
      "hy": 153,
      "ps": 21,
      "se": 6,
      "su": 15,
      "or": 47,
      "rb": 134,
      "ca": 6,
      "im": 7
    },
    "modes": {
      "1": 491,
      "2": 254,
      "3": 205,
      "4": 230,
      "5": 156,
      "6": 121,
      "7": 261,
      "8": 540,
      "other": 199
    }
  },
  "la": {
    "total": 2534,
    "genera": {
      "or": 19,
      "rb": 220,
      "an": 2058,
      "hy": 232,
      "re": 5
    },
    "modes": {
      "1": 608,
      "2": 182,
      "3": 186,
      "4": 262,
      "5": 81,
      "6": 106,
      "7": 307,
      "8": 674,
      "other": 128
    }
  },
  "lh": {
    "total": 362,
    "genera": {
      "hy": 308,
      "an": 35,
      "ps": 13,
      "re": 6
    },
    "modes": {
      "1": 55,
      "2": 58,
      "3": 23,
      "4": 99,
      "5": 4,
      "6": 10,
      "7": 8,
      "8": 75,
      "other": 30
    }
  },
  "am": {
    "total": 1456,
    "genera": {
      "an": 1049,
      "hy": 246,
      "rb": 119,
      "re": 20,
      "or": 18,
      "ps": 2,
      "ca": 1,
      "su": 1
    },
    "modes": {
      "1": 321,
      "2": 125,
      "3": 81,
      "4": 146,
      "5": 30,
      "6": 151,
      "7": 166,
      "8": 373,
      "other": 63
    }
  },
  "psm": {
    "total": 60,
    "genera": {
      "an": 58,
      "rb": 2
    },
    "modes": {
      "1": 12,
      "2": 5,
      "3": 3,
      "4": 7,
      "5": 1,
      "6": 2,
      "7": 4,
      "8": 14,
      "other": 12
    }
  },
  "nr": {
    "total": 1564,
    "genera": {
      "an": 546,
      "re": 812,
      "hy": 78,
      "in": 84,
      "ps": 17,
      "or": 27
    },
    "modes": {
      "1": 262,
      "2": 177,
      "3": 127,
      "4": 183,
      "5": 90,
      "6": 110,
      "7": 246,
      "8": 342,
      "other": 27
    }
  }
};

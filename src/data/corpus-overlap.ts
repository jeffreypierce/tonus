// corpus-overlap.ts — pre-dedup chant-count relationships between the books
// Extracted from GregoBase (chant-id sets) by scripts/extract-gregobase.mjs
// Generated: 2026-07-28T17:55:27.238Z
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
      "cot": 21,
      "la": 6,
      "cse": 3
    }
  },
  "lu": {
    "total": 2457,
    "unique": 418,
    "shared": {
      "gr": 948,
      "cot": 43,
      "la": 1079,
      "cse": 15,
      "am": 5
    }
  },
  "la": {
    "total": 2534,
    "unique": 1452,
    "shared": {
      "lu": 1079,
      "gr": 6,
      "cot": 11,
      "cse": 6,
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
    "unique": 1401,
    "shared": {
      "lu": 5,
      "cot": 3,
      "la": 5,
      "cse": 19,
      "ams": 27,
      "lh": 2
    }
  },
  "ams": {
    "total": 99,
    "unique": 70,
    "shared": {
      "cse": 2,
      "am": 27
    }
  },
  "psm": {
    "total": 60,
    "unique": 60,
    "shared": {}
  },
  "cse": {
    "total": 188,
    "unique": 149,
    "shared": {
      "lu": 15,
      "cot": 6,
      "la": 6,
      "gr": 3,
      "am": 19,
      "ams": 2
    }
  },
  "cot": {
    "total": 58,
    "unique": 13,
    "shared": {
      "gr": 21,
      "lu": 43,
      "la": 11,
      "cse": 6,
      "am": 3
    }
  }
};

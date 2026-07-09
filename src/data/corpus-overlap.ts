// corpus-overlap.ts — pre-dedup chant-count relationships between the books
// Extracted from GregoBase (chant-id sets) by scripts/extract-gregobase.mjs
// Generated: 2026-07-09T13:15:09.840Z
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
  }
};

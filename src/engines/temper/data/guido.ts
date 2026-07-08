// ---------------------------------------------------------------------------
// engines/temper/data/guido — Guidonian gamut and hexachord variants
// ---------------------------------------------------------------------------
import type { Finger, Region } from "../step.js";

export interface GuidonianVariant {
  hexachord: "durum" | "naturale" | "molle";
  solmization: "UT" | "RE" | "MI" | "FA" | "SOL" | "LA";
}

export interface GuidonianEntry {
  hand: { finger: Finger; region: Region };
  name: [string, string]; // [short, compound] e.g. ["d", "Desolre"]
  variants: GuidonianVariant[];
}

// The hand loci follow the CANONICAL Guidonian spiral, not a linear fill:
// begin at the thumb tip, come down the thumb, cross the finger BASES
// index→little, climb the little finger, return across the finger TIPS
// little→index, descend the index, then spiral inward; ee (76) floats above the
// middle fingertip (region "super"). The two b/♮ pairs (58/59, 70/71) share a
// locus by design — one joint, two readings (fa in molle, mi in durum), the
// tradition, not a duplication to fix. After Suñol [biblio: sunol-textbook] and
// Apel [biblio: apel-chant]; realized in working/diagram-hand-08.html.
// prettier-ignore
export const GUIDONIAN_DATA = new Map<number, GuidonianEntry>([
  [43, { hand: { finger: "thumb",  region: "tip"   }, name: ["Γ",  "Gammaut"   ], variants: [{ hexachord: "durum",    solmization: "UT"  }] }],
  [45, { hand: { finger: "thumb",  region: "mid"   }, name: ["A",  "Are"       ], variants: [{ hexachord: "durum",    solmization: "RE"  }] }],
  [47, { hand: { finger: "thumb",  region: "base"  }, name: ["B",  "Bemi"      ], variants: [{ hexachord: "durum",    solmization: "MI"  }] }],
  [48, { hand: { finger: "index",  region: "base"  }, name: ["C",  "Cefaut"    ], variants: [{ hexachord: "durum",    solmization: "FA"  }, { hexachord: "naturale", solmization: "UT"  }] }],
  [50, { hand: { finger: "middle", region: "base"  }, name: ["D",  "Desolre"   ], variants: [{ hexachord: "durum",    solmization: "SOL" }, { hexachord: "naturale", solmization: "RE"  }] }],
  [52, { hand: { finger: "ring",   region: "base"  }, name: ["E",  "Elami"     ], variants: [{ hexachord: "durum",    solmization: "LA"  }, { hexachord: "naturale", solmization: "MI"  }] }],
  [53, { hand: { finger: "pinky",  region: "base"  }, name: ["F",  "Fefaut"    ], variants: [{ hexachord: "naturale", solmization: "FA"  }, { hexachord: "molle",    solmization: "UT"  }] }],
  [55, { hand: { finger: "pinky",  region: "mid"   }, name: ["G",  "Gesolreut" ], variants: [{ hexachord: "durum",    solmization: "UT"  }, { hexachord: "naturale", solmization: "SOL" }, { hexachord: "molle", solmization: "RE" }] }],
  [57, { hand: { finger: "pinky",  region: "top"   }, name: ["a",  "Alamire"   ], variants: [{ hexachord: "durum",    solmization: "RE"  }, { hexachord: "naturale", solmization: "LA"  }, { hexachord: "molle", solmization: "MI" }] }],
  [58, { hand: { finger: "pinky",  region: "tip"   }, name: ["b",  "Befa"      ], variants: [{ hexachord: "molle",    solmization: "FA"  }] }],
  [59, { hand: { finger: "pinky",  region: "tip"   }, name: ["♮",  "Bemi"      ], variants: [{ hexachord: "durum",    solmization: "MI"  }] }],
  [60, { hand: { finger: "ring",   region: "tip"   }, name: ["c",  "Cesolfaut" ], variants: [{ hexachord: "durum",    solmization: "FA"  }, { hexachord: "naturale", solmization: "UT"  }, { hexachord: "molle", solmization: "SOL" }] }],
  [62, { hand: { finger: "middle", region: "tip"   }, name: ["d",  "Delasolre" ], variants: [{ hexachord: "durum",    solmization: "SOL" }, { hexachord: "naturale", solmization: "RE"  }, { hexachord: "molle", solmization: "LA" }] }],
  [64, { hand: { finger: "index",  region: "tip"   }, name: ["e",  "Elami"     ], variants: [{ hexachord: "durum",    solmization: "LA"  }, { hexachord: "naturale", solmization: "MI"  }] }],
  [65, { hand: { finger: "index",  region: "top"   }, name: ["f",  "Fefaut"    ], variants: [{ hexachord: "naturale", solmization: "FA"  }, { hexachord: "molle",    solmization: "UT"  }] }],
  [67, { hand: { finger: "index",  region: "mid"   }, name: ["g",  "Gesolreut" ], variants: [{ hexachord: "durum",    solmization: "UT"  }, { hexachord: "naturale", solmization: "SOL" }, { hexachord: "molle", solmization: "RE" }] }],
  [69, { hand: { finger: "middle", region: "mid"   }, name: ["aa", "Alamire"   ], variants: [{ hexachord: "durum",    solmization: "RE"  }, { hexachord: "naturale", solmization: "LA"  }, { hexachord: "molle", solmization: "MI" }] }],
  [70, { hand: { finger: "ring",   region: "mid"   }, name: ["bb", "Befa"      ], variants: [{ hexachord: "molle",    solmization: "FA"  }] }],
  [71, { hand: { finger: "ring",   region: "mid"   }, name: ["♮♮", "Bemi"      ], variants: [{ hexachord: "durum",    solmization: "MI"  }] }],
  [72, { hand: { finger: "middle", region: "top"   }, name: ["cc", "Cesolfa"   ], variants: [{ hexachord: "durum",    solmization: "FA"  }, { hexachord: "naturale", solmization: "UT"  }, { hexachord: "molle", solmization: "SOL" }] }],
  [74, { hand: { finger: "ring",   region: "top"   }, name: ["dd", "Delasol"   ], variants: [{ hexachord: "durum",    solmization: "SOL" }, { hexachord: "naturale", solmization: "RE"  }, { hexachord: "molle", solmization: "LA" }] }],
  [76, { hand: { finger: "middle", region: "super" }, name: ["ee", "Ela"       ], variants: [{ hexachord: "durum",    solmization: "LA"  }, { hexachord: "naturale", solmization: "MI"  }] }],
]);

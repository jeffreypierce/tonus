// ---------------------------------------------------------------------------
// engines/temper/data/guido — Guidonian gamut and hexachord variants
// ---------------------------------------------------------------------------

export interface GuidonianVariant {
  hexachord: "durum" | "naturale" | "molle";
  solmization: "UT" | "RE" | "MI" | "FA" | "SOL" | "LA";
}

export interface GuidonianEntry {
  hand: { finger: string; region: string };
  name: [string, string]; // [short, compound] e.g. ["d", "Desolre"]
  variants: GuidonianVariant[];
}

// prettier-ignore
export const GUIDONIAN_DATA = new Map<number, GuidonianEntry>([
  [43, { hand: { finger: "base",   region: "palm"   }, name: ["Γ",  "Gammaut"   ], variants: [{ hexachord: "durum",    solmization: "UT"  }] }],
  [45, { hand: { finger: "wrist",  region: "center" }, name: ["A",  "Are"       ], variants: [{ hexachord: "durum",    solmization: "RE"  }] }],
  [47, { hand: { finger: "wrist",  region: "inner"  }, name: ["B",  "Bemi"      ], variants: [{ hexachord: "durum",    solmization: "MI"  }] }],
  [48, { hand: { finger: "palm",   region: "base"   }, name: ["C",  "Cefaut"    ], variants: [{ hexachord: "durum",    solmization: "FA"  }, { hexachord: "naturale", solmization: "UT"  }] }],
  [50, { hand: { finger: "palm",   region: "middle" }, name: ["D",  "Desolre"   ], variants: [{ hexachord: "durum",    solmization: "SOL" }, { hexachord: "naturale", solmization: "RE"  }] }],
  [52, { hand: { finger: "palm",   region: "top"    }, name: ["E",  "Elami"     ], variants: [{ hexachord: "durum",    solmization: "LA"  }, { hexachord: "naturale", solmization: "MI"  }] }],
  [53, { hand: { finger: "thumb",  region: "base"   }, name: ["F",  "Fefaut"    ], variants: [{ hexachord: "naturale", solmization: "FA"  }, { hexachord: "molle",    solmization: "UT"  }] }],
  [55, { hand: { finger: "thumb",  region: "mid"    }, name: ["G",  "Gesolreut" ], variants: [{ hexachord: "durum",    solmization: "UT"  }, { hexachord: "naturale", solmization: "SOL" }, { hexachord: "molle", solmization: "RE" }] }],
  [57, { hand: { finger: "thumb",  region: "tip"    }, name: ["a",  "Alamire"   ], variants: [{ hexachord: "durum",    solmization: "RE"  }, { hexachord: "naturale", solmization: "LA"  }, { hexachord: "molle", solmization: "MI" }] }],
  [58, { hand: { finger: "index",  region: "base"   }, name: ["b",  "Befa"      ], variants: [{ hexachord: "molle",    solmization: "FA"  }] }],
  [59, { hand: { finger: "index",  region: "mid"    }, name: ["h",  "Bemi"      ], variants: [{ hexachord: "durum",    solmization: "MI"  }] }],
  [60, { hand: { finger: "index",  region: "tip"    }, name: ["c",  "Cesolfaut" ], variants: [{ hexachord: "durum",    solmization: "FA"  }, { hexachord: "naturale", solmization: "UT"  }, { hexachord: "molle", solmization: "SOL" }] }],
  [62, { hand: { finger: "middle", region: "base"   }, name: ["d",  "Delasolre" ], variants: [{ hexachord: "durum",    solmization: "SOL" }, { hexachord: "naturale", solmization: "RE"  }, { hexachord: "molle", solmization: "LA" }] }],
  [64, { hand: { finger: "middle", region: "mid"    }, name: ["e",  "Elami"     ], variants: [{ hexachord: "durum",    solmization: "LA"  }, { hexachord: "naturale", solmization: "MI"  }] }],
  [65, { hand: { finger: "middle", region: "tip"    }, name: ["f",  "Fefaut"    ], variants: [{ hexachord: "naturale", solmization: "FA"  }, { hexachord: "molle",    solmization: "UT"  }] }],
  [67, { hand: { finger: "ring",   region: "base"   }, name: ["g",  "Gesolreut" ], variants: [{ hexachord: "durum",    solmization: "UT"  }, { hexachord: "naturale", solmization: "SOL" }, { hexachord: "molle", solmization: "RE" }] }],
  [69, { hand: { finger: "ring",   region: "mid"    }, name: ["aa", "Alamire"   ], variants: [{ hexachord: "durum",    solmization: "RE"  }, { hexachord: "naturale", solmization: "LA"  }, { hexachord: "molle", solmization: "MI" }] }],
  [70, { hand: { finger: "ring",   region: "tip"    }, name: ["bb", "Befa"      ], variants: [{ hexachord: "molle",    solmization: "FA"  }] }],
  [71, { hand: { finger: "pinky",  region: "base"   }, name: ["hh", "Bemi"      ], variants: [{ hexachord: "durum",    solmization: "MI"  }] }],
  [72, { hand: { finger: "pinky",  region: "mid"    }, name: ["cc", "Cesolfa"   ], variants: [{ hexachord: "durum",    solmization: "FA"  }, { hexachord: "naturale", solmization: "UT"  }, { hexachord: "molle", solmization: "SOL" }] }],
  [74, { hand: { finger: "pinky",  region: "top"    }, name: ["dd", "Delasol"   ], variants: [{ hexachord: "durum",    solmization: "SOL" }, { hexachord: "naturale", solmization: "RE"  }, { hexachord: "molle", solmization: "LA" }] }],
  [76, { hand: { finger: "pinky",  region: "tip"    }, name: ["ee", "Ela"       ], variants: [{ hexachord: "durum",    solmization: "LA"  }, { hexachord: "naturale", solmization: "MI"  }] }],
]);

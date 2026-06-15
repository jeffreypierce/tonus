// ---------------------------------------------------------------------------
// engines/harmonia/data/vowels — seven Greek planetary vowels
// ---------------------------------------------------------------------------
// Mapping of the seven classical planetary bodies to Greek vowels. The
// association is attested across late-antique magical and Pythagorean sources:
// Porphyry, Marcus Gnosticus, Demetrius of Phaleron, Nicomachus of Gerasa,
// Eusebius of Caesarea, Barthélemy of Edessa.
//
// Source: Godwin, J. *The Mystery of the Seven Vowels*. Phanes Press, 1991.
// The order Moon→Saturn → α ε η ι ο υ ω is Nicomachus's (Excerpta ex
// Nicomacho 6), matching the ascent from nearest to farthest sphere.

export interface PlanetVowel {
  greek: string;
  greekLower: string;
  name: string;
  modern: string;
  phonetic: "a" | "e" | "i" | "o" | "u";
  ipa: string;
}

export const PLANET_VOWELS: Readonly<Record<string, PlanetVowel>> = {
  Moon:    { greek: "Α", greekLower: "α", name: "Alpha",   modern: "A",  phonetic: "a", ipa: "a" },
  Mercury: { greek: "Ε", greekLower: "ε", name: "Epsilon", modern: "E",  phonetic: "e", ipa: "e" },
  Venus:   { greek: "Η", greekLower: "η", name: "Eta",     modern: "Ē",  phonetic: "e", ipa: "ɛː" },
  Sun:     { greek: "Ι", greekLower: "ι", name: "Iota",    modern: "I",  phonetic: "i", ipa: "i" },
  Mars:    { greek: "Ο", greekLower: "ο", name: "Omicron", modern: "O",  phonetic: "o", ipa: "o" },
  Jupiter: { greek: "Υ", greekLower: "υ", name: "Upsilon", modern: "Y",  phonetic: "u", ipa: "y" },
  Saturn:  { greek: "Ω", greekLower: "ω", name: "Omega",   modern: "Ō",  phonetic: "o", ipa: "ɔː" },
};

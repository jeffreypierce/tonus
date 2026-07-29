// ---------------------------------------------------------------------------
// engines/chant/syllabify — Latin syllabification (ecclesiastical rules)
// ---------------------------------------------------------------------------
//
// Rules applied (in order):
//   1. Diphthongs ae, oe, au → single vowel unit (never split). ei and ui are
//      NOT diphthongs in ecclesiastical Latin (De-i, e-le-i-son, fu-it, su-i)
//      — except the pronoun stems cui/hui (cui, huic), where ui is true.
//      eu is NOT a diphthong either (de-us, me-us split normally).
//   2. qu → single consonant (u is silent after q); likewise the ngu glide
//      (lin-gua, sán-guis) — but not gu elsewhere (e-xi-gu-us, ar-gu-it).
//   3. i between vowels, or word-initial before a vowel, is consonantal (the
//      j sound): e-ius, ma-ior, al-le-lu-ia, Ie-su — it opens the next
//      syllable rather than closing this one.
//   4. All other adjacent vowels split (ecclesiastical): fi-li-a, glo-ri-a
//   5. Single consonant between vowels → goes with following vowel (V·CV)
//   6. Consonant clusters: muta cum liquida (tr, pr, br, gr, dr, cr, fr, pl, bl,
//      cl, gl, fl) and the Greek digraphs th, ph, ch stay with the following
//      vowel; all other clusters split after the first consonant
//
// Diacritics (áéíóúàèìòùâêîôû etc.) are treated as their base vowel throughout.

// ── Character classes ──

const VOWELS = new Set("aeiouyáéíóúàèìòùâêîôûäëïöüæœý");
const SOFT_HYPHEN = "\u00ad";

// Latin diphthongs treated as single syllables. ei and ui are deliberately
// absent: in ecclesiastical Latin they are hiatus (De-i, fu-it, su-i) — ui is
// a true diphthong only in the pronoun stems cui/hui, handled below. eu is not
// a classical Latin diphthong (de-us, me-us split normally).
const DIPHTHONGS = new Set(["ae", "oe", "au"]);

// Muta cum liquida pairs that stay with the following vowel
const MUTA_CUM_LIQUIDA = new Set([
  "tr",
  "dr",
  "pr",
  "br",
  "cr",
  "gr",
  "fr",
  "pl",
  "bl",
  "cl",
  "gl",
  "fl",
  "th",
  "ph",
  "ch",
]);

// Strip diacritics for rule matching, keep original for output
function baseChar(ch: string): string {
  return ch
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isVowelBase(ch: string): boolean {
  return VOWELS.has(baseChar(ch));
}

function isConsonantBase(ch: string): boolean {
  const b = baseChar(ch);
  return /[a-z]/.test(b) && !VOWELS.has(b);
}

// ── Core syllabifier ──

/**
 * Split a single Latin word into syllables.
 * e.g. "Dóminus" → ["Dó", "mi", "nus"]
 *      "glória"  → ["gló", "ri", "a"]
 *      "ánima"   → ["á", "ni", "ma"]
 */
export function syllabifyWord(word: string): string[] {
  if (word.length <= 1) return [word];

  const chars = Array.from(word);
  const n = chars.length;
  const lower = chars.map(baseChar).join("");

  // A glide u carries no syllable: after q always (qui), and in the ngu
  // cluster before a vowel (lin-gua, sán-guis) — but a u after plain g is a
  // real vowel (e-xi-gu-us, ar-gu-it).
  const isGlideU = (i: number): boolean => {
    if (baseChar(chars[i]) !== "u") return false;
    const prev = i > 0 ? baseChar(chars[i - 1]) : "";
    if (prev === "q") return true;
    const prev2 = i > 1 ? baseChar(chars[i - 2]) : "";
    return prev === "g" && prev2 === "n" && i + 1 < n && isVowelBase(chars[i + 1]);
  };

  // A consonantal i (the j sound) carries no syllable of its own — it opens
  // the following vowel's: between real vowels (e-ius, ma-ior, al-le-lu-ia)
  // or word-initial before a vowel (Ie-su, iu-bi-lá-te).
  const isConsonantalI = (i: number): boolean => {
    if (baseChar(chars[i]) !== "i") return false;
    if (i + 1 >= n || !isVowelBase(chars[i + 1])) return false;
    if (i === 0) return true;
    return isVowelBase(chars[i - 1]) && !isGlideU(i - 1);
  };

  // Find all vowel positions (base-char aware; glides and consonantal i out).
  const vpos: number[] = [];
  for (let i = 0; i < n; i++) {
    if (isVowelBase(chars[i])) {
      if (isGlideU(i) || isConsonantalI(i)) continue;
      vpos.push(i);
    }
  }

  if (vpos.length <= 1) return [word]; // monosyllable

  // Build a set of positions where we insert a split (before this index)
  const splits = new Set<number>();

  for (let vi = 0; vi < vpos.length - 1; vi++) {
    const v1 = vpos[vi];
    const v2 = vpos[vi + 1];

    // Adjacent vowels (no consonants between them)
    if (v2 === v1 + 1) {
      const pair = baseChar(chars[v1]) + baseChar(chars[v2]);
      if (DIPHTHONGS.has(pair)) continue;
      // ui is a true diphthong only in the pronoun stems (cui, huic, and the
      // cui- compounds); everywhere else it is hiatus (fu-it, su-i).
      if (pair === "ui" && /^(cui|hui)/.test(lower)) continue;

      // All other adjacent vowels split in ecclesiastical Latin
      splits.add(v2);
      continue;
    }

    // Consonants between v1 and v2
    const consonants = chars.slice(v1 + 1, v2);
    const cLen = consonants.length;

    if (cLen === 0) {
      // Shouldn't happen after digraph check, but guard
      splits.add(v2);
    } else if (cLen === 1) {
      // Single consonant → goes with following vowel: V | CV
      splits.add(v1 + 1);
    } else {
      // Cluster — check last two consonants for muta cum liquida
      const last2 = consonants
        .slice(-2)
        .map((c) => baseChar(c))
        .join("");
      if (MUTA_CUM_LIQUIDA.has(last2)) {
        // Keep muta+liquida together with following vowel: VC…·tCV
        splits.add(v2 - 2);
      } else {
        // Split after first consonant: VC·C…V
        splits.add(v1 + 2);
      }
    }
  }

  // Build syllable strings from split positions
  const splitArr = Array.from(splits).sort((a, b) => a - b);
  const result: string[] = [];
  let prev = 0;
  for (const pos of splitArr) {
    if (pos > prev) result.push(chars.slice(prev, pos).join(""));
    prev = pos;
  }
  result.push(chars.slice(prev).join(""));

  return result.filter((s) => s.length > 0);
}

/**
 * Syllabify a phrase (sequence of words).
 * Returns syllables with " " tokens preserved between words.
 * e.g. "Dixit Dóminus" → ["Di","xit"," ","Dó","mi","nus"]
 */
export function syllabifyPhrase(phrase: string): string[] {
  const tokens = phrase.split(/(\s+)/);
  const result: string[] = [];

  for (const token of tokens) {
    if (!token.trim()) {
      if (token) result.push(" ");
      continue;
    }

    // Strip leading/trailing punctuation, reattach after syllabification
    const m = token.match(/^([^a-zA-ZÀ-ÿ]*)(.*?)([^a-zA-ZÀ-ÿ]*)$/u);
    if (!m) {
      result.push(token);
      continue;
    }
    const [, lead, word, trail] = m;

    if (!word) {
      result.push(token);
      continue;
    }

    const sylls = syllabifyWord(word);
    if (lead) sylls[0] = lead + sylls[0];
    if (trail) sylls[sylls.length - 1] += trail;
    result.push(...sylls);
  }

  return result.filter(
    (s, i) => !(s === " " && (i === 0 || i === result.length - 1)),
  );
}

export function hyphenateWord(word: string): string {
  return syllabifyWord(word).join(SOFT_HYPHEN);
}

const ACCENTED = /[\u0301]/; // combining acute accent (NFD form)

export function selectVowel(text: string): { vowel: string; accent: boolean } {
  const expanded = text.replace(/ǽ/g, "áe").replace(/æ/g, "ae").replace(/œ/g, "oe");
  const nfd = expanded.normalize("NFD");
  let firstVowel = "";
  let accentedVowel = "";

  for (let i = 0; i < nfd.length; i++) {
    const ch = nfd[i];
    const base = ch.replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (!isVowelBase(base)) continue;
    const v = base === "y" ? "i" : base;
    if (!firstVowel) firstVowel = v;
    if (!accentedVowel && i + 1 < nfd.length && ACCENTED.test(nfd[i + 1])) {
      accentedVowel = v;
    }
  }

  if (accentedVowel) return { vowel: accentedVowel, accent: true };
  return { vowel: firstVowel, accent: false };
}

export function detectVowelAccent(text: string): boolean {
  return selectVowel(text).accent;
}

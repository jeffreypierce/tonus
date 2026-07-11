// ---------------------------------------------------------------------------
// engines/score/lyric — decode GABC lyric markup at intake
// ---------------------------------------------------------------------------
// GABC text carries Gregorio's angle-bracket markup: style tags (<i>, <b>,
// <sc>, <c>, <e>), special-character shortcuts (<sp>V/</sp> → ℣), verbatim
// TeX (<v>\greheightstar</v> → the raised star), above-lines text (<alt>),
// and layout hints (<clear>, <nlba>, {} vowel-centering braces). The parser
// decodes it ONCE, here, so `lyric` is clean display text everywhere — the
// emitters, prosody, accent detection, and width estimation all read honest
// characters — and the styling survives as `runs` for the emitters to draw.
//
// The decoder is STATEFUL across syllables: a style opened in one syllable
// closes in a later one (`<i>al(g)le(h)lú(g)ia(h)</i>` spans four), so one
// decoder is created per parseGABC run and fed every syllable in order.
import type { LyricRun } from "./types.js";

export interface DecodedLyric {
  /** Clean display text — tags decoded, specials as real Unicode. */
  text: string;
  /** Styled spans covering `text`, present only when some style rides. */
  runs?: LyricRun[];
}

// Gregorio's <sp> shortcuts, as they occur in the corpus. The barred letters
// ℟/℣ have codepoints; the antiphon A takes the combining solidus. Unmapped
// content (‡, ¶, …) passes through literally — <sp> is "insert this symbol".
const SP_MAP: Record<string, string> = {
  "R/": "℟",        // ℟ response
  "V/": "℣",        // ℣ versicle
  "A/": "A̸",       // barred A (antiphon)
  "*": "*",              // the raised star (schola entry)
  "+": "†",         // † the flex cross
  "ae": "æ",        // æ
  "'ae": "ǽ",       // ǽ
  "'æ": "ǽ",   // 'æ → ǽ
  "oe": "œ",        // œ
  "'oe": "œ́", // œ́
  "oe'": "œ́", // corpus typo for the same
  "'œ": "œ́",
};

interface DecoderState {
  italic: number;
  bold: number;
  smallCaps: number;
  rubric: number;
  alt: number;                                    // >0 → discard (above-lines text)
  capture: { kind: "sp" | "v"; buf: string } | null;
  /** A ℣/℟ was just placed — breathe before a letter that follows directly. */
  pendingSpace: boolean;
}

// Editorial markers, each normalized to ONE style however the source wrote
// them (<i>, <c>, or plain text): the psalm incipit "Ps." rubric red, as the
// books print it; the iterum "ij."/"iij." (almost) always italic.
const PS_MARK = /^(\s*)(Ps\.)(?=\s|$)/;
const IJ_MARK = /(^|\s)(i{1,3}j\.)(?=\s|$)/;

/** Decode a <v> verbatim-TeX payload to display text (page refs vanish). */
function decodeTex(buf: string): { text: string; italic: boolean } {
  const italic = /\\itshape\b/.test(buf);
  const text = buf
    .replace(/\\pageref\{[^}]*\}/g, "")   // cross-refs to the paper book
    .replace(/\\greheightstar\b/g, "*")
    .replace(/\\ddag\b/g, "‡")
    .replace(/\\P\b/g, "¶")
    .replace(/\\textup\{([^}]*)\}/g, "$1")
    .replace(/\\ /g, " ")                 // control space
    .replace(/\\[a-zA-Z]+\*?/g, "")       // any remaining command
    .replace(/[{}]/g, "");
  return { text, italic };
}

/** Plain lyric characters: centering braces drop, ~ is a TeX placeholder. */
function cleanText(s: string): string {
  return s.replace(/[{}~]/g, "");
}

/**
 * One decoder per GABC source. Feed it each syllable's raw text in document
 * order; open styles carry across calls.
 */
export function createLyricDecoder(): { decode(raw: string): DecodedLyric } {
  const st: DecoderState = {
    italic: 0, bold: 0, smallCaps: 0, rubric: 0, alt: 0, capture: null,
    pendingSpace: false,
  };

  return {
    decode(raw: string): DecodedLyric {
      const runs: LyricRun[] = [];
      let styled = false;

      const push = (text: string, extraItalic = false): void => {
        if (!text || st.alt > 0) return;
        if (st.pendingSpace) {
          // "℣Jubilate" → "℣ Jubilate"; "℣." keeps its period tight.
          if (/^[A-Za-zÀ-ÿĀ-ž]/.test(text)) text = " " + text;
          st.pendingSpace = false;
        }
        const run: LyricRun = { text };
        if (st.italic > 0 || extraItalic) run.italic = true;
        if (st.bold > 0) run.bold = true;
        if (st.smallCaps > 0) run.smallCaps = true;
        if (st.rubric > 0) run.rubric = true;
        if (run.italic || run.bold || run.smallCaps || run.rubric) styled = true;
        const prev = runs[runs.length - 1];
        if (
          prev &&
          !prev.italic === !run.italic && !prev.bold === !run.bold &&
          !prev.smallCaps === !run.smallCaps && !prev.rubric === !run.rubric
        ) {
          prev.text += text;
        } else {
          runs.push(run);
        }
      };

      for (const part of raw.split(/(<[^<>]*>)/)) {
        if (!part) continue;
        if (part.startsWith("<") && part.endsWith(">")) {
          const tag = part.slice(1, -1).toLowerCase();
          switch (tag) {
            case "i": case "e": st.italic++; break;          // elision renders italic
            case "/i": case "/e": st.italic = Math.max(0, st.italic - 1); break;
            case "b": st.bold++; break;
            case "/b": st.bold = Math.max(0, st.bold - 1); break;
            case "sc": st.smallCaps++; break;
            case "/sc": st.smallCaps = Math.max(0, st.smallCaps - 1); break;
            case "c": st.rubric++; break;
            case "/c": st.rubric = Math.max(0, st.rubric - 1); break;
            case "alt": st.alt++; break;
            case "/alt": st.alt = Math.max(0, st.alt - 1); break;
            case "sp": st.capture = { kind: "sp", buf: "" }; break;
            case "/sp": {
              const buf = (st.capture?.buf ?? "").trim();
              st.capture = null;
              if (buf) {
                const mapped = SP_MAP[buf] ?? buf;
                push(mapped);
                if (mapped === "℣" || mapped === "℟") st.pendingSpace = true;
              }
              break;
            }
            case "v": st.capture = { kind: "v", buf: "" }; break;
            case "/v": {
              const tex = decodeTex(st.capture?.buf ?? "");
              st.capture = null;
              if (tex.text) push(tex.text, tex.italic);
              break;
            }
            // Structural / layout markup with no display form: the euouae
            // marker (its text prints plain), no-line-break areas, above-lines
            // clears — and anything unrecognized drops its brackets, keeps its
            // content (the pre-decode behavior, minus the visible tag soup).
            default: break;
          }
        } else if (st.capture) {
          st.capture.buf += part;
        } else {
          push(cleanText(part));
        }
      }

      const text = runs.map((r) => r.text).join("");

      // Normalize the editorial markers: the marker's span takes EXACTLY its
      // one style, clearing whatever markup the source happened to wrap it in.
      let out: LyricRun[] | null = styled ? runs : null;
      const sliceRuns = (from: LyricRun[], a: number, b: number): LyricRun[] => {
        const acc: LyricRun[] = [];
        let pos = 0;
        for (const run of from) {
          const s = Math.max(a, pos);
          const e = Math.min(b, pos + run.text.length);
          if (e > s) acc.push({ ...run, text: run.text.slice(s - pos, e - pos) });
          pos += run.text.length;
        }
        return acc;
      };
      const restyle = (start: number, end: number, style: Omit<LyricRun, "text">): void => {
        const base = out ?? [{ text }];
        out = [
          ...sliceRuns(base, 0, start),
          { text: text.slice(start, end), ...style },
          ...sliceRuns(base, end, text.length),
        ];
      };
      const ps = PS_MARK.exec(text);
      if (ps) restyle(ps[1]!.length, ps[1]!.length + ps[2]!.length, { rubric: true });
      const ij = IJ_MARK.exec(text);
      if (ij) {
        const start = ij.index + ij[1]!.length;
        restyle(start, start + ij[2]!.length, { italic: true });
      }

      return out ? { text, runs: out } : { text };
    },
  };
}

/**
 * Trim a syllable's edge hyphens/whitespace from its runs, mirroring the
 * emitters' display trim of the plain text, so the runs' concatenation stays
 * equal to what is drawn.
 */
export function trimRuns(runs: LyricRun[]): LyricRun[] {
  const out = runs.map((r) => ({ ...r }));
  if (out.length > 0) out[0]!.text = out[0]!.text.replace(/^-+/, "").replace(/^\s+/, "");
  const last = out[out.length - 1];
  if (last) last.text = last.text.replace(/-+$/, "").replace(/\s+$/, "");
  return out.filter((r) => r.text.length > 0);
}

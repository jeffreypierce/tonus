// ---------------------------------------------------------------------------
// engines/score/emitters/midi — Standard MIDI File emitter
// ---------------------------------------------------------------------------
// Consumes a score's tabula (the flat, interpreted per-note surface): pitch,
// phrasing-shaped velocity and duration, and microtuning pitch-bend are all
// read straight from the rows, so the score's pondus/accentus are honored
// automatically. Rests are inserted at phrase boundaries from the divisio.
import type { ChantTabulaRow } from "../tabula.js";

/** Lightweight diagnostic record. */
interface Diagnostic { code?: string; message: string }

export interface MidiOpts {
  /** "file" (default) → Uint8Array; "json" → event structure; "both" → object. */
  format?: "file" | "json" | "both";
  ppq?: number;
  tempoBpm?: number;
  channel?: number;
  /** Fallback 0–127 velocity when a row has no phrasing velocity. */
  velocity?: number;
  includeMeta?: boolean;
  trackName?: string;
  emitPitchBend?: boolean;
  transpose?: number;
}

export type MidiJsonEvent =
  | { type: "noteOn";    tick: number; pitch: number; velocity: number; channel: number; hz?: number }
  | { type: "noteOff";   tick: number; pitch: number; velocity: number; channel: number }
  | { type: "pitchBend"; tick: number; channel: number; value14: number }
  | { type: "meta";      tick: number; metaType: "tempo" | "trackName"; value: number | string };

export interface MidiJsonTrack {
  name?: string;
  events: MidiJsonEvent[];
}

export interface MidiJsonResult {
  ppq: number;
  tempoBpm: number;
  tracks: MidiJsonTrack[];
  diagnostics: Diagnostic[];
}

export interface MidiEmitResult {
  json?: MidiJsonResult;
  bytes?: Uint8Array;
}

// Divisio → rest duration (in the same beat units as note durations); a phrase's
// terminal divisio becomes a rest of this length. This is the *durational*
// reading of the divisio hierarchy (canonical table in docs/score.md), distinct
// from prosody.ts's analytic weights and phrasing.ts's shaping strengths — three
// readings of the same bar-lines, each for its own purpose. Values mirror
// DIVISIO_DURATIONS in parse.ts (the source of the fractional beat lengths).
const DIVISIO_REST: Record<string, number> = {
  ",": 0.54, "`": 0.33, ";": 0.8, ":": 1.1, "::": 1.8,
};

const DEFAULT_PPQ        = 480;
const DEFAULT_TEMPO      = 120;
const DEFAULT_CHANNEL    = 0;
const DEFAULT_VELOCITY   = 80;
const PITCH_BEND_CENTER  = 8192;

interface ResolvedMidiOpts {
  format: "file" | "json" | "both";
  ppq: number;
  tempoBpm: number;
  channel: number;
  velocity: number;
  includeMeta: boolean;
  trackName: string;
  emitPitchBend: boolean;
  transpose: number;
}

function resolveOpts(options: MidiOpts): ResolvedMidiOpts {
  return {
    format:        options.format        ?? "file",
    ppq:           options.ppq           ?? DEFAULT_PPQ,
    tempoBpm:      options.tempoBpm      ?? DEFAULT_TEMPO,
    channel:       options.channel       ?? DEFAULT_CHANNEL,
    velocity:      options.velocity      ?? DEFAULT_VELOCITY,
    includeMeta:   options.includeMeta   ?? true,
    trackName:     options.trackName     ?? "tonus",
    emitPitchBend: options.emitPitchBend ?? true,
    transpose:     options.transpose     ?? 0,
  };
}

function encodeVarLen(value: number): number[] {
  let val = Math.max(0, value | 0);
  const bytes = [val & 0x7f];
  while ((val >>= 7) > 0) bytes.unshift((val & 0x7f) | 0x80);
  return bytes;
}

function writeUInt32BE(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function writeUInt16BE(value: number): number[] {
  return [(value >>> 8) & 0xff, value & 0xff];
}

function eventPriority(event: MidiJsonEvent): number {
  if (event.type === "meta")      return 0;
  if (event.type === "pitchBend") return 1;
  if (event.type === "noteOff")   return 2;
  return 3;
}

function clampToMidiPitch(step: number, diagnostics: Diagnostic[]): number {
  if (step < 0 || step > 127) {
    diagnostics.push({
      code: "MIDI_PITCH_CLAMPED",
      message: `Pitch ${step} clamped to MIDI range 0..127`,
    });
  }
  return Math.min(127, Math.max(0, step));
}

function buildJson(
  rows: ChantTabulaRow[],
  opts: ResolvedMidiOpts,
  diagnostics: Diagnostic[],
): MidiJsonResult {
  const events: MidiJsonEvent[] = [];
  let tick = 0;

  if (opts.includeMeta) {
    events.push({ type: "meta", tick: 0, metaType: "tempo",     value: opts.tempoBpm });
    events.push({ type: "meta", tick: 0, metaType: "trackName", value: opts.trackName });
  }

  let prevPhrase: number | null = null;

  for (const row of rows) {
    // A phrase boundary inserts the previous phrase's terminal divisio as a rest.
    if (prevPhrase !== null && row.phraseIndex !== prevPhrase) {
      const restDivisio = rows.find((r) => r.phraseIndex === prevPhrase)?.divisio ?? null;
      const restBeats = restDivisio ? (DIVISIO_REST[restDivisio] ?? 0) : 0;
      tick += Math.max(0, Math.round(restBeats * opts.ppq));
    }
    prevPhrase = row.phraseIndex;

    const pitch = clampToMidiPitch(row.midi + opts.transpose, diagnostics);
    const durationTicks = Math.max(1, Math.round(row.shapedDuration * opts.ppq));
    const velocity = row.velocity != null && row.velocity > 0
      ? Math.round(row.velocity * 127)
      : opts.velocity;
    const bends = opts.emitPitchBend && Math.abs(row.bend - PITCH_BEND_CENTER) > 1;

    if (bends) {
      events.push({ type: "pitchBend", tick, channel: opts.channel, value14: row.bend });
    }
    events.push({ type: "noteOn",  tick, pitch, velocity, channel: opts.channel, hz: row.hz });
    events.push({ type: "noteOff", tick: tick + durationTicks, pitch, velocity: 0, channel: opts.channel });
    if (bends) {
      events.push({ type: "pitchBend", tick: tick + durationTicks, channel: opts.channel, value14: PITCH_BEND_CENTER });
    }

    tick += durationTicks;
  }

  events.sort((a, b) => a.tick - b.tick || eventPriority(a) - eventPriority(b));

  return {
    ppq: opts.ppq,
    tempoBpm: opts.tempoBpm,
    tracks: [{ name: opts.trackName, events }],
    diagnostics,
  };
}

function buildMidiBytes(json: MidiJsonResult): Uint8Array {
  const trackEvents = json.tracks[0]?.events ?? [];
  const trackData: number[] = [];
  let lastTick = 0;

  for (const event of trackEvents) {
    const delta = Math.max(0, event.tick - lastTick);
    lastTick = event.tick;
    trackData.push(...encodeVarLen(delta));

    if (event.type === "meta") {
      if (event.metaType === "tempo") {
        const mpqn = Math.max(1, Math.round(60000000 / Number(event.value)));
        trackData.push(0xff, 0x51, 0x03,
          (mpqn >>> 16) & 0xff, (mpqn >>> 8) & 0xff, mpqn & 0xff);
      } else if (event.metaType === "trackName") {
        const textBytes = Array.from(new TextEncoder().encode(String(event.value)));
        trackData.push(0xff, 0x03, ...encodeVarLen(textBytes.length), ...textBytes);
      }
      continue;
    }

    if (event.type === "pitchBend") {
      const lsb = event.value14 & 0x7f;
      const msb = (event.value14 >> 7) & 0x7f;
      trackData.push(0xe0 | (event.channel & 0x0f), lsb, msb);
      continue;
    }

    if (event.type === "noteOn") {
      trackData.push(0x90 | (event.channel & 0x0f), event.pitch & 0x7f, event.velocity & 0x7f);
    } else {
      trackData.push(0x80 | (event.channel & 0x0f), event.pitch & 0x7f, event.velocity & 0x7f);
    }
  }

  // End-of-track meta event
  trackData.push(0x00, 0xff, 0x2f, 0x00);

  const headerChunk = [
    0x4d, 0x54, 0x68, 0x64,  // "MThd"
    ...writeUInt32BE(6),      // chunk length
    ...writeUInt16BE(0),      // format 0
    ...writeUInt16BE(1),      // 1 track
    ...writeUInt16BE(json.ppq),
  ];
  const trackChunk = [
    0x4d, 0x54, 0x72, 0x6b,  // "MTrk"
    ...writeUInt32BE(trackData.length),
    ...trackData,
  ];
  return Uint8Array.from([...headerChunk, ...trackChunk]);
}

/**
 * Emit a Standard MIDI File from a score's tabula rows. Returns the file bytes
 * (`Uint8Array`) by default; `format: "json"` returns the event structure and
 * `"both"` returns `{ json, bytes }`.
 */
export function toMidi(rows: ChantTabulaRow[], options: MidiOpts = {}): Uint8Array | MidiEmitResult {
  const opts = resolveOpts(options);
  const diagnostics: Diagnostic[] = [];
  const json = buildJson(rows, opts, diagnostics);

  if (opts.format === "file") return buildMidiBytes(json);
  if (opts.format === "json") return { json };
  return { json, bytes: buildMidiBytes(json) };
}

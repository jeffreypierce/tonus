import type { Score, ScoredNote, ChantType, InterpretationOptions } from "../types.js";
import { MODES } from "../../temper/modes.js";
import {
  buildPhrasing,
  shapePhrasingForMode,
  applyPhrasing,
} from "../phrasing.js";
import type { PhrasingInputEvent } from "../phrasing.js";
import { inferMode } from "../infer.js";

/** Lightweight diagnostic record (replaces external Diagnostic import). */
interface Diagnostic { code?: string; message: string }

export {
  buildPhrasing,
  shapePhrasingForMode,
  applyPhrasing,
} from "../phrasing.js";
export type {
  PhrasingProfile,
  ShapedNote,
  PhrasingInputEvent,
  BuildPhrasingOptions,
  ShapePhrasingForModeOptions,
} from "../phrasing.js";

export interface MidiEmitOptions {
  mode?: number;
  office?: ChantType;
  interpretation?: InterpretationOptions;
  format?: "json" | "file" | "both";
  ppq?: number;
  tempoBpm?: number;
  channel?: number;
  velocity?: number;
  includeMeta?: boolean;
  trackName?: string;
  a4Hz?: number;
  pitchBendRangeSemitones?: number;
  emitPitchBend?: boolean;
  transpose?: number;
}

export type MidiJsonEvent =
  | { type: "noteOn";    tick: number; pitch: number; velocity: number; channel: number; hz?: number; cents?: number }
  | { type: "noteOff";  tick: number; pitch: number; velocity: number; channel: number }
  | { type: "pitchBend"; tick: number; channel: number; value14: number; cents: number }
  | { type: "meta";     tick: number; metaType: "tempo" | "trackName"; value: number | string };

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

const DEFAULT_PPQ       = 480;
const DEFAULT_TEMPO     = 120;
const DEFAULT_CHANNEL   = 0;
const DEFAULT_VELOCITY  = 80;
const DEFAULT_BEND_RANGE = 2;

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

interface ResolvedMidiOpts {
  format: "json" | "file" | "both";
  ppq: number;
  tempoBpm: number;
  channel: number;
  velocity: number;
  includeMeta: boolean;
  trackName: string;
  pitchBendRangeSemitones: number;
  emitPitchBend: boolean;
  transpose: number;
}

function resolveOpts(options: MidiEmitOptions): ResolvedMidiOpts {
  return {
    format:                   options.format                   ?? "json",
    ppq:                      options.ppq                      ?? DEFAULT_PPQ,
    tempoBpm:                 options.tempoBpm                 ?? DEFAULT_TEMPO,
    channel:                  options.channel                  ?? DEFAULT_CHANNEL,
    velocity:                 options.velocity                 ?? DEFAULT_VELOCITY,
    includeMeta:              options.includeMeta              ?? true,
    trackName:                options.trackName                ?? "tonus",
    pitchBendRangeSemitones:  options.pitchBendRangeSemitones  ?? DEFAULT_BEND_RANGE,
    emitPitchBend:            options.emitPitchBend            ?? true,
    transpose:                options.transpose                ?? 0,
  };
}

function buildJson(
  notes: Array<ScoredNote & { shapedDuration?: number }>,
  playOrder: Array<{ kind: "note"; index: number } | { kind: "rest"; duration: number }>,
  opts: ResolvedMidiOpts,
  diagnostics: Diagnostic[],
): MidiJsonResult {
  const events: MidiJsonEvent[] = [];
  let tick = 0;

  if (opts.includeMeta) {
    events.push({ type: "meta", tick: 0, metaType: "tempo",     value: opts.tempoBpm });
    events.push({ type: "meta", tick: 0, metaType: "trackName", value: opts.trackName });
  }

  for (const item of playOrder) {
    if (item.kind === "rest") {
      tick += Math.max(1, Math.round(item.duration * opts.ppq));
      continue;
    }

    const note = notes[item.index];
    const pitch = clampToMidiPitch(note.midi + opts.transpose, diagnostics);
    const duration = note.shapedDuration ?? (note.duration ?? 1);
    const durationTicks = Math.max(1, Math.round(duration * opts.ppq));
    const velocity = note.velocity != null
      ? Math.round(note.velocity * 127)
      : opts.velocity;

    if (opts.emitPitchBend && Math.abs(note.bend - 8192) > 1) {
      events.push({
        type: "pitchBend",
        tick,
        channel: opts.channel,
        value14: note.bend,
        cents: 0,
      });
    }

    events.push({
      type: "noteOn",
      tick,
      pitch,
      velocity,
      channel: opts.channel,
      hz: note.hz,
      cents: 0,
    });
    events.push({
      type: "noteOff",
      tick: tick + durationTicks,
      pitch,
      velocity: 0,
      channel: opts.channel,
    });

    if (opts.emitPitchBend && Math.abs(note.bend - 8192) > 1) {
      events.push({
        type: "pitchBend",
        tick: tick + durationTicks,
        channel: opts.channel,
        value14: 8192,
        cents: 0,
      });
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

// Flatten IR into playback sequence
function preparePlayback(ir: Score, options: MidiEmitOptions): {
  notes: Array<ScoredNote & { shapedDuration?: number }>;
  playOrder: Array<{ kind: "note"; index: number } | { kind: "rest"; duration: number }>;
} {
  const modeNum  = options.mode ?? inferMode(ir);
  const modeData = modeNum !== undefined ? MODES.get(modeNum) : undefined;
  const interpretation = options.interpretation ?? {};
  const usePhrasing =
    options.mode !== undefined ||
    interpretation.phrasing !== undefined ||
    options.office !== undefined;

  type FlatItem =
    | { kind: "note"; note: ScoredNote }
    | { kind: "rest"; duration: number; divisio: string };

  const flat: FlatItem[] = [];
  for (const phrase of ir.phrases) {
    for (const syl of phrase.syllables) {
      for (const note of syl.notes) flat.push({ kind: "note", note });
    }
    if (phrase.divisio) {
      flat.push({ kind: "rest", duration: phrase.divisio.duration, divisio: phrase.divisio.divisio });
    }
  }

  const shapedNotes: Array<ScoredNote & { shapedDuration?: number }> = [];
  const playOrder: Array<{ kind: "note"; index: number } | { kind: "rest"; duration: number }> = [];

  if (usePhrasing) {
    const profile = buildPhrasing(interpretation.phrasing ?? "lyrical", {
      overrides: interpretation.phrasingOverrides,
    });
    const modeProfile = shapePhrasingForMode(profile, modeData, {
      strength: interpretation.modalInfluence,
    });
    const tenorPc   = modeData?.tenor;
    const notesForPhrasing: PhrasingInputEvent[] = flat.map((item) =>
      item.kind === "note"
        ? { type: "note", midi: item.note.midi, weight: item.note.weight, duration: item.note.duration, ictus: item.note.ictus }
        : { type: "rest", divisio: item.divisio, duration: item.duration },
    );
    const shaped = applyPhrasing(notesForPhrasing, modeProfile, tenorPc);

    let noteIdx = 0;
    for (const item of flat) {
      if (item.kind === "rest") {
        playOrder.push({ kind: "rest", duration: item.duration });
      } else {
        shapedNotes.push(shaped[noteIdx++] ?? item.note);
        playOrder.push({ kind: "note", index: shapedNotes.length - 1 });
      }
    }
  } else {
    for (const item of flat) {
      if (item.kind === "rest") {
        playOrder.push({ kind: "rest", duration: item.duration });
      } else {
        shapedNotes.push(item.note);
        playOrder.push({ kind: "note", index: shapedNotes.length - 1 });
      }
    }
  }

  return { notes: shapedNotes, playOrder };
}

export function toMidi(ir: Score, options: MidiEmitOptions = {}): MidiEmitResult {
  const opts = resolveOpts(options);
  const diagnostics: Diagnostic[] = [];
  const { notes, playOrder } = preparePlayback(ir, options);
  const json = buildJson(notes, playOrder, opts, diagnostics);
  const result: MidiEmitResult = {};
  if (opts.format === "json" || opts.format === "both") result.json = json;
  if (opts.format === "file" || opts.format === "both") result.bytes = buildMidiBytes(json);
  return result;
}


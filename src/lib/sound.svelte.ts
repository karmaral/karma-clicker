/**
 * Plays one sample from a named pool, picked at random, or holds one under the
 * rest and crossfades it to itself. The pool, its volume and its rate spread are
 * authored in `$data/sounds`; this file only knows how to warm a pool, pick from
 * it, and sound it.
 *
 * No `AudioContext` at module scope — the sim worker imports the model layer
 * headlessly, same rule `notification-manager.ts` keeps. The context is built
 * lazily inside `warm()`, so importing this module costs nothing.
 */
import sounds from '$data/sounds';

export interface SoundBurst {
  /** How many voices a count above this still gets — a cap, not a ceiling on the count. */
  maxVoices: number;
  /** Milliseconds between voices, before the wobble. */
  gap: number;
  /** Wobble on each gap, as a share of it. 0 is an even grid. */
  jitter: number;
  /** Gain step per voice. 1 is flat. */
  taper: number;
}

export interface SoundTier {
  /** Taken when the span it is picked against is under this many milliseconds. */
  belowMs: number;
  folder: string;
}

export interface SoundData {
  /** A subfolder of `src/assets/sounds` — every file inside joins the pool. */
  folder: string;
  volume: number;
  /** Playback rate range, [min, max]. Omit to always play at 1. */
  rate?: [number, number];
  /** What a quantity sounds like. Omit and `play` always sounds one voice. */
  burst?: SoundBurst;
  /** Marks a held take. The window is the crossfade, in and out. */
  sustain?: { fadeMs: number };
  /** Stands in for `folder` as the span tightens. First match wins; `folder` is the base. */
  tiers?: SoundTier[];
}

/** Path → bundled url, every sample under every pool folder. */
const urls = import.meta.glob('../assets/sounds/**/*.{wav,mp3,ogg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function urlsInFolder(folder: string) {
  return Object.entries(urls)
    .filter(([path]) => path.includes(`/sounds/${folder}/`))
    .map(([, url]) => url);
}

let context: AudioContext | undefined;
let master: GainNode | undefined;
let volume = $state(1);
let muted = $state(false);

/** Keyed by folder, so two ids naming one folder decode it once. */
const buffers = new Map<string, AudioBuffer[]>();

/** Keyed by id — this is about not repeating a take, not about storage. */
const lastIndex = new Map<string, number>();

interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

/** One sustaining voice per id. A tier change crossfades into the same slot. */
const sustained = new Map<string, Voice>();

function ensureContext() {
  if (context) return context;

  context = new AudioContext();
  master = context.createGain();
  master.gain.value = muted ? 0 : volume;
  master.connect(context.destination);

  return context;
}

async function decode(ctx: AudioContext, url: string) {
  const bytes = await fetch(url).then((res) => res.arrayBuffer());
  return ctx.decodeAudioData(bytes);
}

/**
 * The take for a span. A tier with nothing in it yet falls through to the base
 * folder, so recording one is dropping files in — never a code change.
 */
function poolFor(data: SoundData, spanMs?: number) {
  if (spanMs !== undefined) {
    for (const tier of data.tiers ?? []) {
      if (spanMs >= tier.belowMs) continue;

      const pool = buffers.get(tier.folder);
      if (pool?.length) return pool;
    }
  }

  return buffers.get(data.folder);
}

/** Never the same file twice in a row when the pool has more than one. */
function pick(id: string, pool: unknown[]) {
  const index = Math.floor(Math.random() * pool.length);
  const last = lastIndex.get(id);

  const resolved = index === last && pool.length > 1 ? (index + 1) % pool.length : index;
  lastIndex.set(id, resolved);

  return resolved;
}

/** Seconds from the burst's start, in the audio clock. Voice 0 never lands before it. */
function offsetFor(burst: SoundBurst, voice: number) {
  const base = voice * burst.gap;
  const wobble = (Math.random() * 2 - 1) * burst.jitter * burst.gap;

  return Math.max(0, base + wobble) / 1000;
}

function playVoice(
  ctx: AudioContext,
  destination: GainNode,
  id: string,
  pool: AudioBuffer[],
  data: SoundData,
  when: number,
  scale: number,
) {
  const buffer = pool[pick(id, pool)];
  if (!buffer) return;

  const [min, max] = data.rate ?? [1, 1];

  const gain = ctx.createGain();
  gain.gain.value = data.volume * scale;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = min === max ? min : min + Math.random() * (max - min);

  source.connect(gain).connect(destination);
  source.start(when);
}

/** Rides the voice down from wherever its ramp has it and stops it at the bottom. */
function fadeOut(voice: Voice | undefined, now: number, fade: number) {
  if (!voice) return;

  const { gain } = voice.gain;

  gain.cancelScheduledValues(now);
  gain.setValueAtTime(gain.value, now);
  gain.linearRampToValueAtTime(0, now + fade);
  voice.source.stop(now + fade);
}

export const sound = {
  get volume() { return volume; },
  set volume(v: number) {
    volume = Math.max(0, Math.min(1, v));
    if (master) master.gain.value = muted ? 0 : volume;
  },

  get muted() { return muted; },
  mute(toggle?: boolean) {
    muted = toggle ?? !muted;
    if (master) master.gain.value = muted ? 0 : volume;
  },

  /** Decodes every pool up front — deciding on first play would skip that click. */
  async warm() {
    const ctx = ensureContext();

    const folders = new Set(
      Object.values(sounds).flatMap((data: SoundData) => [
        data.folder,
        ...(data.tiers ?? []).map((tier) => tier.folder),
      ]),
    );

    await Promise.all(
      [...folders].map(async (folder) => {
        if (buffers.has(folder)) return;

        const files = urlsInFolder(folder);
        buffers.set(folder, await Promise.all(files.map((url) => decode(ctx, url))));
      }),
    );

    // A folder standing empty is how an unrecorded take waits, so this reports
    // rather than warns — one line, and a typo still shows up in it.
    if (import.meta.env.DEV) {
      const empty = [...folders].filter((folder) => !buffers.get(folder)?.length);
      if (empty.length) console.info(`[sound] no takes yet in: ${empty.join(', ')}`);
    }
  },

  /**
   * `count` is a quantity, not a voice number — a pool with no `burst` plays
   * one voice regardless of it. Voices are scheduled on the audio clock, not
   * `setTimeout`, so the stagger stays sample-accurate under load.
   */
  play(id: keyof typeof sounds, count = 1) {
    const data: SoundData = sounds[id];
    if (!data || !context || !master) return;

    const pool = poolFor(data);
    if (!pool?.length) return;

    if (context.state === 'suspended') context.resume();

    const { burst } = data;
    const voices = burst ? Math.min(Math.max(count, 1), burst.maxVoices) : 1;
    const now = context.currentTime;

    for (let i = 0; i < voices; i++) {
      const when = burst && i > 0 ? now + offsetFor(burst, i) : now;
      // A gentler curve than 1/√n — full normalization made a big burst fade
      // out rather than just avoid clipping.
      const scale = burst ? burst.taper ** i / voices ** 0.3 : 1;

      playVoice(context, master, id, pool, data, when, scale);
    }
  },

  /**
   * Holds a take under whatever is happening, and calling again crossfades a
   * fresh one over it — the same slot either way, so a tier change is a fade
   * rather than a second voice. `spanMs` is what the tiers are read against.
   *
   * The take loops, so the hold outlasts the sample no matter how long it is
   * left running. A pool still decoding is a no-op; the next call starts it.
   */
  sustain(id: keyof typeof sounds, options: { spanMs?: number; fadeMs?: number } = {}) {
    const data: SoundData = sounds[id];
    if (!data?.sustain || !context || !master) return;

    const pool = poolFor(data, options.spanMs);
    if (!pool?.length) return;

    if (context.state === 'suspended') context.resume();

    const buffer = pool[pick(id, pool)];
    if (!buffer) return;

    const fade = (options.fadeMs ?? data.sustain.fadeMs) / 1000;
    const now = context.currentTime;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(data.volume, now + fade);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    source.connect(gain).connect(master);
    source.start(now);

    // Linear, not equal-power: both sides are the same material, so the sum
    // holds its level rather than bulging through the middle of the fade.
    fadeOut(sustained.get(id), now, fade);
    sustained.set(id, { source, gain });
  },

  /** Fades the sustaining voice out and forgets it. Silence is already silent. */
  release(id: keyof typeof sounds, fadeMs?: number) {
    const voice = sustained.get(id);
    if (!voice || !context) return;

    const data: SoundData = sounds[id];
    const fade = (fadeMs ?? data.sustain?.fadeMs ?? 0) / 1000;

    fadeOut(voice, context.currentTime, fade);
    sustained.delete(id);
  },
};

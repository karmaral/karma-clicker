/**
 * Plays one sample from a named pool, picked at random. The pool, its volume
 * and its rate spread are authored in `$data/sounds`; this file only knows how
 * to warm a pool, pick from it, and play it.
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

export interface SoundData {
  /** A subfolder of `src/assets/sounds` — every file inside joins the pool. */
  folder: string;
  volume: number;
  /** Playback rate range, [min, max]. Omit to always play at 1. */
  rate?: [number, number];
  /** What a quantity sounds like. Omit and `play` always sounds one voice. */
  burst?: SoundBurst;
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

const buffers = new Map<string, AudioBuffer[]>();
const lastIndex = new Map<string, number>();

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

    await Promise.all(
      Object.entries(sounds).map(async ([id, data]) => {
        if (buffers.has(id)) return;

        const files = urlsInFolder(data.folder);
        if (!files.length && import.meta.env.DEV) {
          console.warn(`[sound] no files in assets/sounds/${data.folder}`);
        }

        buffers.set(id, await Promise.all(files.map((url) => decode(ctx, url))));
      }),
    );
  },

  /**
   * `count` is a quantity, not a voice number — a pool with no `burst` plays
   * one voice regardless of it. Voices are scheduled on the audio clock, not
   * `setTimeout`, so the stagger stays sample-accurate under load.
   */
  play(id: keyof typeof sounds, count = 1) {
    const data: SoundData = sounds[id];
    const pool = buffers.get(id);
    if (!data || !pool?.length || !context || !master) return;

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
};

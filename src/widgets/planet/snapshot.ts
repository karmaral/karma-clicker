/**
 * One renderer for any number of still worlds.
 *
 * A picture that does not move needs a WebGL context for exactly one frame, and
 * browsers cap those near sixteen — so a list of worlds cannot afford a context
 * each the way `PlanetView` spends one. Here the world is drawn once, kept as a
 * bitmap, and the context released: the whole list costs one context while it
 * draws and none once it has.
 *
 * Nothing places the canvas. It mounts itself on the first request and unmounts
 * itself when the queue has been quiet for a while.
 *
 * **Deliberately not reactive.** A request is made from inside a `PlanetStill`'s
 * `$effect`, and making one drops that still's previous job — a read of the
 * queue and then a write to it, by the same effect. As `$state` that is a loop
 * with no exit. The renderer is pushed at instead: it hands over a callback when
 * it mounts.
 */
import { mount, unmount } from 'svelte';
import type { PlanetVisual } from './visual';

/** A picture: the world, the box it goes in, and the framing it is drawn to. */
export interface SnapshotRequest {
  visual: PlanetVisual;
  widthPx: number;
  heightPx: number;
  frame: number;
  /**
   * Only ever a cache key. What the render is actually drawn at is the
   * renderer's own pixel ratio, and the destination scales whatever it gets — so
   * a mismatch costs sharpness rather than correctness.
   */
  dpr: number;
}

export interface SnapshotJob extends SnapshotRequest {
  key: string;
  /** Who asked. One pending job each, so a drag supersedes its own last ask. */
  token: object;
  resolve: (bitmap: ImageBitmap) => void;
}

/** The lab's family strip at every size it offers, with room over. */
const CACHE_LIMIT = 256;

/** How long the canvas waits for more work before giving its context back. */
const RELEASE_DELAY_MS = 3000;

function keyOf({ visual, widthPx, heightPx, frame, dpr }: SnapshotRequest) {
  return `${widthPx}x${heightPx}@${dpr}/${frame}/${JSON.stringify(visual)}`;
}

class Snapshots {
  #queue: SnapshotJob[] = [];
  #cache = new Map<string, ImageBitmap>();
  #canvas: Record<string, unknown> | undefined;
  #isMounting = false;
  #wake: (() => void) | undefined;
  #releaseTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * The picture, from the cache if it is there and from the renderer if not.
   * Superseding by `token` is what keeps a slider drag from queueing a render
   * per frame — a still only ever wants its latest answer.
   */
  request(token: object, request: SnapshotRequest): Promise<ImageBitmap> {
    const key = keyOf(request);

    const cached = this.#cache.get(key);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve) => {
      this.#queue = this.#queue.filter((job) => job.token !== token);
      this.#queue.push({ ...request, key, token, resolve });

      clearTimeout(this.#releaseTimer);
      this.#ensureCanvas();
    });
  }

  /** Nothing to draw for this still any more — it left the page mid-render. */
  cancel(token: object) {
    this.#queue = this.#queue.filter((job) => job.token !== token);
  }

  /**
   * The renderer, saying it is ready. Draining immediately is what covers the
   * job that was queued before it finished mounting.
   */
  attach(drain: () => void) {
    this.#wake = drain;
    drain();

    return () => {
      this.#wake = undefined;
    };
  }

  /** The next job. The renderer holds it until it resolves. */
  dequeue(): SnapshotJob | undefined {
    return this.#queue.shift();
  }

  /** Everyone still waiting on this picture gets it, and so does the cache. */
  resolve(job: SnapshotJob, bitmap: ImageBitmap) {
    this.#store(job.key, bitmap);
    job.resolve(bitmap);

    const others = this.#queue.filter((queued) => queued.key === job.key);
    if (!others.length) return;

    this.#queue = this.#queue.filter((queued) => queued.key !== job.key);
    others.forEach((queued) => queued.resolve(bitmap));
  }

  /** Called by the renderer once it has drained. The context goes back after this. */
  scheduleRelease() {
    clearTimeout(this.#releaseTimer);

    this.#releaseTimer = setTimeout(() => {
      if (this.#queue.length || !this.#canvas) return;

      unmount(this.#canvas);
      this.#canvas = undefined;
    }, RELEASE_DELAY_MS);
  }

  /**
   * Imported lazily, and only ever from here: the canvas imports this module
   * back, and three.js has no business loading on a page that draws no worlds.
   */
  async #ensureCanvas() {
    if (this.#wake) {
      this.#wake();
      return;
    }

    if (this.#canvas || this.#isMounting) return;

    this.#isMounting = true;

    const { default: SnapshotCanvas } = await import('./SnapshotCanvas.svelte');
    this.#canvas = mount(SnapshotCanvas, { target: document.body });

    this.#isMounting = false;
  }

  /** Oldest out first. An evicted picture is simply asked for again. */
  #store(key: string, bitmap: ImageBitmap) {
    this.#cache.set(key, bitmap);
    if (this.#cache.size <= CACHE_LIMIT) return;

    const [oldest] = this.#cache.keys();
    this.#cache.get(oldest)?.close();
    this.#cache.delete(oldest);
  }
}

export const snapshots = new Snapshots();

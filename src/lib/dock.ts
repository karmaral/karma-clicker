/**
 * The one box on screen a panel too big to float can be pinned into, published
 * by the frame and consumed by whoever has something to say. A row knows what
 * it says and nothing about where there is room to say it.
 *
 * Absent while the rail is — the prelude before it lands, and a takeover — and
 * a consumer that finds no dock falls back to opening beside itself.
 */
import { getContext, setContext } from 'svelte';

const KEY = Symbol('dock');

export interface Dock {
  readonly box: HTMLElement | undefined;
  /** Its full width, padding included. A docked panel spans it rather than sizing itself. */
  readonly width: number;
}

export function setDock(dock: Dock) {
  setContext(KEY, dock);
}

export function getDock(): Dock | undefined {
  return getContext<Dock | undefined>(KEY);
}

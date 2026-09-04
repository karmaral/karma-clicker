import { apply, capture, type SaveState, type SaveSummary } from './state';
import * as storage from './storage';

export type { SaveState, SaveSummary };
export type { SaveEntry } from './storage';
export { list, remove, exists } from './storage';

/** Captures the run under a name, overwriting one already there. */
export function save(name: string) {
  return storage.write(name, capture());
}

/** Parks the name and reloads — see `storage` for why a load cannot happen in place. */
export function load(name: string) {
  if (!storage.setPending(name)) return false;

  location.reload();

  return true;
}

/**
 * The boot path's one question. Returns whether a save was applied, so
 * `App.svelte` knows whether to run the fresh-run bootstrap. Autosave lands here
 * later — read the auto slot when nothing is pending — and nowhere else.
 */
export function loadPending() {
  const state = storage.takePending();
  if (!state) return false;

  apply(state);

  return true;
}

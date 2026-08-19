/**
 * Whether anyone is looking at this subtree.
 *
 * A screen that is left is hidden rather than destroyed, so its canvas keeps its
 * WebGL context and its compiled shaders and comes back drawn instead of blank.
 * The cost of that is a canvas nobody sees still asking for frames — this is how
 * it is told not to.
 *
 * Nothing above says otherwise means watched, so a lab, a story, or any view
 * mounted on its own carries no context and runs as it always did.
 */
import { getContext, setContext } from 'svelte';

const KEY = Symbol('watched');

/** Told by whatever owns the showing. A getter, so the reader stays reactive. */
export function setWatched(isWatched: () => boolean) {
  setContext(KEY, isWatched);
}

/** The predicate itself rather than its answer — read once, at init, and called after. */
export function useWatched(): () => boolean {
  return getContext<() => boolean>(KEY) ?? (() => true);
}

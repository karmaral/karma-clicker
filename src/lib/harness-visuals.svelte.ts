/**
 * The live rig's picture — `rig.ts`'s map, held over the harness's own axes, so
 * a bought upgrade redraws the Harness tab in the frame it lands.
 *
 * Thin on purpose. Everything that decides what an axis *looks* like is in
 * `$lib/rig`, which knows nothing about the singleton and can therefore be drawn
 * by the widget lab at rungs nobody has reached. Nothing here is game state.
 */

import { harness } from '$lib/harness.svelte';
import { rigVisualsAt } from '$lib/rig';

const current = $derived(rigVisualsAt(harness.axes));

export const rig = {
  get anchors() { return current.anchors; },
  get harness() { return current.harness; },
};

export default rig;

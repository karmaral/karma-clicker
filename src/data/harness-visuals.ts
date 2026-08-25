/**
 * What the anchors and the lines between them look like. One record for every
 * world for now, seeded from the widget defaults: `harness-lab.svelte.ts` notes
 * that a pair's family comes from the pair alone, so there is nothing per-world
 * to author until a second has been judged by eye. The lab's copy button prints
 * a literal to paste in here when there is.
 */

import { DEFAULT_ANCHOR, DEFAULT_HARNESS } from '$widgets/planet';
import type { AnchorVisual, HarnessVisual } from '$widgets/planet';

export const anchors: AnchorVisual = { ...DEFAULT_ANCHOR };
export const harness: HarnessVisual = { ...DEFAULT_HARNESS };

export default { anchors, harness };

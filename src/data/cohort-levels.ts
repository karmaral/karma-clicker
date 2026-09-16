/**
 * The cohort's level upgrades, generated off the index rather than authored per
 * cohort — see `docs/design.md` §5, *Milestones — why anyone owns four hundred
 * of anything*. `tier` and `level` stay the vocabulary (kept, not retired — see
 * §20): a **cohort** is which row, a **level** is which rung.
 *
 * `buildings.ts` still says which counts unlock a level; this file says what
 * each one is worth. Nothing says what it costs — a level is free, see
 * `levelUpgrades`. These are the *per-cohort* six: every gate pays a second
 * time once **every** cohort reaches it, and that tier lives in `upgrades.ts`
 * under the `cohorts` scope. Twelve rungs a row between them.
 */

import type { ItemTextData, Modifier, UpgradeData } from '$lib/types';
import { roman } from '$lib/utils';
import buildings, { LEVEL_GATES } from './buildings';

/**
 * One level, as the modifiers it used to be folded into `#production`.
 *
 * Halving the life and doubling the yield were never a balance choice: rate is
 * yield over duration and either ×2 moves it identically. So the split this
 * file used to author — `min(6, n + 4)` halvings, the rest yield rungs — was
 * guessing from the index at something `Building.#clampDuration` now answers
 * live: a halving that would take a life under `emission.streamUnder` becomes
 * a yield doubling instead, at the rung where *that* cohort's clock actually
 * arrives, counting every source of shortening it holds.
 *
 * So there is one rung here and no branch. Which of the two it turns out to be
 * depends on the run, and is not this file's to decide.
 */
const LEVEL_EFFECT: Omit<Modifier, 'id'> = { op: 'mult', value: 0.5, stat: 'duration' };

/** `cohort_7` → 7. Anything else — the click included — has no levels to build. */
function cohortIndex(id: string) {
  const n = Number(id.match(/^cohort_(\d+)$/)?.[1]);

  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * **A level has no price.** It is granted on reaching its gate and taken back
 * on falling below it — `acquireUnpriced` and `releaseUnheld` both already do
 * that, so there is nothing here but the gate and the effect.
 *
 * A priced rung was never a decision: it came out to a fixed multiple of one
 * more copy at every gate on every cohort, so you bought it on sight or the
 * mechanic was off. Free, the gate itself does the pulling — the copy that
 * crosses one doubles the whole row, which is the *three more to go* the
 * reference games run on.
 */
export function levelUpgrades(id: string): UpgradeData[] {
  const n = cohortIndex(id);
  if (!n || !buildings[id]?.cost) return [];

  return LEVEL_GATES.map((gate, index) => ({
    id: `level_${index + 1}`,
    effect: [{ ...LEVEL_EFFECT }],
    unlocks_at: { count: gate },
  }));
}

/**
 * Reads the effects back out, so a description cannot claim a figure it does
 * not carry. `effect` is the chip's one line and stays short on purpose — the
 * figures are the tooltip's job, which is what a hover is for.
 */
export function levelTexts(id: string): Record<string, ItemTextData> {
  const texts: Record<string, ItemTextData> = {};
  if (!cohortIndex(id)) return texts;

  levelUpgrades(id).forEach((item, index) => {
    texts[item.id] = {
      title: `Tier ${roman(index + 1)}`,
      description: 'Placeholder. Every soul in the cohort: half the life, same yield each.',
      effect: 'life halved',
    };
  });

  return texts;
}

/**
 * Where an upgrade's hover points, so the thing it affects can tint itself. A
 * module-level channel rather than a prop: the hover starts in the rail or the
 * catalogue, the target it names can live on a different screen — or not be on
 * screen at all — and neither side should have to be threaded through props to
 * find the other. Shaped like `nav` and `catalogue`.
 */
import { parseScope } from '$data/upgrades';
import type { UpgradeScope } from '$types';

let target = $state<string | undefined>();

export const spotlight = {
  get target() { return target; },

  /** `key` is the upgrade's own bucket key — `upgrade.target`, unparsed. */
  point(key: string) { target = key; },
  clear() { target = undefined; },

  /**
   * Whether a given entity is the one being pointed at. `cohorts` is a
   * fan-out bucket, not an entity — every cohort lights while it is hovered,
   * so it answers any `cohort` query regardless of which one is asking.
   */
  isLit(kind: UpgradeScope['kind'], entity?: string) {
    if (target === undefined) return false;

    const scope = parseScope(target);
    if (scope.kind === 'cohorts') return kind === 'cohort';

    return scope.kind === kind && scope.entity === entity;
  },
};

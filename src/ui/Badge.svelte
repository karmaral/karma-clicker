<script lang="ts">
  import type { BadgeKind } from './types';

  interface Props {
    kind: BadgeKind;
  }

  let { kind }: Props = $props();
</script>

<span class={['badge', kind]} aria-hidden="true"></span>

<style>
  .badge {
    position: relative;
    width: var(--badge-size);
    height: var(--badge-size);
    flex: none;
    display: inline-block;
    border-radius: var(--badge-radius);
    transform: rotate(45deg);
  }

  .badge.xp {
    border-radius: 50%;
    transform: none;
    background: var(--res-xp);
  }

  .badge.red    { background: var(--res-red); }
  .badge.yellow { background: var(--res-yellow); }
  .badge.blue   { background: var(--res-blue); }

  .badge.pos {
    background: var(--hatch-pos-badge);
    box-shadow: var(--hatch-pos-edge);
  }

  .badge.neg {
    background: var(--hatch-neg-badge);
  }

  .badge.both {
    background: var(--hatch-neg-badge);
  }

  .badge.both::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--hatch-pos-badge);
    box-shadow: var(--hatch-pos-edge);
    clip-path: polygon(0 0, 100% 0, 100% 100%);
  }

  .badge.any {
    box-shadow: inset 0 0 0 1px var(--ink-900);
  }
</style>

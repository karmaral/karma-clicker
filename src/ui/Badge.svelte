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
    background: var(--res-xp-fill);
    box-shadow: inset 0 0 0 1px var(--res-xp-edge);
  }
  .badge.wisdom {
    background: var(--res-wisdom);
    box-shadow: inset 0 0 0 1px var(--res-wisdom-edge);
  }

  /* Unrouted Crimson takes the polarised badge's corner as well as its hue, so
     the three read as one resource before they read as three marks. Field and
     ring are each the midpoint of the two sides', which is the only pair that
     sits between them without landing on either. */
  .badge.red {
    border-radius: 32.5%;
    background: var(--red-fill);
    box-shadow: var(--red-edge);
  }

  /* Outlined, where the grades above are bought rather than refined: the ring is
     what says so at 9px. */
  .badge.yellow {
    background: var(--res-yellow-fill);
    box-shadow: inset 0 0 0 1px var(--res-yellow);
  }

  .badge.blue {
    background: var(--res-blue-fill);
    box-shadow: inset 0 0 0 1px var(--res-blue);
  }

  /* Karma reads as a solid field with a ring, not as hatching — the stripes were
     cut for a bar and fizzed into grey at 9px, which is exactly where the two
     sides most need to be told apart. Both sides are a field the page can see
     against a ring darker than it, so the pair reads as one mark drawn twice. */
  .badge.pos {
    border-radius: 50%;
    background: var(--karma-pos-fill);
    box-shadow: var(--karma-pos-edge);
  }

  .badge.neg {
    border-radius: 50%;
    background: var(--karma-neg-fill);
    box-shadow: var(--karma-neg-edge);
  }

  .badge.both {
    border-radius: 50%;
    background: var(--karma-neg-fill);
    box-shadow: var(--karma-neg-edge);
  }

  .badge.both::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--karma-pos-fill);
    box-shadow: var(--karma-pos-edge);
    clip-path: polygon(0 0, 100% 0, 100% 100%);
  }

  /* Karma's three treatments at red's hue. Same shapes and the same clip, so a
     polarised red reads as the polarity it is before it reads as a token — and
     now the same construction too: a field that carries the side, under a ring
     cut one step darker than that field. */
  .badge.red-pos {
    border-radius: 32.5%;
    background: var(--red-pos-fill);
    box-shadow: var(--red-pos-edge);
  }

  .badge.red-neg {
    border-radius: 32.5%;
    background: var(--red-neg-fill);
    box-shadow: var(--red-neg-edge);
  }

  .badge.red-both {
    border-radius: 32.5%;
    background: var(--red-neg-fill);
    box-shadow: var(--red-neg-edge);
  }

  .badge.red-both::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--red-pos-fill);
    box-shadow: var(--red-pos-edge);
    clip-path: polygon(0 0, 100% 0, 100% 100%);
  }

  .badge.any {
    box-shadow: inset 0 0 0 1px var(--ink-900);
  }
</style>

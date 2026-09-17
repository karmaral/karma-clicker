<script lang="ts">
  import Badge from './Badge.svelte';
  import type { BadgeKind } from './types';

  interface Props {
    kind: BadgeKind;
    quantity: number;
    amount: string;
    affordable?: boolean;
    disabled?: boolean;
    onclick?: () => void;
    onmouseenter?: () => void;
    onmouseleave?: () => void;
    /**
     * A tapped right button. The same button held is a read elsewhere — the
     * cohort rows open their derivation on it — so the clock tells the two
     * apart rather than a modifier. Without an `onhold` there is nothing to
     * tell apart and any release is a tap. The menu that would land on the
     * release is refused document-wide — see `main.ts`.
     */
    oncycle?: () => void;
    /** The same press, once it has been down `HOLD_MS`. The tap is off from then on. */
    onhold?: () => void;
  }

  let {
    kind,
    quantity,
    amount,
    affordable = false,
    disabled = false,
    onclick,
    onmouseenter,
    onmouseleave,
    oncycle,
    onhold,
  }: Props = $props();

  /** Right. `MouseEvent.button`, not the `buttons` mask. */
  const RIGHT = 2;

  /** Long enough that a click never reads as a hold, short enough to feel like a press. */
  const HOLD_MS = 180;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let holding = false;

  function press(event: MouseEvent) {
    if (event.button !== RIGHT || !(oncycle || onhold)) return;

    event.preventDefault();
    holding = false;

    if (onhold) {
      timer = setTimeout(() => {
        holding = true;
        onhold();
      }, HOLD_MS);
    }

    // On the window, because a press dragged off the button still comes up
    // somewhere — and filtered there, because the left button is busy buying.
    window.addEventListener('mouseup', release);
  }

  function release(event: MouseEvent) {
    if (event.button !== RIGHT) return;

    window.removeEventListener('mouseup', release);
    clearTimeout(timer);

    if (!holding) {
      oncycle?.();
    }
  }

  $effect(() => () => {
    clearTimeout(timer);
    window.removeEventListener('mouseup', release);
  });
</script>

<button
  type="button"
  class={['purchase', { affordable }]}
  {disabled}
  {onclick}
  {onmouseenter}
  {onmouseleave}
  onmousedown={press}
>
  {#if quantity}
    <span class="quantity">{quantity}×</span>
  {/if}
  <span class="amount num">{amount}</span>
  <Badge {kind} />
</button>

<style>
  /**
   * The button fills the cell it is given, out to that cell's far edge — every
   * table that sells anything hands it one, and the cell's own hairline is the
   * whole separation. No frame of its own: a box in --ink-300 competed with the
   * row rules it sat between, and the figure alone says the price well enough.
   * The trailing 12px is the row's gutter, so the figure lands on the content
   * edge rather than on the card's.
   */
  .purchase {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: var(--badge-gap);
    width: 100%;
    height: 100%;
    min-width: 0;
    margin: 0;
    padding: var(--sp-1) 12px var(--sp-1) var(--sp-2);
    border: none;
    background: transparent;
    color: var(--ink-300);
    white-space: nowrap;
  }

  .quantity {
    font-size: var(--fs-xs);
    font-weight: 500;
  }

  .amount {
    font-size: var(--fs-sm);
    font-weight: 600;
    line-height: 1;
  }

  .purchase.affordable {
    color: var(--ink-900);

    &:hover {
      color: white;
      background-color: var(--ink-900);
    }
  }
</style>

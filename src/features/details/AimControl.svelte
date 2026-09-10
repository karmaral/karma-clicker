<script lang="ts">
  import { Badge, type BadgeKind } from '$ui';
  import { aim, DETENTS, type Detent } from '$lib/aim';

  interface Props {
    /** The committed aim — what the cohorts are actually doing. */
    value: number;
    /** Pointed at but not paid for. The bar follows this; `value` keeps a ghost. */
    draft?: number;
    onaim?: (value: number) => void;
  }

  let { value, draft, onaim }: Props = $props();

  /** The control follows your hand, so everything it draws reads off the draft. */
  const pointed = $derived(draft ?? value);

  /** Karma's own badges: the aim splits the karma pile, so it labels in karma. */
  const MARKS: Record<Detent, BadgeKind[]> = {
    [-2]: ['neg', 'neg'],
    [-1]: ['neg'],
    [0]: ['both'],
    [1]: ['pos'],
    [2]: ['pos', 'pos'],
  };

  const LAST = DETENTS.length - 1;

  const DRAG_THRESHOLD = 4;

  let dragging: boolean = $state(false);
  let slid = false;
  let captured = false;
  let startX = 0;
  let track: DOMRect | null = null;

  /** Ticks sit on the ends, not on cell centres, so a step is a quarter of the track. */
  const at = (i: number) => `${(i / LAST) * 100}%`;

  function detentAt(clientX: number) {
    if (!track) return pointed;
    const i = Math.round(((clientX - track.left) / track.width) * LAST);

    return DETENTS[Math.max(0, Math.min(LAST, i))];
  }

  function onpointerdown(e: PointerEvent) {
    if (e.button !== 0) return;
    const el = e.currentTarget as HTMLDivElement;
    track = el.getBoundingClientRect();
    startX = e.clientX;
    slid = false;
    captured = false;
    dragging = true;
  }

  function onpointermove(e: PointerEvent) {
    if (!dragging) return;
    if (!slid) {
      if (Math.abs(e.clientX - startX) <= DRAG_THRESHOLD) return;
      slid = true;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      captured = true;
    }
    const detent = detentAt(e.clientX);
    if (detent !== pointed) onaim?.(detent);
  }

  function onpointerup(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    if (captured) {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      captured = false;
    }
  }

  function onclickcapture(e: MouseEvent) {
    if (!slid) return;
    e.preventDefault();
    e.stopPropagation();
  }
</script>

<div
  class={['strip', { dragging }]}
  role="group"
  aria-label="Aim"
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointercancel={onpointerup}
  {onclickcapture}
>
  <div class="track" data-cursor-grab data-cursor-dragging={dragging}>
    <span class="rule"></span>
    {#each DETENTS as detent, i (detent)}
      <span class="tick" style:left={at(i)}></span>
    {/each}
    <!-- The aim still being run, while the solid bar is off being chosen. One
         hairline, so the pair reads as *here, going there* rather than as two
         dials. Gone the moment there is nothing pending. -->
    {#if draft !== undefined}
      <span class="bar held" style:left={at(DETENTS.indexOf(value as Detent))}></span>
    {/if}
    <span class="bar" style:left={at(DETENTS.indexOf(pointed as Detent))}></span>
  </div>

  <div class="marks">
    {#each DETENTS as detent, i (detent)}
      <button
        type="button"
        class={['mark', { first: i === 0, last: i === LAST, on: detent === pointed }]}
        style:left={at(i)}
        aria-label={aim.detentLabel(detent)}
        aria-pressed={detent === pointed}
        onclick={() => onaim?.(detent)}
      >
        {#each MARKS[detent] as kind, n (n)}
          <Badge {kind} />
        {/each}
      </button>
    {/each}
  </div>
</div>

<style>
  .strip {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    user-select: none;
    touch-action: pan-y;
  }

  .track {
    position: relative;
    height: 22px;
    min-width: 0;
  }

  .rule {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--line-300);
  }

  .tick {
    position: absolute;
    top: 50%;
    width: 1px;
    height: 7px;
    margin-top: -3px;
    background: var(--line-300);
    transform: translateX(-50%);
  }

  .bar {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--ink-900);
    transform: translateX(-50%);
    transition: left var(--t-fast);
  }

  /* Holds still, so it does not read as a second thing being moved. */
  .bar.held {
    width: 1px;
    background: var(--ink-300);
    transition: none;
  }

  .marks {
    position: relative;
    height: var(--glyph-size);
    min-width: 0;
  }

  .mark {
    position: absolute;
    top: 0;
    display: flex;
    align-items: center;
    gap: 2px;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    opacity: .45;
    transform: translateX(-50%);
    transition: opacity var(--t-fast);
  }

  /* The ends align inward off their tick, so a hard aim never spills the track. */
  .mark.first { transform: none; }
  .mark.last  { transform: translateX(-100%); }

  .mark.on {
    opacity: 1;
  }
</style>

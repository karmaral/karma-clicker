<script lang="ts">
  import { Badge, type BadgeKind } from '$ui';
  import { aim, DETENTS, type Detent } from '$lib/aim';

  interface Props {
    /** The committed aim — what the cohorts are actually doing. */
    value: number;
    /** Pointed at but not paid for. The tack follows this; `value` keeps a ghost. */
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
  <!-- The badges are the ticks: one row, and you aim at what you get rather
       than at a tick captioned with it. The pointed one sits in the tack; the
       aim still being run keeps a faded one, so a draft reads as *here, going
       there* rather than as two dials. -->
  <div class="track" data-cursor-grab data-cursor-dragging={dragging}>
    <span class="rule"></span>
    {#each DETENTS as detent, i (detent)}
      <button
        type="button"
        class={[
          'mark',
          {
            first: i === 0,
            last: i === LAST,
            on: detent === pointed,
            held: draft !== undefined && detent === value,
          },
        ]}
        style:left={at(i)}
        aria-label={aim.detentLabel(detent)}
        aria-pressed={detent === pointed}
        onclick={() => onaim?.(detent)}
      >
        <span class="glyphs">
          {#each MARKS[detent] as kind, n (n)}
            <Badge {kind} />
          {/each}
        </span>
      </button>
    {/each}
  </div>
</div>

<style>
  /* A little air under the cradle: the section above it gives up its own
     bottom padding at the column's foot. */
  .strip {
    padding-bottom: var(--sp-2);
    user-select: none;
    touch-action: pan-y;
  }

  /* The badges' height, and room under them for the cradle — and the same
     again above, as air under the head's rule. */
  .track {
    --reach: 4px;
    --tack: calc(var(--glyph-size) * 2 + 2px + var(--reach) * 2);

    position: relative;
    margin-top: var(--reach);
    height: calc(var(--glyph-size) + var(--reach));
    min-width: 0;
  }

  /* Through the badges' centres; each mark's own ground breaks it. */
  .rule {
    position: absolute;
    top: calc(var(--glyph-size) / 2);
    left: 0;
    right: 0;
    height: 1px;
    background: var(--line-300);
  }

  /* Every mark is the tack's width, one badge or two: the rule breaks evenly
     at each, and the cradle is the mark's own box, so it can never sit off
     centre or overhang an end. */
  .mark {
    position: absolute;
    top: 0;
    display: flex;
    justify-content: center;
    width: var(--tack);
    height: var(--glyph-size);
    padding: 0;
    border: none;
    background: var(--surface);
    transform: translateX(-50%);
  }

  /* The ends align inward off their point, so a hard aim never spills the track. */
  .mark.first { transform: none; }
  .mark.last  { transform: translateX(-100%); }

  /* Faded on the glyphs, not the button: the button's ground is what breaks the
     rule, and a translucent one would let it through. */
  .glyphs {
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: .45;
    transition: opacity var(--t-fast);
  }

  .mark.on .glyphs {
    opacity: 1;
  }

  /* The tack: a cradle under the pointed badges, the sides only begun — they
     sit in it rather than being boxed in. */
  .mark.on::after,
  .mark.held::after {
    --arm: 12px;
    --stroke: 1px;
    --ink: var(--ink-900);

    content: '';
    position: absolute;
    inset: 0 0 calc(var(--reach) * -1);
    background:
      linear-gradient(var(--ink), var(--ink)) bottom / 100% var(--stroke),
      linear-gradient(var(--ink), var(--ink)) bottom left / var(--stroke) var(--arm),
      linear-gradient(var(--ink), var(--ink)) bottom right / var(--stroke) var(--arm);
    background-repeat: no-repeat;
  }

  /* Faded like its glyphs, so it does not read as a second thing being moved. */
  .mark.held:not(.on)::after {
    opacity: .45;
  }
</style>

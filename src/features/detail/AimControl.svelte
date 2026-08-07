<script lang="ts">
  import { crossfade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  interface Props {
    value: number;
    lean: string;
    note?: string;
    unaimable?: boolean;
    height?: string;
    onaim?: (value: number) => void;
  }

  let {
    value,
    lean,
    note,
    unaimable = false,
    height = '18px',
    onaim,
  }: Props = $props();

  const detents = [
    { at: -2, label: '−−', name: 'Hard negative' },
    { at: -1, label: '−', name: 'Negative' },
    { at: 0, label: '◇', name: 'Neutral' },
    { at: 1, label: '+', name: 'Positive' },
    { at: 2, label: '++', name: 'Hard positive' },
  ] as const;

  const [send, receive] = crossfade({
    duration: 120,
    easing: cubicOut,
    fallback: () => ({ duration: 120, easing: cubicOut, css: (t) => `opacity: ${t}` }),
  });

  const DRAG_THRESHOLD = 4;

  let dragging: boolean = $state(false);
  let slid = false;
  let captured = false;
  let startX = 0;
  let track: DOMRect | null = null;

  function detentAt(clientX: number) {
    if (!track) return value;
    const i = Math.floor(((clientX - track.left) / track.width) * detents.length);
    return detents[Math.max(0, Math.min(detents.length - 1, i))].at;
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
    const at = detentAt(e.clientX);
    if (at !== value) onaim?.(at);
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

<div class="aim">
  {#if unaimable}
    <div class="volatile"></div>
  {:else}
    <div
      class={['strip', { dragging }]}
      style:height
      role="group"
      aria-label="Aim"
      {onpointerdown}
      {onpointermove}
      {onpointerup}
      onpointercancel={onpointerup}
      {onclickcapture}
    >
      {#each detents as detent (detent.at)}
        <button
          type="button"
          class={['detent', `d${detent.at}`]}
          aria-label={detent.name}
          aria-pressed={detent.at === value}
          onclick={() => onaim?.(detent.at)}
        >
          {#if detent.at === value}
            <span
              class="knob"
              in:receive={{ key: 'knob' }}
              out:send={{ key: 'knob' }}
            >{detent.label}</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  <div class="meta">
    <span class="lean">{lean}</span>
    {#if note}
      <span class={['note', { quiet: unaimable }]}>{note}</span>
    {/if}
  </div>
</div>

<style>
  .aim {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }

  .strip {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: var(--sp-1);
    cursor: pointer;
    user-select: none;
    touch-action: pan-y;
  }

  .strip.dragging {
    cursor: grabbing;
  }

  .detent {
    position: relative;
    padding: 0;
    border: none;
    min-width: 0;
    cursor: inherit;
  }

  .detent.d-2 {
    background: repeating-linear-gradient(45deg,
      #111111 1px, #111111 4px, #5a5a5a 4px, #5a5a5a 5px);
  }

  .detent.d-1 {
    background: repeating-linear-gradient(45deg,
      #5a5a5a 1px, #5a5a5a 4px, #9a9a9a 4px, #9a9a9a 5px);
  }

  .detent.d0 {
    background: var(--line-100);
  }

  .detent.d1 {
    background: repeating-linear-gradient(-45deg,
      #ffffff 1px, #ffffff 4px, #a3a3a3 4px, #a3a3a3 5px);
    box-shadow: var(--hatch-pos-edge);
  }

  .detent.d2 {
    background: repeating-linear-gradient(-45deg,
      #ffffff 1px, #ffffff 4px, #d4d4d4 4px, #d4d4d4 5px);
    box-shadow: var(--hatch-pos-edge);
  }

  .knob {
    position: absolute;
    inset: -15% 20%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface);
    border: 2px solid var(--ink-900);
    font-size: var(--fs-xs);
    font-weight: 600;
    line-height: 1;
    color: var(--ink-900);
    user-select: none;
    cursor: grab;
  }

  .volatile {
    height: 10px;
    background: repeating-linear-gradient(45deg,
      var(--ink-300) 0 1px, var(--surface) 1px 3px);
    box-shadow: var(--hatch-pos-edge);
  }

  .meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-3);
    min-width: 0;
  }

  .lean {
    font-size: var(--fs-xs);
    font-weight: 600;
    color: var(--ink-900);
  }

  .note {
    font-size: var(--fs-xs);
    color: var(--ink-500);
    text-align: right;
  }

  .note.quiet {
    color: var(--ink-300);
  }
</style>

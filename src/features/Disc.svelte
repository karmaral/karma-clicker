<script lang="ts">
  /**
   * The disc is the click target from beat 1 to the end (CONTEXT v3 §4b).
   * Early dots are countable souls; later they read as flow.
   */
  const MAX_DOTS = 28;

  interface Props {
    size?: number;
    count?: number;
    action?: string;
    sub?: string;
    onincarnate?: () => void;
  }

  let {
    size = 150,
    count = 0,
    action = 'Incarnate',
    sub,
    onincarnate,
  }: Props = $props();

  const dots = $derived(Math.min(count, MAX_DOTS));
  const orbit = $derived(size * 0.68);
</script>

<div class="disc-slot">
  <div class="orbit" style:width="{size}px" style:height="{size}px">
    <button
      class="disc"
      style:width="{orbit}px"
      style:height="{orbit}px"
      onclick={onincarnate}
      aria-label={action}
    ></button>

    {#if dots > 0}
      <div class="ring" aria-hidden="true">
        {#each { length: dots } as _, i}
          <span
            class="dot"
            style:transform="rotate({(360 / dots) * i}deg) translateY(-{size / 2}px)"
          ></span>
        {/each}
      </div>
    {/if}
  </div>

  <div class="caption">
    <span class="verb">{action}</span>
    {#if sub}
      <span class="sub num">{sub}</span>
    {/if}
  </div>
</div>

<style>
  .disc-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
  }

  .orbit {
    position: relative;
    display: grid;
    place-items: center;
  }

  .disc {
    border: none;
    border-radius: 50%;
    padding: 0;
    background: var(--ink-900);
    cursor: pointer;
    transition: transform .08s ease-out;
  }

  .disc:active {
    transform: scale(.97);
  }

  .ring {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    animation: turn 24s linear infinite;
    pointer-events: none;
  }

  .dot {
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--ink-900);
  }

  @keyframes turn {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .ring { animation: none; }
  }

  .caption {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .verb {
    font-size: var(--fs-base);
    font-weight: 600;
  }

  .sub {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>

<script lang="ts">
  import LabPanel from './LabPanel.svelte';
  import { VISUAL_GROUPS, VISUAL_PARAMS, type PlanetVisual } from './planet';
  import { planetLab } from './planet-lab.svelte';

  let copied = $state(false);

  const current = $derived(planetLab.current);

  let puck: HTMLButtonElement | undefined = $state();
  let aiming = $state(false);

  /** Screen y runs down, the key direction runs up. */
  function aimAt(event: PointerEvent) {
    if (!puck) return;

    const box = puck.getBoundingClientRect();

    planetLab.aim(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      -(((event.clientY - box.top) / box.height) * 2 - 1),
    );
  }

  function grab(event: PointerEvent) {
    aiming = true;
    puck?.setPointerCapture(event.pointerId);
    aimAt(event);
  }

  async function copy() {
    await navigator.clipboard.writeText(planetLab.print());
    copied = true;
    setTimeout(() => (copied = false), 1200);
  }
</script>

<LabPanel
  title="planet lab · {planetLab.selected}"
  groups={VISUAL_GROUPS}
  params={VISUAL_PARAMS}
  value={(key) => current[key as keyof PlanetVisual]}
  set={(key, value) => planetLab.set(key as keyof PlanetVisual, value)}
  reset={(key) => planetLab.reset(key as keyof PlanetVisual)}
>
  {#snippet header()}
    <div class="row">
      {#each planetLab.ids as id (id)}
        <button
          class={['pick', { on: id === planetLab.selected }]}
          onclick={() => planetLab.select(id)}
        >{id}</button>
      {/each}
    </div>

    <div class="row">
      <span class="id">seed {current.seed}</span>
      <button onclick={() => planetLab.reseed()}>reseed</button>
      <button onclick={() => planetLab.revert()}>revert</button>
      <button onclick={copy}>{copied ? 'copied' : 'copy'}</button>
    </div>
  {/snippet}

  <!-- Directly under its weight: the puck does nothing while Key is 0. -->
  {#snippet under(key: string)}
    {#if key === 'key'}
      <div class={['row', 'aim', { inert: !current.key }]}>
        <span class="id">{current.key ? 'Direction' : 'Direction (Key 0)'}</span>
        <button
          class="puck"
          type="button"
          aria-label="Key direction"
          bind:this={puck}
          onpointerdown={grab}
          onpointermove={(e) => aiming && aimAt(e)}
          onpointerup={() => (aiming = false)}
          onlostpointercapture={() => (aiming = false)}
          onpointercancel={() => (aiming = false)}
        >
          <span
            class="knob"
            style:left="{50 + current.keyX * 50}%"
            style:top="{50 - current.keyY * 50}%"
          ></span>
        </button>
        <span class="num">
          {current.keyX.toFixed(2)}<br />{current.keyY.toFixed(2)}
        </span>
      </div>
    {/if}
  {/snippet}
</LabPanel>

<style>
  /* Layout for these rows comes from LabPanel; only the puck is local. */
  .aim {
    align-items: flex-start;
    padding: var(--sp-1) 0;
  }

  .aim.inert {
    opacity: .45;
  }

  .puck {
    position: relative;
    flex: none;
    width: 4.5rem;
    height: 4.5rem;
    padding: 0;
    border: var(--rule-card);
    border-radius: 50%;
    background: var(--surface-alt);
    cursor: crosshair;
    touch-action: none;
  }

  /** A horizon, so the disc reads as a hemisphere rather than a dial. */
  .puck::after {
    content: '';
    position: absolute;
    inset: 25%;
    border: 1px dashed var(--line-300);
    border-radius: 50%;
  }

  .knob {
    position: absolute;
    width: 9px;
    height: 9px;
    margin: -4.5px 0 0 -4.5px;
    border-radius: 50%;
    background: var(--ink-900);
  }
</style>

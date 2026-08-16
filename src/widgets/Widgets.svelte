<script lang="ts">
  import { Label } from '$ui';
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte';
  import AnchorLabPanel from './AnchorLabPanel.svelte';
  import DotTypePreview from './DotTypePreview.svelte';
  import LabRail from './LabRail.svelte';
  import PlanetLabPanel from './PlanetLabPanel.svelte';
  import SwarmLabPanel from './SwarmLabPanel.svelte';
  import { PlanetView } from './planet';
  import { anchorLab } from './anchor-lab.svelte';
  import { planetLab } from './planet-lab.svelte';
  import { swarmLab } from './swarm-lab.svelte';

  /** The sizes a planet actually ships at, plus one large enough to judge terrain. */
  const trueSizes = [40, 56, 80, 120, 180];

  /** Souls per cohort, off the lab's sliders. One dot is one soul at these counts. */
  const cohorts = $derived(swarmLab.counts);

  /** One flag per anchor, off the lab's two sliders. */
  const anchored = $derived(anchorLab.anchored);

  /** Every count at once, all placed — the figures side by side. */
  const figures = [2, 3, 4, 5, 6, 7, 8];

  /** Rim-hugging orbits still need more room than a bare body. */
  const swarmFrame = 3.2;
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Encode+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page">
  <header>
    <Label text="Karma clicker — widget workbench" />
    <h1>Widgets</h1>
    <p>Develop visual components here, rendered in isolation.</p>
  </header>

  <section>
    <h2>Planet — subject</h2>
    <p class="note">
      Orthographic, no lights. The bands are a view fresnel — how far a facet turns from
      the screen — plus the terrain height, normalised so <code>land</code> reads as the
      share of the ramp the terrain owns. Both weights at zero leaves a flat fill and
      the outline.
    </p>
    <div class="canvas subject">
      <PlanetView visual={planetLab.current} px={420} />
    </div>
  </section>

  <section>
    <h2>Planet — family</h2>
    <p class="note">
      All worlds at once. Planets authored one at a time come out as unrelated illustrations;
      this is the only view that catches it. The last two are specimens for <code>ridge</code>
      and <code>strata</code>, not worlds.
    </p>
    <div class="canvas strip">
      {#each planetLab.ids as id (id)}
        <div class="member">
          <PlanetView visual={planetLab.drafts[id]} px={200} />
          <span class="spec">{id}</span>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h2>Planet — true size</h2>
    <p class="note">
      The selected world at the sizes it ships at, on <code>--surface</code> rather than
      the canvas. The outline is authored in pixels and holds its weight here — the terrain
      does not, which is what these are for.
    </p>
    <div class="canvas sizes">
      {#each trueSizes as px (px)}
        <div class="member">
          <PlanetView
            visual={planetLab.current}
            {px}
            frame={2.5}
            backgroundToken="--surface"
          />
          <span class="spec">{px}px</span>
        </div>
      {/each}
    </div>
  </section>

  <section id="souls">
    <h2>Souls — orbits</h2>
    <p class="note">
      One cohort is a band of orbits, not a ring: each soul runs its own, scattered in
      radius, inclination and node, so the group reads as a clump of paths. Bands
      alternate inclination and turn opposite ways with it. Two inks by place — ink off
      the body, paper in front of it — and <b>nothing behind it</b>, decided per fragment
      so a dot on the silhouette is cut in half rather than switched off whole. Place
      cannot know what is <i>under</i> a dot, so each also carries a <code>ring</code> in
      the ramp's far end.
    </p>
    <div class="canvas strip">
      <div class="member">
        <PlanetView visual={planetLab.current} px={420} frame={swarmFrame} swarm={swarmLab.current} {cohorts} />
        <span class="spec">{cohorts.length} cohorts · {cohorts.reduce((n, c) => n + c, 0)} souls</span>
      </div>
      <div class="member">
        <PlanetView visual={planetLab.current} px={200} frame={swarmFrame} swarm={swarmLab.current} cohorts={cohorts.slice(0, 1)} />
        <span class="spec">one cohort</span>
      </div>
      <div class="member">
        <PlanetView visual={planetLab.current} px={200} frame={swarmFrame} swarm={swarmLab.current} cohorts={cohorts.slice(0, 2)} />
        <span class="spec">two</span>
      </div>
    </div>
    <div class="canvas sizes">
      {#each trueSizes as px (px)}
        <div class="member">
          <PlanetView
            visual={planetLab.current}
            {px}
            frame={swarmFrame}
            backgroundToken="--surface"
            swarm={swarmLab.current}
            {cohorts}
          />
          <span class="spec">{px}px</span>
        </div>
      {/each}
    </div>
  </section>

  <section id="anchors">
    <h2>Anchors — the harness poles</h2>
    <p class="note">
      Solids driven into the surface, standing where <i>n</i> points on a sphere go when
      they push each other as far apart as they can — the count alone names the figure, so
      nothing is authored per world. Two states: <b>placed</b> is the fill and its edges,
      <b>unplaced</b> the same edges dashed and hollow. The base reads
      <code>field.sampleRadius</code>, so an anchor stands on the terrain rather than on
      the sphere the terrain was displaced from.
    </p>
    <div class="canvas strip">
      <div class="member">
        <PlanetView
          visual={planetLab.current}
          px={420}
          anchors={anchorLab.current}
          {anchored}
        />
        <span class="spec">
          {anchorLab.size.placed} of {anchorLab.size.count} placed
        </span>
      </div>
      <div class="member">
        <PlanetView
          visual={planetLab.current}
          px={200}
          frame={swarmFrame}
          anchors={anchorLab.current}
          {anchored}
          swarm={swarmLab.current}
          {cohorts}
        />
        <span class="spec">with souls</span>
      </div>
    </div>
    <div class="canvas strip">
      {#each figures as count (count)}
        <div class="member">
          <PlanetView
            visual={planetLab.current}
            px={160}
            anchors={anchorLab.current}
            anchored={Array.from({ length: count }, () => true)}
          />
          <span class="spec">{count}</span>
        </div>
      {/each}
    </div>
    <div class="canvas sizes">
      {#each trueSizes as px (px)}
        <div class="member">
          <PlanetView
            visual={planetLab.current}
            {px}
            frame={2.5}
            backgroundToken="--surface"
            anchors={anchorLab.current}
            {anchored}
          />
          <span class="spec">{px}px</span>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h2>Swarm — existing</h2>
    <p class="note">Perspective, stencil-inverted dots. Predates the planet work.</p>
    <div class="canvas">
      <div class="viewport">
        <Canvas>
          <Scene />
        </Canvas>
        <div class="overlay">
          <DotTypePreview />
        </div>
      </div>
    </div>
  </section>
</div>

<LabRail side="right">
  <PlanetLabPanel />
</LabRail>

<LabRail side="left">
  <SwarmLabPanel />
  <AnchorLabPanel />
</LabRail>

<style>
  .viewport {
    position: relative;
  }
  .overlay {
    position: absolute;
    top: var(--sp-3);
    left: var(--sp-3);
    z-index: 10;
  }
  .page {
    /* The two labs' width on top of the reading measure, so the page keeps it. */
    max-width: 1516px;
    margin: 0 auto;
    /* A lab down each side, so the page keeps clear of both. */
    padding: var(--sp-6) 21rem 96px 21rem;
    display: flex;
    flex-direction: column;
    gap: 44px;
    overflow-y: auto;
  }

  header {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    border-bottom: var(--rule-strong);
    padding-bottom: var(--sp-3);
  }

  h1 {
    font-size: var(--fs-display);
    font-weight: 600;
    letter-spacing: -.02em;
    margin: 0;
  }

  header p {
    font-size: var(--fs-base);
    color: var(--ink-700);
    margin: 0;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }

  h2 {
    font-size: var(--fs-sm);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    font-weight: 700;
    border-bottom: var(--rule-section);
    padding-bottom: var(--sp-1);
    margin: 0;
  }

  .note {
    font-size: var(--fs-sm);
    color: var(--ink-400);
    margin: 0;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--fs-sm);
  }

  .canvas {
    background: var(--canvas);
    padding: var(--sp-4);
  }

  .subject {
    display: flex;
    justify-content: center;
  }

  .strip,
  .sizes {
    display: flex;
    gap: var(--sp-4);
    flex-wrap: wrap;
  }

  .sizes {
    align-items: flex-end;
  }

  .member {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-2);
  }

  .spec {
    font-size: var(--fs-xs);
    color: var(--ink-300);
    font-variant-numeric: tabular-nums;
  }
</style>

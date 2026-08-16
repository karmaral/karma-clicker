<script lang="ts">
  import { Label } from '$ui';
  import AnchorLabPanel from './AnchorLabPanel.svelte';
  import HarnessLabPanel from './HarnessLabPanel.svelte';
  import LabRail from './LabRail.svelte';
  import PlanetLabPanel from './PlanetLabPanel.svelte';
  import PulseLabPanel from './PulseLabPanel.svelte';
  import SwarmLabPanel from './SwarmLabPanel.svelte';
  import { PlanetView } from './planet';
  import { anchorLab } from './anchor-lab.svelte';
  import { harnessLab } from './harness-lab.svelte';
  import { planetLab } from './planet-lab.svelte';
  import { pulseLab } from './pulse-lab.svelte';
  import { swarmLab } from './swarm-lab.svelte';

  /**
   * Shipping sizes, coarsened. Four rows draw this list, so every entry costs four
   * WebGL contexts — 40 and 56 were dropped as the two that read the same.
   */
  const trueSizes = [80, 120, 180];

  /** Souls per cohort, off the lab's sliders. One dot is one soul at these counts. */
  const cohorts = $derived(swarmLab.counts);

  /** One flag per anchor, off the lab's two sliders. */
  const anchored = $derived(anchorLab.anchored);

  /** Every count at once, all placed — the figures side by side. */
  const figures = [2, 3, 4, 5, 6, 7, 8];

  /** The harness from its first anchor up. One is the case with no pair in it. */
  const strungCounts = [1, 2, 3, 4, 6, 8];

  /** Rim-hugging orbits still need more room than a bare body. */
  const swarmFrame = 3.2;

  /** The outermost loop stands a quarter of a radius off the surface. */
  const harnessFrame = 3.2;

  /** The halo is meant to leave the frame, so this only decides how long it takes. */
  const pulseFrame = 3.2;
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
      this is the only view that catches it. The last three are specimens for <code>ridge</code>,
      <code>strata</code> and the caps, not worlds.
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

  <section id="harness">
    <h2>Harness — the lines between</h2>
    <p class="note">
      Every placed anchor carries a <b>crown</b> — loops closing on the anchor itself,
      which <code>reach</code> opens from a tuft at the low end to the full cage at π/2 —
      and the crowns are connected by the pairs short enough to be <b>edges</b> of the
      figure the anchors stand on. <code>Link span</code> is how long a pair may be as a
      multiple of the closest one, so the top of that slider is every pair strung: the
      figure's complete graph, which is what turns eight anchors into a scribble. Each
      link carries a family of loops, a true arc bulged outward and turned about the
      chord; the twist is not optional, since a planar loop collapses to a straight
      needle every time it turns edge-on. Every line is tied to the <b>tip</b> of its
      pole rather than to the ground at its foot, so the solids hold the harness up
      instead of standing beside it — and only the ends lift, so a raised anchor does not
      carry the whole cage out of frame with it. Ink is by place — paper over the body,
      ink off it — stepping toward the middle of the ramp to say <i>behind</i>, and again
      to sink the outer loops into what they sit on; <code>Behind hidden</code> drops the
      far side outright, cut at the same silhouette the ink switches at. No depth test and
      no other lighting in it.
    </p>
    <div class="canvas strip">
      <div class="member">
        <PlanetView
          visual={planetLab.current}
          px={420}
          frame={harnessFrame}
          anchors={anchorLab.current}
          {anchored}
          harness={harnessLab.current}
        />
        <span class="spec">
          {anchorLab.size.placed} of {anchorLab.size.count} placed
        </span>
      </div>
      <div class="member">
        <PlanetView
          visual={planetLab.current}
          px={420}
          frame={harnessFrame}
          anchors={anchorLab.current}
          {anchored}
          harness={harnessLab.current}
          swarm={swarmLab.current}
          {cohorts}
        />
        <span class="spec">{swarmLab.riders} of {swarmLab.souls} riding</span>
      </div>
    </div>
    <p class="note">
      <code>Riders</code> is the share of the swarm on the lines, and a share is a
      count — each rider is fully on its loop and the rest run their own orbits. A soul
      reads its loop at the phase it was already at, so joining the harness changes where
      it is and not how fast it goes. The swarm sits outside the world's spin and the
      harness inside it, which is why the scene keeps one angle and hands it to both.
    </p>
    <div class="canvas strip">
      {#each strungCounts as count (count)}
        <div class="member">
          <PlanetView
            visual={planetLab.current}
            px={160}
            frame={harnessFrame}
            anchors={anchorLab.current}
            anchored={Array.from({ length: count }, () => true)}
            harness={harnessLab.current}
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
            frame={harnessFrame}
            backgroundToken="--surface"
            anchors={anchorLab.current}
            {anchored}
            harness={harnessLab.current}
          />
          <span class="spec">{px}px</span>
        </div>
      {/each}
    </div>
  </section>

  <section id="pulse">
    <h2>Pulse — the click</h2>
    <p class="note">
      <b>Click a world in this section.</b> One click is one <b>flash</b>, and it leaves two
      marks. The <b>halo</b> is a ring around the whole world, facing the camera and outside
      both the tilt and the spin, born just off the silhouette and growing past the frame —
      so it reads as something leaving rather than as a band drawn on the body. Its stroke
      is authored in <b>pixels</b>, like the outline and the contour, so it holds its weight
      the whole way out. The <b>sparks</b> are struck at random directions and sit at
      <code>field.sampleRadius</code>, on the terrain rather than on the sphere it was
      displaced from, inside the spin so they travel with the ground — a white dot with a
      ring leaving its edge. They carry <b>no silhouette test at all</b>: a flash on the far
      side shows through the world, which is the one place this medium's ink rule is
      deliberately not applied. Both fade on alpha rather than by stepping along the ramp,
      the other place it is bent, and both live in one instanced draw apiece, so a fast
      clicker stacks thirty-two of them without mounting anything.
    </p>
    <div class="canvas strip">
      <div class="member">
        <PlanetView
          visual={planetLab.current}
          px={420}
          frame={pulseFrame}
          pulse={pulseLab.current}
        />
        <span class="spec">the body alone</span>
      </div>
      <div class="member">
        <PlanetView
          visual={planetLab.current}
          px={420}
          frame={pulseFrame}
          pulse={pulseLab.current}
          swarm={swarmLab.current}
          {cohorts}
          anchors={anchorLab.current}
          {anchored}
          harness={harnessLab.current}
        />
        <span class="spec">over everything</span>
      </div>
    </div>
    <div class="canvas sizes">
      {#each trueSizes as px (px)}
        <div class="member">
          <PlanetView
            visual={planetLab.current}
            {px}
            frame={pulseFrame}
            backgroundToken="--surface"
            pulse={pulseLab.current}
          />
          <span class="spec">{px}px</span>
        </div>
      {/each}
    </div>
  </section>
</div>

<LabRail side="right">
  <PlanetLabPanel />
</LabRail>

<LabRail side="left">
  <SwarmLabPanel />
  <AnchorLabPanel />
  <HarnessLabPanel />
  <PulseLabPanel />
</LabRail>

<style>
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

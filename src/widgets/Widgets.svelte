<script lang="ts">
  import { Label } from '$ui';
  import AnchorLabPanel from './AnchorLabPanel.svelte';
  import HarnessLabPanel from './HarnessLabPanel.svelte';
  import LabRail from './LabRail.svelte';
  import PlanetLabPanel from './PlanetLabPanel.svelte';
  import PulseLabPanel from './PulseLabPanel.svelte';
  import SwarmLabPanel from './SwarmLabPanel.svelte';
  import { PlanetStill, PlanetView } from './planet';
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

  /**
   * Row sizes, well below anything looked at before. These are snapshots rather
   * than live views, so the whole grid is forty-five pictures at no standing
   * cost — the reason `trueSizes` had to be coarsened does not apply here.
   */
  const stillSizes = [32, 40, 48, 56, 64];

  /**
   * Framing is world units across the short axis, so the body takes `2 / frame`
   * of the box — 74% at 2.7, 91% at 2.2. Making the planet bigger costs no
   * pixels, which is the first thing to try if a silhouette does not read.
   */
  let stillFrame = $state(2.4);

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

  /**
   * The jump bar, authored beside the sections rather than scraped off them —
   * a section without a line here is one that cannot be reached, which is the
   * failure worth being told about at the source.
   */
  const sections = [
    { id: 'subject', label: 'Subject' },
    { id: 'family', label: 'Family' },
    { id: 'true-size', label: 'True size' },
    { id: 'stills', label: 'Stills' },
    { id: 'souls', label: 'Souls' },
    { id: 'anchors', label: 'Anchors' },
    { id: 'harness', label: 'Harness' },
    { id: 'pulse', label: 'Pulse' },
  ];
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

  <nav class="jump">
    {#each sections as section (section.id)}
      <a href="#{section.id}">{section.label}</a>
    {/each}
  </nav>

  <section id="subject">
    <h2>Planet — subject</h2>
    <p class="note">
      Orthographic, no lights. The bands are a view fresnel — how far a facet turns from
      the screen — plus the terrain height, normalised so <code>land</code> reads as the
      share of the ramp the terrain owns. Both weights at zero leaves a flat fill and
      the outline.
    </p>
    <div class="canvas subject">
      <PlanetView visual={planetLab.current} widthPx={420} />
    </div>
  </section>

  <section id="family">
    <h2>Planet — family</h2>
    <p class="note">
      All worlds at once. Planets authored one at a time come out as unrelated illustrations;
      this is the only view that catches it. The last three are specimens for <code>ridge</code>,
      <code>strata</code> and the caps, not worlds.
    </p>
    <div class="canvas strip">
      {#each planetLab.ids as id (id)}
        <div class="member">
          <PlanetView visual={planetLab.drafts[id]} widthPx={200} />
          <span class="spec">{id}</span>
        </div>
      {/each}
    </div>
  </section>

  <section id="true-size">
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
            widthPx={px}
            frame={2.5}
            backgroundToken="--surface"
          />
          <span class="spec">{px}px</span>
        </div>
      {/each}
    </div>
  </section>

  <section id="stills">
    <h2>Planet — stills</h2>
    <p class="note">
      The family at list-row sizes, snapshots rather than live views: forty-five
      pictures through one WebGL context, which is the only way this page can show
      them at all. Two things stop being px-constant down here. <code>outline</code> is
      2 on every world and <code>bleed</code> is <code>outline / zoom</code>, so ink
      that is 0.8% of the radius at 400px is around 9% at 48 — chunky the way an icon
      is chunky, or too heavy, and this is the view that says which.
      <code>contour</code> is the other: 1–1.5px hairlines at 44px across may merge
      into one grey.
    </p>
    <p class="note">
      Nothing here is a change to the nine records. If it reads badly the answer is a
      still's own derivation — lower <code>contour</code>, retune <code>outline</code>.
    </p>
    <div class="frame-pick">
      <label for="still-frame">Frame</label>
      <input
        id="still-frame"
        type="range"
        min="1.9"
        max="3"
        step="0.05"
        value={stillFrame}
        oninput={(e) => (stillFrame = Number(e.currentTarget.value))}
      />
      <span class="spec">{stillFrame.toFixed(2)} · body at {Math.round((2 / stillFrame) * 100)}%</span>
    </div>
    <div class="canvas stills">
      {#each planetLab.ids as id (id)}
        <div class="still-row">
          <span class="spec name">{id}</span>
          {#each stillSizes as px (px)}
            <div class="member">
              <PlanetStill visual={planetLab.drafts[id]} widthPx={px} frame={stillFrame} />
              <span class="spec">{px}</span>
            </div>
          {/each}
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
        <PlanetView visual={planetLab.current} widthPx={420} frame={swarmFrame} swarm={swarmLab.current} {cohorts} />
        <span class="spec">{cohorts.length} cohorts · {cohorts.reduce((n, c) => n + c, 0)} souls</span>
      </div>
      <div class="member">
        <PlanetView visual={planetLab.current} widthPx={200} frame={swarmFrame} swarm={swarmLab.current} cohorts={cohorts.slice(0, 1)} />
        <span class="spec">one cohort</span>
      </div>
      <div class="member">
        <PlanetView visual={planetLab.current} widthPx={200} frame={swarmFrame} swarm={swarmLab.current} cohorts={cohorts.slice(0, 2)} />
        <span class="spec">two</span>
      </div>
    </div>
    <div class="canvas sizes">
      {#each trueSizes as px (px)}
        <div class="member">
          <PlanetView
            visual={planetLab.current}
            widthPx={px}
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
          widthPx={420}
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
          widthPx={200}
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
            widthPx={160}
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
            widthPx={px}
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
          widthPx={420}
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
          widthPx={420}
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
      reads its loop at the phase it was already at, <b>rescaled by how much shorter the
      loop is than the orbit it left</b>: a loop is a fraction of an orbit's circumference,
      so at the raw phase a rider crawled. At four anchors it ran at 22% to 36% of its own
      speed. What is held constant is the thing the eye measures — distance per second —
      so joining the harness changes where a soul is and not how fast it goes. The swarm
      sits outside the world's spin and the harness inside it, which is why the scene keeps
      one angle and hands it to both.
    </p>
    <div class="canvas strip">
      {#each strungCounts as count (count)}
        <div class="member">
          <PlanetView
            visual={planetLab.current}
            widthPx={160}
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
            widthPx={px}
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
      marks. The <b>halo</b> is a pair of rings around the whole world, facing the camera and
      outside both the hold and the spin, born just off the silhouette and growing past the
      frame — so it reads as something leaving rather than as a band drawn on the body. It
      carries <b>no ink at all</b>: it <b>inverts</b> what it crosses, so a soul under it goes
      pale, the canvas goes dark, and the mark cannot be the wrong tone for its background.
      Fading is inverting less. The body stops it outright — a halo is always <i>behind</i>
      the world, cut at the same silhouette the harness is. The second ring, the <b>echo</b>,
      is the only thing here that is not a circle: its radius is warped by three sines that
      do not divide, and it inverts only as deep as <code>Depth</code> asks. Every flash
      turns that warp by a random angle and draws its own lobe count off
      <code>Scatter</code>, so two clicks in a row leave two different rings out of one
      authored shape — the count and not the warp, because the quad is sized off the warp.
      The <b>sparks</b> are struck at random directions and sit at
      <code>field.sampleRadius</code>, inside the spin so they travel with the ground. The
      dot and its ring now <b>lie in the terrain</b> rather than facing the camera, so a
      spark near the limb foreshortens into the surface; the <b>flare</b> is two quads
      crossed about the surface normal and widened at the base, standing on the dot and
      <b>travelling</b> between its two heights and its two tapers as it goes. The
      cross vanishes seen straight down its own axis, which is exactly where the ring is
      seen full-on — the two cover each other's worst angle. They carry <b>no silhouette
      test</b>: a flash on the far side shows through the world, which is the one place this
      medium's ink rule is deliberately not applied. What the silhouette <i>does</i> decide is
      the ink, which <b>inverts</b> past it; how far <i>back</i> a mark is decides its weight,
      which is <code>Far side</code>. The dot, its ring and both blades are flattened onto
      <b>one depth plane</b> at the near clip and drawn strictly nearest-first, so they come
      out as a single silhouette instead of a stack of overlaps compounding into a bruise.
      All of it lives in one instanced draw per mark, so a fast clicker stacks thirty-two
      without mounting anything.
    </p>
    <div class="canvas strip">
      <div class="member">
        <PlanetView
          visual={planetLab.current}
          widthPx={420}
          frame={pulseFrame}
          pulse={pulseLab.current}
        />
        <span class="spec">the body alone</span>
      </div>
      <div class="member">
        <PlanetView
          visual={planetLab.current}
          widthPx={420}
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
            widthPx={px}
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
    /* Clear of the jump bar, which is what a jump would otherwise land under. */
    scroll-margin-top: 3.5rem;
  }

  /* Sticky against `.page`, which is the scroller here and not the document.
     On `--surface` rather than the page's own `--canvas`, so it reads as a bar
     over the sections passing under it instead of merging with them. */
  .jump {
    position: sticky;
    top: calc(var(--sp-4) * -1);
    z-index: 30;
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1) var(--sp-4);
    background: var(--surface);
    border-bottom: var(--rule-strong);
    padding: var(--sp-2) var(--sp-3);
    /* The page's own 44px gap would leave a band of canvas under the bar. */
    margin-bottom: -32px;
  }

  .jump a {
    font-size: var(--fs-label-sm);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    font-weight: 700;
    color: var(--ink-400);
    text-decoration: none;
  }

  .jump a:hover {
    color: var(--ink-900);
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

  .frame-pick {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .stills {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }

  /* Baseline-aligned, so the sizes step up from one line rather than a centre. */
  .still-row {
    display: flex;
    align-items: flex-end;
    gap: var(--sp-4);
  }

  .still-row .name {
    width: 5rem;
    flex: none;
    text-align: right;
    color: var(--ink-500);
  }
</style>

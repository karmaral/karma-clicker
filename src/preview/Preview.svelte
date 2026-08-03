<script lang="ts">
  import {
    Badge, Button, Card, Cell, Chip, ChipQueue, Figure,
    HeaderBand, Label, Meter, Tabs, Rail, Value,
  } from '$ui';
  import type { BadgeKind, ChipState, FigureSize, LabelSize, MeterTick } from '$ui';
  import {
    ExperienceModule, InertiaModule, KarmaModule, ManualModule,
  } from '$features/header';
  import { GroupsSection, PlanetSection } from '$features/closeup';
  import type { Group, Stage } from '$features/closeup';

  let buyMode = $state('100');

  let groups = $state<Group[]>([
    {
      id: 'basic', count: '12', name: 'Basic probe',
      description: "Doesn't know much. Kinda just being.",
      milestone: 70, aim: 1, lean: 'Positive', aimNote: 'Re-aiming · 2 cycles left · −8 xp',
      output: { kind: 'pos', amount: '4', unit: '/s' }, cost: { kind: 'pos', amount: '26', affordable: true },
    },
    {
      id: 'steady', count: '4', name: 'Steady probe',
      description: 'Takes longer but yields considerably more.',
      milestone: 35, aim: 1, lean: 'Positive', aimNote: 'Re-aiming · 2 cycles left · −8 xp',
      output: { kind: 'pos', amount: '80', unit: '/s' }, cost: { kind: 'pos', amount: '320', affordable: true },
    },
    {
      id: 'chaos', count: '1', name: 'Chaos probe',
      description: 'Draws polarity at random — cannot be aimed.',
      aim: 0, lean: 'Neutral', aimNote: 'Unaimable — that is the point',
      unaimable: true, output: { kind: 'both', amount: '10', unit: '/s' }, cost: { kind: 'pos', amount: '68' },
    },
    {
      id: 'zealot', count: '0', name: 'Zealot probe',
      description: 'Whatever you aim it at, it goes all the way.',
      aim: 2, lean: 'Hard positive', aimNote: 'Re-aiming · 2 cycles left · −8 xp',
      output: { kind: 'pos', amount: '0', unit: '/s' }, cost: { kind: 'pos', amount: '10k' },
    },
    {
      id: 'refiner', count: '0', name: 'Crimson Refiner',
      description: 'Makes tokens directly. Karma free.',
      aim: -1, lean: 'Negative', aimNote: 'Re-aiming · 2 cycles left · −8 xp',
      output: { kind: 'red', amount: '0', unit: '/s' }, cost: { kind: 'red', amount: '50' },
    },
  ]);

  function setAim(id: string, value: number) {
    const group = groups.find((g) => g.id === id);
    if (group) group.aim = value;
  }

  function buy(id: string) {
    const group = groups.find((g) => g.id === id);
    if (group?.cost.affordable) group.count = String(Number(group.count) + 1);
  }

  let cycles = $state(4);
  let wavePos = $state(0.19);

  const planetStages = $derived(
    Array.from({ length: cycles * 2 }, (_, i): Stage => ({
      kind: i % 2 === 0 ? 'light' : 'dense',
      at: `${i * 25} xp`,
    }))
  );

  const currentStage = $derived(
    Math.min(planetStages.length - 1, Math.floor(wavePos * planetStages.length))
  );

  const waveStatus = $derived.by(() => {
    const stage = planetStages[currentStage];
    const next = planetStages[currentStage + 1];
    const flips = next ? ` · flips ${next.kind} at ${next.at}` : ' · last stage';
    return `Stage ${currentStage + 1} of ${planetStages.length} · ${stage.kind}${flips}`;
  });

  const inertiaTicks: MeterTick[] = [{ at: 20 }, { at: 60, strong: true }];

  const upgrades: { label: string; cost?: string; state: ChipState }[] = [
    { label: 'More cause means more effect', cost: '15 karma', state: 'affordable' },
    { label: 'An easier way', cost: '200 xp', state: 'affordable' },
    { label: 'Free Wilderness', cost: '50 karma', state: 'unlocked' },
    { label: 'A singular purpose', cost: '10k karma', state: 'unlocked' },
    { label: 'Nothing is lost', cost: '24k karma', state: 'unlocked' },
    { label: '3 approaching', state: 'approaching' },
  ];

  const views = ['Close-up', 'Overview', 'Refining'] as const;
  let view = $state<string>('Close-up');

  let incarnation = $state(0);
  $effect(() => {
    const id = setInterval(() => { incarnation = (incarnation + 1.5) % 100; }, 55);
    return () => clearInterval(id);
  });

  const badges: { kind: BadgeKind; name: string }[] = [
    { kind: 'xp', name: 'Experience' },
    { kind: 'red', name: 'Red token' },
    { kind: 'yellow', name: 'Yellow token' },
    { kind: 'blue', name: 'Blue token' },
    { kind: 'pos', name: 'Karma +' },
    { kind: 'neg', name: 'Karma −' },
    { kind: 'both', name: 'Both karmas' },
    { kind: 'any', name: 'Any karma' },
  ];

  const labelSizes: { size: LabelSize; spec: string }[] = [
    { size: 'default', spec: '10px / 600 / .16em' },
    { size: 'sm', spec: '9.5px / 700 / .14em' },
  ];

  const figureSizes: { size: FigureSize; spec: string }[] = [
    { size: 'xl', spec: '--fs-xl · 26px' },
    { size: 'lg', spec: '--fs-lg · 19px' },
    { size: 'md', spec: '--fs-md · 15px' },
    { size: 'base', spec: '--fs-base · 13px' },
  ];
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Encode+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page">

  <header>
    <Label text="Karma clicker — presentational layer" />
    <h1>Preview</h1>
    <p>Every component in <code>src/ui/</code>, rendered in isolation.</p>
  </header>

  <section>
    <h2>Badge</h2>
    <div class="grid">
      {#each badges as { kind, name } (kind)}
        <div class="swatch">
          <div class="swatch-mark"><Badge {kind} /></div>
          <div class="swatch-meta">
            <span class="name">{name}</span>
            <span class="spec">kind="{kind}"</span>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h2>Label</h2>
    <div class="rows">
      {#each labelSizes as { size, spec } (size)}
        <div class="row">
          <span class="row-key">size="{size}"</span>
          <Label text="Learning tokens" {size} />
          <span class="spec">{spec}</span>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h2>Figure</h2>
    <div class="rows">
      {#each figureSizes as { size, spec } (size)}
        <div class="row">
          <span class="row-key">size="{size}"</span>
          <Figure value="34.05k" {size} />
          <span class="spec">{spec}</span>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h2>Value</h2>
    <div class="rows">
      <div class="row">
        <span class="row-key">xl</span>
        <Value kind="xp" value="34.05k" />
        <span class="spec">badge + figure, gap 7px</span>
      </div>
      <div class="row">
        <span class="row-key">md</span>
        <Value kind="red" value="18" size="md" />
        <span class="spec">token cells run smaller</span>
      </div>
    </div>
  </section>

  <section>
    <h2>Meter</h2>
    <div class="rows">
      <div class="row">
        <span class="row-key">fill="ink"</span>
        <Meter value={53} ticks={inertiaTicks} />
        <span class="spec">inertia 53% · ticks 20 / 60</span>
      </div>
      <div class="row">
        <span class="row-key">fill="pos"</span>
        <Meter value={22} fill="pos" />
        <span class="spec">comfort 22%</span>
      </div>
      <div class="row">
        <span class="row-key">fill="neg"</span>
        <Meter value={31} fill="neg" />
        <span class="spec">burden 31%</span>
      </div>
      <div class="row">
        <span class="row-key">height="6px"</span>
        <Meter value={70} height="6px" />
        <span class="spec">milestone bar</span>
      </div>
      <div class="row">
        <span class="row-key">height="2px"</span>
        <Meter value={64} height="2px" />
        <span class="spec">cycle bar</span>
      </div>
    </div>
  </section>

  <section>
    <h2>Button</h2>
    <p class="note">
      Hover the filled button — it takes the experience hue, because that is what it
      produces. The sweep is the same green running as the incarnation completes.
    </p>
    <div class="btns">
      <Button label="Incarnate" sub="+3.1 xp · 3.6s" />
      <Button label="Send probe" sub="3.0s" variant="outline" />
      <Button label="Incarnate" sub="+3.1 xp · 3.6s" disabled />
      <Button label="Send probe" sub="3.0s" variant="outline" disabled />
      <Button label="Incarnate" sub="+3.1 xp · 3.6s" progress={45} />
      <Button label="Incarnate" sub="+3.1 xp · 3.6s" progress={incarnation} />
    </div>
  </section>

  <section>
    <h2>Chip</h2>
    <p class="note">
      A reveal ladder: affordable, unlocked but not yet affordable, then a single aggregate
      chip for what you are close to revealing. Anything further off is not shown at all, and
      purchased upgrades leave the queue entirely.
    </p>
    <div class="chips-demo">
      <Chip label="Affordable" cost="15 karma" />
      <Chip label="Unlocked" cost="50 karma" state="unlocked" />
      <Chip label="3 approaching" state="approaching" />
    </div>
  </section>

  <section>
    <h2>Cell</h2>
    <p class="note">Reproduces the resource cell row from Design System §6.</p>
    <div class="band">
      <Cell label="Experience">
        <Value kind="xp" value="34.05k" />
      </Cell>
      <Cell label="Karma +">
        <Value kind="pos" value="6.9k" />
      </Cell>
      <Cell label="Karma −">
        <Value kind="neg" value="1.2k" />
      </Cell>
      <Cell label="Learning tokens" gap="var(--sp-3)">
        <Value kind="red" value="18" size="md" />
        <Value kind="yellow" value="7" size="md" />
        <Value kind="blue" value="2" size="md" />
      </Cell>
    </div>
  </section>

  <section>
    <h2>Card + HeaderBand + Rail</h2>
    <p class="note">
      Structure only. Cells abut with <code>--line-100</code> verticals; labels share a
      grid row so they align regardless of what each module holds below. The nav sits in
      the rail beneath the band, alongside the upgrade queue.
    </p>
    <div class="control">
      <label for="wave-pos">Wave position</label>
      <input
        id="wave-pos"
        type="range"
        min="0"
        max="0.999"
        step="0.001"
        bind:value={wavePos}
      />
      <span class="spec num">{wavePos.toFixed(3)} · stage {currentStage + 1}</span>
    </div>
    <div class="control">
      <label for="wave-cycles">Cycles</label>
      <input
        id="wave-cycles"
        type="range"
        min="1"
        max="32"
        step="1"
        bind:value={cycles}
      />
      <span class="spec num">{cycles} cycles · {cycles * 2} stages</span>
    </div>
    <div class="canvas">
      <Card>
        <HeaderBand columns="1.25fr 4fr 2.5fr 1.75fr">
          <ExperienceModule amount="40" caption="+3.1 each" banded />
          <KarmaModule
            negative={{ amount: '3.14k', rate: '+31/s', bar: 45 }}
            positive={{ amount: '6.90k', rate: '+84/s', bar: 100 }}
            banded
          />
          <InertiaModule
            comfort={{ value: 22, label: '22%' }}
            burden={{ value: 31, label: '31%' }}
            fading="fading 0.4%/s"
            banded
          >
            {#snippet consequence()}
              Cycles <b>+12%</b> slower · wave flattened <b>9%</b>
            {/snippet}
          </InertiaModule>
          <ManualModule sub="+3.1 xp · 3.6s" banded />
        </HeaderBand>
        <Rail>
          <Tabs tabs={views} active={view} onselect={(v) => (view = v)} />
          <div class="upgrades">
            <div class="upgrades-head">
              <Label text="Upgrades" />
              <span class="caption">8 more coming</span>
            </div>
            <ChipQueue escape="all 48 →">
              {#each upgrades as u (u.label)}
                <Chip label={u.label} cost={u.cost} state={u.state} />
              {/each}
            </ChipQueue>
          </div>
        </Rail>
        <PlanetSection
          name="A regular planet"
          status={waveStatus}
          stages={planetStages}
          current={currentStage}
          position={wavePos}
          flattened="flattened 9% by comfort"
          note="Aim your groups now — re-aiming takes three cycles, so commit before the flip."
        />
        <GroupsSection
          {groups}
          {buyMode}
          onbuymode={(m) => (buyMode = m)}
          onaim={setAim}
          onbuy={buy}
          note="Aiming costs experience and takes three cycles — commit before the stage flips, not after."
        />
      </Card>
    </div>
  </section>

</div>

<style>
  .page {
    max-width: 1180px;
    margin: 0 auto;
    padding: var(--sp-6) var(--sp-5) 96px;
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

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--fs-sm);
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

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--sp-3);
  }

  .swatch {
    background: var(--surface);
    border: var(--rule-card);
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-3);
  }

  .swatch-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex: none;
  }

  .swatch-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .name {
    font-size: var(--fs-sm);
    font-weight: 600;
  }

  .rows {
    background: var(--surface);
    border: var(--rule-card);
    display: flex;
    flex-direction: column;
  }

  .row {
    display: grid;
    grid-template-columns: 120px 1fr 220px;
    gap: var(--sp-4);
    align-items: center;
    padding: var(--sp-3);
    border-bottom: var(--rule-row);
  }

  .row:last-child {
    border-bottom: none;
  }

  .row-key {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--fs-xs);
    color: var(--ink-400);
  }

  .spec {
    font-size: var(--fs-xs);
    color: var(--ink-300);
    font-variant-numeric: tabular-nums;
  }

  .band {
    background: var(--surface);
    border: var(--rule-card);
    display: flex;
    gap: var(--sp-6);
    align-items: flex-start;
    flex-wrap: wrap;
    padding: var(--sp-4);
  }

  .canvas {
    background: var(--canvas);
    padding: var(--sp-4);
  }

  .control {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    background: var(--surface);
    border: var(--rule-card);
    padding: var(--sp-3);
  }

  .control label {
    font-size: var(--fs-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    font-weight: 600;
    color: var(--ink-400);
    flex: none;
  }

  .control input {
    flex: 1;
    min-width: 0;
    accent-color: var(--ink-900);
  }

  .stub {
    background: var(--line-100);
    width: 100%;
  }

  .body {
    padding: var(--sp-4);
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }

  .chips-demo {
    display: flex;
    gap: var(--sp-2);
    flex-wrap: wrap;
    background: var(--surface);
    border: var(--rule-card);
    padding: var(--sp-4);
  }

  .upgrades {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    flex: 1;
    min-width: 0;
  }

  .upgrades-head {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    flex: none;
  }

  .caption {
    font-size: var(--fs-xs);
    color: var(--ink-300);
  }

  .btns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--sp-3);
    align-items: start;
  }

</style>

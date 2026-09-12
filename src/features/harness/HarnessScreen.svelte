<script lang="ts">
  /**
   * The rig, and who rides it. A tab rather than a takeover because nothing here
   * ends anything — this is where a system you own is configured, which is the
   * test `progression/keys.ts` states.
   *
   * The job itself is not run from here. Anchoring is begun and cancelled on the
   * world it acts on, and watched there while it goes down; this screen is what
   * the harness *is*, which is why the picture is a nameless body and not the
   * world you are standing on.
   */
  import { progression } from '$lib/progression';
  import { Section } from '$ui';
  import { harness } from '$lib/harness.svelte';
  import { f } from '$lib/utils';
  import RigStage from './RigStage.svelte';
  import LineTable from './LineTable.svelte';
  import JobStats from './JobStats.svelte';
</script>

{#if progression.isRevealed('nav.harness')}
  <div class="harness view-layout">
    <!-- One panel, not two: the stage and its figures share a heading the way
         the Details column does, so the column spends its height on the rig
         rather than on a second card's padding. -->
    <div class="rig">
      <Section label="The harness">
        {#snippet aside()}
          {f(harness.workers)} of {f(harness.slots)} slots
        {/snippet}

        <RigStage />
        <JobStats />
      </Section>
    </div>

    <div class="lines">
      <LineTable />
    </div>
  </div>
{/if}

<style>
  .rig {
    display: flex;
    flex-direction: column;
    border-right: var(--rule-card);
    min-width: 0;
  }

  /* The column's slack handed across the component seam, as Details does it —
     the Section is this column's only child and would otherwise hug the stage. */
  .rig > :global(.section) {
    flex: 1;
    min-height: 0;
  }

  .lines {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
</style>

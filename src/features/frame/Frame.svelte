<script lang="ts">
  import { Cell, HeaderBand, Rail, Value } from '$ui';
  import { ResourceManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { nav } from '$lib/nav.svelte';
  import { SCREENS, type ScreenName } from '$lib/labels';
  import { formatNumber } from '$lib/utils';
  import NavSection from './NavSection.svelte';
  import UpgradeRail from './UpgradeRail.svelte';

  const WIDTHS: Record<ScreenName, string> = {
    overview: '1.5fr',
    detail: '3fr',
    refinery: '2fr',
  };

  const visible = $derived(SCREENS.filter((screen) => nav.state(screen) !== 'absent'));
  const columns = $derived(visible.map((screen) => WIDTHS[screen]).join(' '));

  const experience = $derived(formatNumber(ResourceManager.getAmount('experience')));
  const posKarma = $derived(formatNumber(ResourceManager.getAmount('karma_positive')));
  const negKarma = $derived(formatNumber(ResourceManager.getAmount('karma_negative')));
</script>

<HeaderBand rule={false} {columns}>
  {#each visible as screen (screen)}
    <NavSection
      state={nav.state(screen)}
      active={nav.active === screen}
      onselect={() => nav.to(screen)}
    >
      <Cell label={nav.label(screen)} banded>
        {#if screen === 'overview'}
          <Value kind="xp" value={experience} />
        {:else if screen === 'detail'}
          {#if progression.isRevealed('reading.negKarma')}
            <Value kind="neg" value={negKarma} size="lg" />
          {/if}
          <Value kind="pos" value={posKarma} />
        {:else}
          <span class="pending">—</span>
        {/if}
      </Cell>
    </NavSection>
  {/each}
</HeaderBand>

<Rail>
  <UpgradeRail />
</Rail>

<style>
  .pending {
    font-size: var(--fs-xl);
    color: var(--ink-300);
  }
</style>

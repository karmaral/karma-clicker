<script lang="ts">
  /** A stub that knows its own reveal key, so unbuilt panels still accrete in order. */
  import { Stub } from '$ui';
  import { progression, type RevealKey } from '$lib/progression';

  interface Props {
    name: RevealKey;
    note?: string;
    height?: string;
  }

  let { name, note, height }: Props = $props();
</script>

{#if progression.isRevealed(name)}
  <Stub {name} {note} {height} inert={!progression.isLive(name)} />
{/if}

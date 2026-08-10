<script lang="ts">
  interface Props {
    negativeReach: number;
    positiveReach: number;
    lean: string;
  }

  let { negativeReach, positiveReach, lean }: Props = $props();

  const HALF = 50;

  const negative = $derived(negativeReach * HALF);
  const positive = $derived(positiveReach * HALF);
</script>

<div class="lean">
  <div class="track">
    <span class="side neg" style:right="{HALF}%" style:width="{negative}%"></span>
    <span class="side pos" style:left="{HALF}%" style:width="{positive}%"></span>
    <span class="zero"></span>
  </div>
  <span class="word">{lean}</span>
</div>

<style>
  .lean {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
    position: relative;
  }

  .track {
    position: relative;
    height: 12px;
    background: var(--surface-alt);
  }

  .side {
    position: absolute;
    top: 0;
    bottom: 0;
  }

  .side.neg {
    background: var(--hatch-neg);
  }

  .side.pos {
    background: var(--hatch-pos);
    box-shadow: var(--hatch-pos-edge);
  }

  .zero {
    position: absolute;
    top: -2px;
    bottom: -2px;
    left: 50%;
    width: 1px;
    margin-left: -0.5px;
    background: var(--ink-900);
  }

  .word {
    font-size: 10.5px;
    color: var(--ink-500);
    line-height: 1;
    text-align: center;
    position: absolute;
    left: 0;
    right: 0;
    bottom: -5px;
    translate: 0% 100%;
  }
</style>

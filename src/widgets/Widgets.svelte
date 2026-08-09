<script lang="ts">
  import { Label } from '$ui';
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte';
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
    <h2>Workbench</h2>
    <div class="canvas">
      <div class="viewport">
        <Canvas>
          <Scene />
        </Canvas>
      </div>
    </div>
  </section>
</div>

<style>
  .viewport {
    position: relative;
  }
  button {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    border: unset;
    background-color: transparent;
    cursor: pointer;
  }
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

  .canvas {
    background: var(--canvas);
    padding: var(--sp-4);
  }
</style>

<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { interactivity } from '@threlte/extras';
  import { cubicOut } from 'svelte/easing';
  import { Spring, Tween } from 'svelte/motion';
  import * as THREE from 'three';
  import RingParticle from './RingParticle.svelte';
    import ParticleSwarm from './ParticleSwarm.svelte';

  interactivity();
  const scale = new Spring(1, {
    stiffness: 0.35,
    damping: 0.45, 
  });

  let circleMeshRef: THREE.Mesh = $state();

  let ringParticles = $state([]);
  let nextRingId = 0;

  let swarmParticles = $state([]);
  let nextSwarmId = 0;

  function handleClick(event) {
    if (!circleMeshRef) return;
    
    circleMeshRef.scale.set(1.1, 1.1, 1.1);
    spawnRingParticle(event)
  }

  function spawnRingParticle(event) {
    const { x, y, z } = event.point;

    ringParticles.push({
      id: nextRingId++,
      position: [x, y, z],
    });
  }
  function removeRingParticle(id: number) {
    ringParticles = ringParticles.filter(p => p.id !== id);
  }

  function spawnSwarmParticle(event) {
    const { x, y, z } = event.point;

    swarmParticles.push({
      id: nextRingId++,
      position: [x, y, z],
    });
  }
  function removeSwarmParticle(id: number) {
    swarmParticles = swarmParticles.filter(p => p.id !== id);
  }

  useTask((delta) => {
    if (!circleMeshRef) return;

    const baseScale = 1.0;
    const stiffness = 8;

    circleMeshRef.scale.x = THREE.MathUtils.damp(circleMeshRef.scale.x, baseScale, stiffness, delta);
    circleMeshRef.scale.y = THREE.MathUtils.damp(circleMeshRef.scale.y, baseScale, stiffness, delta);
    circleMeshRef.scale.z = THREE.MathUtils.damp(circleMeshRef.scale.z, baseScale, stiffness, delta);
  });

</script>

<div class="planet-widget">
  <T.Group>
    <T.Mesh
      bind:ref={circleMeshRef}
      scale={scale.current}
      onpointerdown={handleClick}
    >
      <T.CircleGeometry args={[2, 64]} />
      <T.MeshBasicMaterial 
        color="black"
      />
    </T.Mesh>

    {#each ringParticles as rp (rp.id)}
      <RingParticle 
        onkill={() => removeRingParticle(rp.id)}
      />
      <ParticleSwarm 
        onkill={() => removeSwarmParticle(rp.id)}
      />
    {/each}

  </T.Group>
</div>

<style>
  .planet-widget {
    background: var(--ink-900);
  }
</style>
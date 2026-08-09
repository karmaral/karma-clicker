<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { Tween } from 'svelte/motion';
  import { circOut, cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  interface Props {
    position?: [number, number, number];
    onkill: () => void;
  }

  let { position = [0, 0, 0], onkill }: Props = $props();

  const count = 400; // Total circles per burst
  let meshRef: THREE.InstancedMesh | undefined = $state();
  
  // Use core scene data for billboard effect
  const { camera } = useThrelte();

  // 1. The Dummy Object (Used for matrix calculations)
  const dummy = new THREE.Object3D();

  // 2. Setup Physics Data (Initial explode velocities)
  const particles = Array.from({ length: count }, () => ({
    pos: new THREE.Vector3(0, 0, 0),
    vel: new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize().multiplyScalar(Math.random() * 0.12 + 0.02) // Speed randomization
  }));

  // 3. Simple Tween for shrinking/fading
  const globalScale = new Tween(1, { duration: 600, easing: circOut });
  const opacity = new Tween(1, { duration: 600, easing: circOut });
  
  onMount(() => {
    globalScale.set(0);
    opacity.set(0).then(onkill);
  });

  // 4. Animation Loop
  useTask(() => {
    if (!meshRef || !camera.current) return;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      
      // Move particles outward
      p.pos.add(p.vel);
      
      dummy.position.copy(p.pos);
      dummy.scale.setScalar(globalScale.current);
      
      // OPTIONAL: Billboard Effect. 
      // If you want the circles to ALWAYS face the camera flat:
      dummy.quaternion.copy(camera.current.quaternion);
      
      // If you want them to tumble randomly instead, comment out billboard and add:
      // dummy.rotation.x += p.vel.x * 2;
      // dummy.rotation.y += p.vel.y * 2;
      
      dummy.updateMatrix();
      meshRef.setMatrixAt(i, dummy.matrix);
    }
    
    // Sync the matrix to the GPU
    meshRef.instanceMatrix.needsUpdate = true;
  });
</script>

<T.InstancedMesh bind:ref={meshRef} args={[undefined, undefined, count]} {position}>
  
  <!-- 1. Geometry is a simple 2D Circle plane -->
  <!-- radius 0.1, segments 32 for smoothness -->
  <T.CircleGeometry args={[0.25, 32]} />
  
  <!-- 2. Material ignores all light -->
  <T.MeshBasicMaterial
    color="gray"
    transparent
    opacity={opacity.current}
    depthWrite={false}
    side={THREE.DoubleSide}
  />
</T.InstancedMesh>
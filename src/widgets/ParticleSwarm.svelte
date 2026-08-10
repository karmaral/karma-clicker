<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { DOT_TYPES, DOT_TYPE_KEYS, type DotType } from './dot-types';
  import { currentDots, dotCapacity, setDots } from './dots.svelte';

  interface Props {
    position?: [number, number, number];
    surge?: number;
  }

  let { position = [0, 0, 0], surge = 0 }: Props = $props();

  const count = dotCapacity;
  let grayMesh: THREE.InstancedMesh | undefined = $state();
  let invertMesh: THREE.InstancedMesh | undefined = $state();

  const { camera } = useThrelte();

  const dummy = new THREE.Object3D();

  const inkTones = ['#111111', '#555555', '#767676', '#8a8a8a', '#a3a3a3', '#c2c2c2'];

  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.3 + Math.pow(Math.random(), 0.7) * 3.0;
    const speed = (Math.random() * 0.3 + 0.05) * (Math.random() < 0.5 ? -1 : 1);
    const type: DotType = Math.random() < 0.6 ? 'normal' : 'big';

    return {
      angle,
      radius,
      speed,
      type,
      z: (Math.random() - 0.5) * 0.3,
      baseScale: 0.25 + Math.random() * 0.5,
      colorHex: inkTones[Math.floor(Math.random() * inkTones.length)],
      wobbleAmp: 0.1 + Math.random() * 0.25,
      wobbleFreq: 0.3 + Math.random() * 0.7,
      zAmp: 0.05 + Math.random() * 0.15,
      zFreq: 0.4 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
    };
  });

  let elapsed = 0;

  const fadeIn = new Tween(0, { duration: 1000, easing: cubicOut });
  onMount(() => {
    fadeIn.set(1);
    const counts: Partial<Record<DotType, number>> = {};
    for (const p of particles) {
      counts[p.type] = (counts[p.type] ?? 0) + 1;
    }
    setDots(counts);
  });

  const rippleSpeed = 3.5;
  const rippleSigma = 0.5;
  const rippleK = 2.2;
  const rippleAmp = 0.25;
  const rippleEnergyPerClick = 0.5;
  const rippleMaxEnergy = 1.2;
  const rippleDecay = 1.2;
  const rippleRange = 3.4;

  let rippleTime = -100;
  let rippleEnergy = 0;
  let lastSurge = 0;

  $effect(() => {
    if (surge > lastSurge) {
      if (rippleSpeed * (elapsed - rippleTime) > rippleRange) {
        rippleTime = elapsed;
      }
      rippleEnergy = Math.min(rippleMaxEnergy, rippleEnergy + rippleEnergyPerClick);
      lastSurge = surge;
    }
  });

  function rippleDisplacement(d: number) {
    return Math.cos(d * rippleK) * Math.exp(-(d * d) / (2 * rippleSigma * rippleSigma));
  }

  function rebalanceTypes() {
    const pool: DotType[] = [];
    let total = 0;
    for (const type of DOT_TYPE_KEYS) {
      const n = Math.max(0, Math.floor(currentDots[type] ?? 0));
      total += n;
      for (let i = 0; i < n; i++) pool.push(type);
    }
    if (total === 0) return;

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (let i = 0; i < count; i++) {
      particles[i].type = pool[i] ?? DOT_TYPE_KEYS[DOT_TYPE_KEYS.length - 1];
    }
  }

  $effect(() => {
    rebalanceTypes();
  });

  const color = new THREE.Color();

  $effect(() => {
    if (!grayMesh) return;

    particles.forEach((p, i) => {
      color.set(p.colorHex);
      grayMesh.setColorAt(i, color);
    });
    if (grayMesh.instanceColor) grayMesh.instanceColor.needsUpdate = true;
  });

  function updateSwarm(mesh: THREE.InstancedMesh | undefined) {
    if (!mesh || !camera.current) return;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const theta = p.angle + p.speed * elapsed;
      const wobble = 1 + Math.sin(elapsed * p.wobbleFreq + p.phase) * p.wobbleAmp;
      const z = p.z + Math.sin(elapsed * p.zFreq + p.phase) * p.zAmp;
      const waveRadius = rippleSpeed * (elapsed - rippleTime);
      const ripple = rippleAmp * rippleEnergy * rippleDisplacement(p.radius - waveRadius);

      dummy.position.set(
        Math.cos(theta) * p.radius * (1 + ripple) * wobble,
        Math.sin(theta) * p.radius * (1 + ripple) * wobble,
        z
      );
      dummy.scale.setScalar(p.baseScale * DOT_TYPES[p.type].scaleFactor * fadeIn.current);
      dummy.quaternion.copy(camera.current.quaternion);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }

  useTask((delta) => {
    elapsed += delta;
    rippleEnergy = Math.max(0, rippleEnergy * Math.exp(-rippleDecay * delta));
    updateSwarm(grayMesh);
    updateSwarm(invertMesh);
  });
</script>

<T.InstancedMesh bind:ref={grayMesh} args={[undefined, undefined, count]} {position} frustumCulled={false} renderOrder={1}>
  <T.CircleGeometry args={[0.25, 32]} />
  <T.MeshBasicMaterial color="white" depthTest={false} depthWrite={false} side={THREE.DoubleSide} />
</T.InstancedMesh>

<T.InstancedMesh bind:ref={invertMesh} args={[undefined, undefined, count]} {position} frustumCulled={false} renderOrder={2}>
  <T.CircleGeometry args={[0.25, 32]} />
  <T.MeshBasicMaterial
    color="white"
    depthTest={false}
    depthWrite={false}
    side={THREE.DoubleSide}
    stencilWrite
    stencilWriteMask={0}
    stencilFunc={THREE.EqualStencilFunc}
    stencilRef={1}
    stencilFuncMask={0xFF}
    stencilFail={THREE.KeepStencilOp}
    stencilZFail={THREE.KeepStencilOp}
    stencilZPass={THREE.KeepStencilOp}
  />
</T.InstancedMesh>

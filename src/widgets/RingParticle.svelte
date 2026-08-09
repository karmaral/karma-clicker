<script lang="ts">
  import { T } from '@threlte/core';
  import { Tween } from 'svelte/motion';
  import { circOut, cubicIn, cubicOut, linear, quadOut } from 'svelte/easing';
  import * as THREE from 'three';
  import { onMount } from 'svelte';

  interface Props {
    position?: [number, number, number],
    onkill?: () => void,
  }

  let { 
    position = [0, 0, -.1],
    onkill,
  }: Props = $props();

  const scale = new Tween(0.9, { duration: 1400, easing: circOut });
  const opacity = new Tween(1, { duration: 500, easing: cubicOut });

  onMount(() => {
    scale.set(2.5);
    
    opacity.set(0).then(() => {
      onkill();
    });
  });
</script>

<T.Mesh 
  scale={scale.current}
  {position}
>
  <T.RingGeometry args={[1.95, 2, 64]} />
  <T.MeshBasicMaterial
    color="black"
    transparent
    opacity={opacity.current}
    side={THREE.DoubleSide}
    depthWrite={false} 
  />
</T.Mesh>
<script lang="ts">
import PlanetWidget from "./PlanetWidget.svelte";
import { useThrelte } from '@threlte/core';
import * as THREE from 'three';

const { scene } = useThrelte();

const bg = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim() || '#f4f4f2';
scene.background = new THREE.Color(bg);

</script>


<PlanetWidget />

<style>

</style>

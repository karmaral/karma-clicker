<script lang="ts">
  import { T, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { buildAnchorSolid, placeAnchors, type AnchorVisual } from './anchor';
  import type { SurfaceField } from './field';
  import {
    createAnchorEdgeMaterial, createAnchorGhostMaterial, createAnchorMaterial,
    syncAnchorEdgeUniforms, syncAnchorGhostUniforms, syncAnchorUniforms,
  } from './material';

  interface Props {
    visual: AnchorVisual;
    /** One flag per anchor: the length is the count, the contents the two states. */
    anchored: boolean[];
    /** The surface they stand on, so an anchor and its terrain cannot disagree. */
    field: SurfaceField;
    /** Pixels per world unit. Only the ghost's dash is authored in px. */
    zoom: number;
  }

  let { visual, anchored, field, zoom }: Props = $props();

  const { invalidate } = useThrelte();

  const face = createAnchorMaterial();
  const edge = createAnchorEdgeMaterial();
  const ghost = createAnchorGhostMaterial();

  /** The solid is built along +Y and turned to face outward. */
  const UP = new THREE.Vector3(0, 1, 0);

  let solid = $state<{ body: THREE.BufferGeometry; lines: THREE.BufferGeometry }>();

  // `buildAnchorSolid` reads only the four shape fields, so this rebuilds on
  // those and no others — the ink sliders never touch geometry.
  $effect(() => {
    const built = buildAnchorSolid(visual);

    const body = new THREE.BufferGeometry();
    body.setAttribute('position', new THREE.BufferAttribute(built.positions, 3));
    body.setIndex(new THREE.BufferAttribute(built.indices, 1));

    const lines = new THREE.BufferGeometry();
    lines.setAttribute('position', new THREE.BufferAttribute(built.edges, 3));
    lines.setAttribute('along', new THREE.BufferAttribute(built.along, 1));

    solid = { body, lines };
    invalidate();

    return () => {
      body.dispose();
      lines.dispose();
    };
  });

  const placements = $derived(placeAnchors(visual, anchored, field.sampleRadius));

  const standing = $derived(
    placements.map((anchor) => {
      const direction = new THREE.Vector3(anchor.x, anchor.y, anchor.z);
      const turn = new THREE.Quaternion().setFromUnitVectors(UP, direction);

      return {
        position: direction.multiplyScalar(anchor.base).toArray() as [number, number, number],
        quaternion: turn.toArray() as [number, number, number, number],
        isPlaced: anchor.isPlaced,
      };
    }),
  );

  $effect(() => {
    syncAnchorUniforms(face, visual);
    syncAnchorEdgeUniforms(edge, visual);
    syncAnchorGhostUniforms(ghost, visual, zoom);
    invalidate();
  });

  onDestroy(() => {
    face.dispose();
    edge.dispose();
    ghost.dispose();
  });
</script>

<!--
  The stack, and the whole of it: body 0, placed anchors 1, ghosts 2, souls 3.
  The handoff draws anchors last, but its souls had no depth cue of their own;
  ours discard everything behind the world already, so a soul that is drawn at
  all is in front of the surface an anchor stands on and should pass over it.
  Ghosts sit above the placed because they alone are never occluded.
-->
{#if solid}
  {#each standing as anchor, i (i)}
    <T.Group position={anchor.position} quaternion={anchor.quaternion}>
      {#if anchor.isPlaced}
        <T.Mesh geometry={solid.body} material={face} renderOrder={1} />
        <T.LineSegments geometry={solid.lines} material={edge} renderOrder={1} />
      {:else}
        <T.LineSegments geometry={solid.lines} material={ghost} renderOrder={2} />
      {/if}
    </T.Group>
  {/each}
{/if}

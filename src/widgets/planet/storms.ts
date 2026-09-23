import * as THREE from 'three';
import { createRandom } from './caps';
import { createStormBakeMaterial, STORM_SLOTS, syncStormBakeUniforms } from './material';
import type { PlanetVisual } from './visual';

/**
 * Where a veil's storms sit. The field lives in GLSL, so rather than port it
 * the veil's own shader is baked to a small map of the sphere and read back —
 * the eyes are placed against the very field that will be drawn.
 *
 * Baked once per field and cached by it: the readback stalls the GPU, which is
 * nothing on a slider drag or a mount and everything on a frame.
 */

/** Longitude by sin-latitude. Coarse on purpose — a storm is wider than a texel. */
const WIDTH = 128;
const HEIGHT = 64;

/** Arbitrary, and apart from the caps' tier seeds. */
const STORM_SEED = 0x3c6ef372;
const VARY_SEED = 0x5be0cd19;

/**
 * Kept off the poles: a storm there turns about the axis the veil already turns
 * on, and reads as nothing.
 */
const LATITUDE = 0.75;

/** Candidates per eye before the best one seen is taken instead. */
const TRIES = 32;

/** Past this many fields the oldest is dropped. A lab drag makes one per step. */
const CACHE = 64;

let bake: {
  target: THREE.WebGLRenderTarget;
  material: THREE.ShaderMaterial;
  scene: THREE.Scene;
  camera: THREE.Camera;
  pixels: Uint8Array;
} | undefined;

/**
 * One storm: where its eye is, and its own multiples of the authored twist,
 * size and eye — x, y and z.
 */
export interface Storm {
  eye: THREE.Vector3;
  vary: THREE.Vector3;
}

const placed = new Map<string, Storm[]>();

/** Everything the bake reads, and the seeds and margin the placement reads. */
function keyOf(visual: PlanetVisual) {
  return [
    visual.seed, visual.veilStormSeed, visual.veilStorms, visual.veilStormMass,
    visual.veilStormVary,
    visual.veilFrequency, visual.veilOctaves, visual.veilGain, visual.veilWarp,
    visual.veilBands, visual.veilBandFrequency, visual.veilPole, visual.veilPoleEdge,
    visual.veilCoverage,
  ].join('/');
}

function bakeOf() {
  if (bake) return bake;

  const material = createStormBakeMaterial();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;

  const scene = new THREE.Scene();
  scene.add(quad);

  bake = {
    target: new THREE.WebGLRenderTarget(WIDTH, HEIGHT, { depthBuffer: false }),
    material,
    scene,
    camera: new THREE.Camera(),
    pixels: new Uint8Array(WIDTH * HEIGHT * 4),
  };

  return bake;
}

function render(renderer: THREE.WebGLRenderer, visual: PlanetVisual) {
  const { target, material, scene, camera, pixels } = bakeOf();
  syncStormBakeUniforms(material, visual);

  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  renderer.readRenderTargetPixels(target, 0, 0, WIDTH, HEIGHT, pixels);
  renderer.setRenderTarget(previous);

  return pixels;
}

/**
 * How deep in cloud a direction is, in field units: above 0 inside the
 * coverage threshold, below it clear sky. Outside the pole mask it is sky
 * whatever the field says.
 */
function massAt(pixels: Uint8Array, coverage: number, x: number, y: number, z: number) {
  const u = (Math.atan2(z, x) / (Math.PI * 2) + 1) % 1;
  const column = Math.min(WIDTH - 1, Math.floor(u * WIDTH));
  const row = Math.min(HEIGHT - 1, Math.floor((y + 1) / 2 * HEIGHT));
  const at = (row * WIDTH + column) * 4;

  if (pixels[at + 1] < 128) return -1;

  return pixels[at] / 255 - coverage;
}

/**
 * The eyes, each the first candidate as deep as `veilStormMass` asks, or the
 * best one seen. The margin is signed: positive wants that far into cloud, and
 * negative that far into clear sky — an eye with the cloud wound round it.
 *
 * Each is then given its own multiples of twist, size and eye, up to
 * `veilStormVary` either side of 1, off a stream of its own — so turning the
 * spread up does not move a single eye.
 */
export function placeStorms(renderer: THREE.WebGLRenderer, visual: PlanetVisual): Storm[] {
  const count = Math.max(0, Math.min(STORM_SLOTS, Math.round(visual.veilStorms)));
  if (count === 0) return [];

  const key = keyOf(visual);
  const cached = placed.get(key);
  if (cached) return cached;

  const pixels = render(renderer, visual);
  const random = createRandom(visual.seed ^ STORM_SEED ^ visual.veilStormSeed);
  const margin = visual.veilStormMass;
  const sign = margin >= 0 ? 1 : -1;
  const wiggle = createRandom(visual.seed ^ VARY_SEED ^ visual.veilStormSeed);
  const spread = Math.max(0, Math.min(1, visual.veilStormVary));
  const varied = () => 1 + spread * (wiggle() * 2 - 1);
  const storms: Storm[] = [];

  for (let i = 0; i < count; i++) {
    const eye = new THREE.Vector3();
    let best = -Infinity;

    for (let t = 0; t < TRIES; t++) {
      const y = (random() * 2 - 1) * LATITUDE;
      const radius = Math.sqrt(1 - y * y);
      const angle = random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const score = sign * massAt(pixels, visual.veilCoverage, x, y, z);
      if (score <= best) continue;

      best = score;
      eye.set(x, y, z);

      if (score >= Math.abs(margin)) break;
    }

    storms.push({ eye, vary: new THREE.Vector3(varied(), varied(), varied()) });
  }

  placed.set(key, storms);
  if (placed.size > CACHE) placed.delete(placed.keys().next().value!);

  return storms;
}

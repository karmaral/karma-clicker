import * as THREE from 'three';
import { createSurfaceField, type SurfaceField } from './field';
import { keyShape, type PlanetVisual } from './visual';

/**
 * An icosphere displaced on the CPU. Icosahedron rather than `SphereGeometry`:
 * a UV sphere pinches at the poles and bunches its quads, which is invisible
 * smooth-shaded and glaring under facets.
 *
 * Normals are the real surface normals, derived from the field's slope rather
 * than from the triangles — so smooth shading follows the terrain instead of
 * reverting to the sphere underneath it. Facets come from screen derivatives in
 * the fragment shader, so the two are one slider apart.
 */
const cache = new Map<string, THREE.BufferGeometry>();

const UNIT_X = new THREE.Vector3(1, 0, 0);
const UNIT_Z = new THREE.Vector3(0, 0, 1);

/** Angular step for the gradient. Small enough to be local, wide enough to dodge float noise. */
const STEP = 1e-3;

const dir = new THREE.Vector3();
const t1 = new THREE.Vector3();
const t2 = new THREE.Vector3();
const probe = new THREE.Vector3();
const normal = new THREE.Vector3();

/** Right-handed frame at `d`, so `t1 × t2 = d`. */
function frameAt(d: THREE.Vector3) {
  t1.crossVectors(Math.abs(d.z) < 0.9 ? UNIT_Z : UNIT_X, d).normalize();
  t2.crossVectors(d, t1).normalize();
}

/**
 * Central difference along a tangent, per unit arc — of what displaces the
 * surface rather than of the raw field, so a clipped world's flat half shades
 * flat instead of being lit by terrain it no longer has.
 */
function sampleSlope(field: SurfaceField, d: THREE.Vector3, tangent: THREE.Vector3) {
  probe.copy(d).addScaledVector(tangent, STEP).normalize();
  const ahead = field.sampleDisplacement(probe.x, probe.y, probe.z);

  probe.copy(d).addScaledVector(tangent, -STEP).normalize();
  const behind = field.sampleDisplacement(probe.x, probe.y, probe.z);

  return (ahead - behind) / (2 * STEP);
}

function build(visual: PlanetVisual) {
  const detail = Math.max(1, Math.min(48, Math.round(visual.detail)));
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const position = geometry.getAttribute('position');
  const heights = new Float32Array(position.count);
  const normals = new Float32Array(position.count * 3);
  const field = createSurfaceField(visual);

  /**
   * What the *shading* thinks the terrain is worth, which `relief` lets run
   * ahead of — or against — what the surface actually does. The two were one
   * number, so a planet could only be lit by terrain it had also been deformed
   * by, and a disc is authored at `amplitude` 0, where there is no terrain in
   * the normal at all and the shade bands come out as plane cuts of a sphere.
   *
   * Both are signed and simply add. Negative carves inward, and a `relief` of
   * the opposite sign shades against the geometry, which is a choice rather
   * than a mistake.
   */
  const normalAmplitude = visual.amplitude + visual.relief;

  for (let i = 0; i < position.count; i++) {
    dir.fromBufferAttribute(position, i).normalize();

    // The attribute keeps the whole field; only the displacement is clipped.
    const height = field.sampleHeight(dir.x, dir.y, dir.z);
    const radius = field.sampleRadius(dir.x, dir.y, dir.z);

    heights[i] = height;
    position.setXYZ(i, dir.x * radius, dir.y * radius, dir.z * radius);

    /**
     * From the field's own slope. For p = r(d)·d the cross product of the two
     * tangents reduces to r·d − A·∇f, so it follows the terrain instead of
     * pointing at the sphere it was displaced from. With `relief` set, A is not
     * the displacement's own amplitude and this is the true normal of a surface
     * the mesh does not have — a bump map, baked per vertex.
     */
    frameAt(dir);
    normal
      .copy(dir)
      .multiplyScalar(radius)
      .addScaledVector(t1, -normalAmplitude * sampleSlope(field, dir, t1))
      .addScaledVector(t2, -normalAmplitude * sampleSlope(field, dir, t2))
      .normalize();

    normals[i * 3] = normal.x;
    normals[i * 3 + 1] = normal.y;
    normals[i * 3 + 2] = normal.z;
  }

  position.needsUpdate = true;
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('height', new THREE.BufferAttribute(heights, 1));
  geometry.computeBoundingSphere();

  return geometry;
}

/** Cached on the shape fields alone — dragging a band slider must not rebuild. */
export function buildGeometry(visual: PlanetVisual) {
  const key = keyShape(visual);
  const hit = cache.get(key);
  if (hit) return hit;

  const geometry = build(visual);
  cache.set(key, geometry);

  return geometry;
}

/** The lab churns keys; without this a long session leaks every intermediate mesh. */
export function trimGeometryCache(limit = 24) {
  if (cache.size <= limit) return;

  for (const [key, geometry] of cache) {
    if (cache.size <= limit) break;

    geometry.dispose();
    cache.delete(key);
  }
}

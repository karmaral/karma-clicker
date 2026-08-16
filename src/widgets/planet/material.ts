import * as THREE from 'three';
import type { AnchorVisual } from './anchor';
import { readInkRamp, RAMP_SIZE, RAMP_SLOTS } from './ink';
import { keyLight } from './light.svelte';
import type { SwarmVisual } from './orbit';
import type { PlanetVisual } from './visual';

/**
 * Dynamic indexing of a uniform array is not portable in GLSL ES 1.00. Shared
 * so the swarm cannot invent a second ramp beside the body's.
 */
const rampRead = /* glsl */ `
  vec3 readRamp(float index) {
    int wanted = int(clamp(index, 0.0, float(${RAMP_SIZE - 1})) + 0.5);

    for (int i = 0; i < ${RAMP_SLOTS}; i++) {
      if (i == wanted) return uRamp[i];
    }

    return uRamp[0];
  }
`;

/**
 * No lights, no gradient map, no `MeshToonMaterial`. Under an orthographic
 * camera the view vector is a constant, so the fresnel collapses to how far a
 * facet turns from the screen — `1 − |N.z|`. Everything else is where that gets
 * quantised.
 */
const surfaceVertex = /* glsl */ `
  attribute float height;

  varying float vHeight;
  varying vec3 vNormal;

  void main() {
    vHeight = height;

    // The attribute is the field's own surface normal, baked in geometry.ts.
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const surfaceFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uRim;
  uniform float uRimGamma;
  uniform float uLand;
  uniform float uKey;
  uniform vec3 uKeyDir;
  uniform float uBias;
  uniform float uSteps;
  uniform float uToneFloor;
  uniform float uToneCeil;
  uniform float uContour;
  uniform float uContourTone;
  uniform float uContourShadowTone;
  uniform float uShadeSteps;
  uniform float uShadeDepth;

  varying float vHeight;
  varying vec3 vNormal;

  ${rampRead}

  /**
   * A band boundary drawn as a stroked path rather than left as the step between
   * two tones. Widths come from fwidth, so the line is the weight it
   * says it is however steep the field runs — and is simply absent where the
   * field is flat, instead of smearing across it.
   */
  float contourAt(float band) {
    // Derivatives have to be taken in uniform control flow.
    float perPixel = fwidth(band);
    if (uContour <= 0.0) return 0.0;

    // The uSteps-1 interior boundaries only. The ends of the range are where
    // t clamps, not where a tone changes.
    float boundary = floor(band + 0.5);
    float interior = step(0.5, boundary) * step(boundary, uSteps - 0.5);

    float pixels = abs(band - boundary) / max(perPixel, 1e-6);
    float reach = uContour * 0.5;

    return interior * (1.0 - smoothstep(reach - 0.5, reach + 0.5, pixels));
  }

  void main() {
    // The field's own surface normal, so the shade follows the terrain's slope
    // rather than the triangles it was tessellated into.
    vec3 N = normalize(vNormal);

    // The texture. vHeight is a vertex attribute, so this is the only term that
    // turns with the surface — and it is quantised alone, so the pattern is a
    // property of the world rather than of where the camera is standing. Left
    // unclamped: the contour reads it, and a boundary past the ends of the ramp
    // must not be drawn.
    float land = vHeight * 0.5 + 0.5;
    float band = (uLand * land + uBias) * uSteps;
    float level = floor(clamp(band, 0.0, uSteps - 1.0));
    float spread = uSteps > 1.0 ? level / (uSteps - 1.0) : 0.0;

    // The shade, in view space. It never reaches the band coordinate — it is
    // quantised on its own and composited as a shift along the ramp, so the
    // texture survives into the shadow instead of being redrawn by it.
    float rim = pow(clamp(1.0 - abs(N.z), 0.0, 1.0), uRimGamma);

    // Wrapped rather than clamped, so the whole sphere lands somewhere in the
    // shade range instead of collapsing the far half onto one tone.
    float key = 0.5 - 0.5 * dot(N, uKeyDir);

    // Rounded rather than floored, so a signed rim lightens the limb by as many
    // levels as a positive one darkens it.
    float shade = clamp(uRim * rim + uKey * key, -1.0, 1.0);
    float shadeLevel = floor(shade * uShadeSteps + 0.5);

    // readRamp clamps, so the shadow crushes to solid ink rather than wrapping.
    float index = mix(uToneFloor, uToneCeil, spread) + shadeLevel * uShadeDepth;

    // A contour takes its ink from which side of the terminator it falls on,
    // not from the tone beneath it — so a line stays legible crossing out of a
    // pale band into a dark one. Switched on the shade level, so the ink
    // changes where a shade band changes and never partway through one. Works
    // at uShadeDepth 0, where the contour is then the only thing saying where
    // the light is.
    float contourInk = mix(uContourTone, uContourShadowTone, step(0.5, shadeLevel));

    gl_FragColor = vec4(mix(readRamp(index), readRamp(contourInk), contourAt(band)), 1.0);

    #include <colorspace_fragment>
  }
`;

/**
 * Inverted hull, offset along the *radial* direction rather than the face
 * normal. A radially displaced sphere stays star-shaped about its origin while
 * |amplitude| < 1, so radial offset provably cannot self-intersect — which is the
 * usual reason hull outlines look bad on a lumpy low-poly mesh. Offsetting in
 * view space keeps the width independent of any scale on the mesh.
 */
const outlineVertex = /* glsl */ `
  uniform float uOffset;

  void main() {
    vec3 radial = normalize(normalMatrix * normalize(position));
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    viewPos.xyz += radial * uOffset;

    gl_Position = projectionMatrix * viewPos;
  }
`;

const outlineFragment = /* glsl */ `
  uniform vec3 uColor;

  void main() {
    gl_FragColor = vec4(uColor, 1.0);

    #include <colorspace_fragment>
  }
`;

/**
 * Souls, billboarded in view space rather than by a camera quaternion on the
 * CPU. The swarm hangs inside the body's tilt group, so a local rotation would
 * compose with that tilt; building the quad from the instance's *origin* in view
 * space sidesteps it, and the loop then only writes a position and a scale.
 *
 * `instanceMatrix` is declared by three.js for any ShaderMaterial on an
 * InstancedMesh — this material is never used on anything else.
 */
const soulVertex = /* glsl */ `
  uniform float uRing;

  varying vec2 vUv;

  // The fragment's offset from the body's centre, in camera axes. Under an
  // orthographic camera that makes xy the silhouette and z the near/far test.
  varying vec3 vRel;

  void main() {
    vUv = uv;

    vec4 origin = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 centre = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

    // The quad grows to hold the ring, so the fill stays the size it was
    // authored at — the ring is added around a dot, not taken out of one.
    float span = length(instanceMatrix[0].xyz) * (1.0 + uRing);

    vec4 viewPos = centre + vec4(position.xy * span, 0.0, 0.0);
    vRel = viewPos.xyz - origin.xyz;

    gl_Position = projectionMatrix * viewPos;
  }
`;

/**
 * Two inks, chosen **per fragment** so a dot straddling the silhouette is cut
 * into two halves rather than switched whole — a dot that changes colour when
 * its centre crosses reads as a bug at 4px.
 *
 * The far half is discarded rather than depth-tested. Both hide it; only this
 * one hides it at exactly `uRim`, where the ink already switches, so the two
 * agree on where the silhouette is instead of the depth buffer cutting along
 * the terrain and the ink along the sphere.
 */
const soulFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uRim;
  uniform float uRing;
  uniform float uOutTone;
  uniform float uFrontTone;

  varying vec2 vUv;
  varying vec3 vRel;

  ${rampRead}

  void main() {
    // Round, and antialiased the way the contour is — hard edged, never blurred.
    float spread = length(vUv - 0.5) * 2.0;
    float aa = fwidth(spread) * 1.5;
    float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, spread);
    if (alpha <= 0.0) discard;

    float reach = dot(vRel.xy, vRel.xy);
    float edge = uRim * uRim;

    // The body as a sphere, terrain ignored: at the amplitudes worlds are
    // authored at, the error is inside the outline's own weight.
    float surface = sqrt(max(edge - reach, 0.0));
    float over = step(reach, edge);
    float front = step(surface, vRel.z);

    // Behind the world is behind the world. Per fragment, so a dot crossing the
    // silhouette is cut in half rather than vanishing whole.
    if (over > 0.5 && front < 0.5) discard;

    float tone = mix(uOutTone, uFrontTone, over);

    // The ring takes the far end of the ramp from whatever the fill landed on,
    // rather than an ink of its own: a fourth authored tone would need setting
    // once per place a soul can be, and would still be wrong for one of them.
    // Gated, or at width 0 the ring would still claim the dot's own soft edge.
    float core = 1.0 / (1.0 + uRing);
    float ring = smoothstep(core - aa, core, spread) * step(0.001, uRing);
    tone = mix(tone, mix(6.0, 0.0, step(3.5, tone)), ring);

    gl_FragColor = vec4(readRamp(tone), alpha);

    #include <colorspace_fragment>
  }
`;

/**
 * An anchor's facets. No normal attribute: the normal comes from screen
 * derivatives, which is exact here because every triangle of the solid really
 * is flat. Lit by the system's one key, so a placed anchor takes its light from
 * the same place the ground it stands on does.
 */
const anchorVertex = /* glsl */ `
  varying vec3 vViewPos;

  void main() {
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = viewPos.xyz;

    gl_Position = projectionMatrix * viewPos;
  }
`;

const anchorFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform vec3 uKeyDir;
  uniform float uTone;
  uniform float uShade;

  varying vec3 vViewPos;

  ${rampRead}

  void main() {
    vec3 facet = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));

    // Front faces of a convex solid all face the camera under an orthographic
    // projection, so this fixes the derivative's sign without a second normal.
    facet *= facet.z < 0.0 ? -1.0 : 1.0;

    // One knob is both the depth and the granularity: at 1 a facet is paper or
    // the next slot down, and nothing between.
    float key = 0.5 - 0.5 * dot(facet, uKeyDir);

    gl_FragColor = vec4(readRamp(uTone + floor(key * uShade + 0.5)), 1.0);

    #include <colorspace_fragment>
  }
`;

/**
 * The edges, shared by both states. `along` is arc length baked into the
 * geometry; `vRel` is the fragment's offset from the body's centre in camera
 * axes — everything between the two is rotation, so the world origin is the
 * body's own.
 *
 * `vBack` is taken from the anchor's *origin* instead, which makes it one answer
 * for the whole solid. A soul straddling the silhouette wants cutting in half;
 * an anchor is a place, and a place is on one side or the other. Reading it per
 * fragment would also call a sunk base far-side while its tip was near.
 */
const anchorEdgeVertex = /* glsl */ `
  attribute float along;

  varying float vAlong;
  varying float vBack;
  varying vec3 vRel;

  void main() {
    vAlong = along;

    vec3 centre = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec4 origin = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);

    vBack = step(origin.z - centre.z, 0.0);
    vRel = viewPos.xyz - centre;

    gl_Position = projectionMatrix * viewPos;
  }
`;

/** A placed anchor's edges: one ink, and the depth buffer hides the far ones. */
const anchorEdgeFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uTone;

  ${rampRead}

  void main() {
    gl_FragColor = vec4(readRamp(uTone), 1.0);

    #include <colorspace_fragment>
  }
`;

/**
 * The unplaced ghost. Never depth-tested — an anchor's *place* does not stop
 * existing when the world turns, so the far ones stay drawn and say they are far
 * by fading toward the middle of the ramp instead of by disappearing.
 *
 * Two inks by place, the way the souls take theirs, so the ghost inverts against
 * whatever it crosses rather than picking one grey and losing half of it. The
 * dash is measured in pixels: an anchor is *structure*, so its rhythm must hold
 * at 40px and at 420px alike, exactly as the outline's weight does.
 */
const anchorGhostFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uTone;
  uniform float uOutTone;
  uniform float uFade;
  uniform float uDash;
  uniform float uDuty;
  uniform float uZoom;

  varying float vAlong;
  varying float vBack;
  varying vec3 vRel;

  ${rampRead}

  void main() {
    if (fract(vAlong * uZoom / uDash) > uDuty) discard;

    // Which ink, per fragment: the body as a unit sphere. A ghost at the rim is
    // genuinely half over paper, and cutting it there is the rule the harness
    // already draws by — the mean radius, not the terrain, because a ghost is a
    // mark about a place rather than about the ground at it.
    float over = step(dot(vRel.xy, vRel.xy), 1.0);

    float tone = mix(uOutTone, uTone, over);

    // Toward mid-ramp, which is away from whichever end this ink was chosen
    // for — so both halves of the rule fade by the same gesture.
    tone += vBack * uFade * sign(3.0 - tone);

    gl_FragColor = vec4(readRamp(tone), 1.0);

    #include <colorspace_fragment>
  }
`;

export function createSurfaceMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: surfaceVertex,
    fragmentShader: surfaceFragment,
    side: THREE.FrontSide,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uRim: { value: 0.75 },
      uRimGamma: { value: 3 },
      uLand: { value: 0.35 },
      uKey: { value: 0 },
      uKeyDir: { value: new THREE.Vector3(0, 0, 1) },
      uBias: { value: 0 },
      uSteps: { value: 4 },
      uToneFloor: { value: 0 },
      uToneCeil: { value: 6 },
      uContour: { value: 0 },
      uContourTone: { value: 6 },
      uContourShadowTone: { value: 6 },
      uShadeSteps: { value: 2 },
      uShadeDepth: { value: 0 },
    },
  });
}

export function createOutlineMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: outlineVertex,
    fragmentShader: outlineFragment,
    side: THREE.BackSide,
    uniforms: {
      uOffset: { value: 0 },
      uColor: { value: readInkRamp()[6] },
    },
  });
}

export function createSoulMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: soulVertex,
    fragmentShader: soulFragment,
    side: THREE.DoubleSide,
    transparent: true,
    // The shader decides what the body hides, at the same radius as the ink.
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uRim: { value: 1 },
      uRing: { value: 0 },
      uOutTone: { value: 6 },
      uFrontTone: { value: 0 },
    },
  });
}

export function createAnchorMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: anchorVertex,
    fragmentShader: anchorFragment,
    side: THREE.FrontSide,
    // The edges lie exactly on these faces. Without the offset they z-fight,
    // and with it the two need no render order between them.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uKeyDir: { value: new THREE.Vector3(0, 0, 1) },
      uTone: { value: 0 },
      uShade: { value: 1 },
    },
  });
}

export function createAnchorEdgeMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: anchorEdgeVertex,
    fragmentShader: anchorEdgeFragment,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uTone: { value: 6 },
    },
  });
}

export function createAnchorGhostMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: anchorEdgeVertex,
    fragmentShader: anchorGhostFragment,
    // The shader decides what the body hides, and the answer is nothing.
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uTone: { value: 0 },
      uOutTone: { value: 6 },
      uFade: { value: 2 },
      uDash: { value: 3 },
      uDuty: { value: 0.5 },
      uZoom: { value: 100 },
    },
  });
}

export function syncAnchorUniforms(material: THREE.ShaderMaterial, visual: AnchorVisual) {
  const u = material.uniforms;
  const key = keyLight.direction;

  u.uKeyDir.value.set(key.x, key.y, key.z);
  u.uTone.value = Math.round(visual.faceTone);
  u.uShade.value = Math.round(visual.faceShade);
}

export function syncAnchorEdgeUniforms(material: THREE.ShaderMaterial, visual: AnchorVisual) {
  material.uniforms.uTone.value = Math.round(visual.edgeTone);
}

export function syncAnchorGhostUniforms(
  material: THREE.ShaderMaterial,
  visual: AnchorVisual,
  zoom: number,
) {
  const u = material.uniforms;

  u.uTone.value = Math.round(visual.ghostTone);
  u.uOutTone.value = Math.round(visual.ghostOutTone);
  u.uFade.value = Math.round(visual.ghostFade);
  u.uDash.value = Math.max(0.5, visual.dash);
  u.uDuty.value = visual.duty;
  u.uZoom.value = zoom;
}

export function syncSoulUniforms(material: THREE.ShaderMaterial, visual: SwarmVisual) {
  const u = material.uniforms;

  u.uRim.value = visual.rim;
  u.uRing.value = visual.ring;
  u.uOutTone.value = Math.round(visual.outTone);
  u.uFrontTone.value = Math.round(visual.frontTone);
}

export function syncSurfaceUniforms(material: THREE.ShaderMaterial, visual: PlanetVisual) {
  const u = material.uniforms;

  u.uRim.value = visual.rim;
  u.uRimGamma.value = visual.rimGamma;
  u.uLand.value = visual.land;
  u.uKey.value = visual.key;
  u.uBias.value = visual.bias;

  // The aim is the system's, not the world's — read ambiently, as the ramp is.
  const key = keyLight.direction;
  u.uKeyDir.value.set(key.x, key.y, key.z);

  u.uSteps.value = Math.max(1, Math.round(visual.steps));
  u.uToneFloor.value = Math.round(visual.toneFloor);
  u.uToneCeil.value = Math.round(visual.toneCeil);
  u.uContour.value = visual.contour;
  u.uContourTone.value = Math.round(visual.contourTone);
  u.uContourShadowTone.value = Math.round(visual.contourShadowTone);
  u.uShadeSteps.value = Math.max(1, Math.round(visual.shadeSteps));
  u.uShadeDepth.value = visual.shadeDepth;
}

/**
 * `zoom` on an orthographic camera is pixels per world unit, because Threlte
 * sizes the frustum in pixels — so an outline authored in px converts exactly.
 */
export function syncOutlineUniforms(
  material: THREE.ShaderMaterial,
  visual: PlanetVisual,
  ramp: THREE.Color[],
  zoom: number,
) {
  material.uniforms.uOffset.value = zoom > 0 ? visual.outline / zoom : 0;
  material.uniforms.uColor.value = ramp[Math.round(visual.outlineTone)] ?? ramp[6];
}

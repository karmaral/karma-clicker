/**
 * Everything a planet's picture is made of. Authored in the lab, pasted into
 * `$data/planet-visuals`, and read by `PlanetView`. Nothing here is game state —
 * `Planet` never sees it.
 */
export interface PlanetVisual {
  seed: number;

  /**
   * How big this world *is*, which is the one thing the body itself cannot say:
   * it is drawn to the framing whatever it is, so a picture of a sphere alone
   * carries no scale at all. What carries it is everything standing beside it —
   * so this **divides** the marks rather than multiplying the body. A large
   * world wears fine souls and low poles; a small one wears coarse ones.
   *
   * Sizes in body radii are what move: the souls' dots, the anchors' solids and
   * the sparks. What is authored in *pixels* does not — the outline, the
   * contour, the dash and the dot floor are the drawn edges of the widget, and
   * a widget does not get a heavier line for holding a smaller planet.
   *
   * The orbits stay where they were authored too. `radius` is rim-hugging by
   * design, and a world that pulled its swarm inward would stop crossing its own
   * silhouette — which is the whole of the souls' depth cue.
   */
  size: number;

  /**
   * Shape — the noise field, which both displaces the sphere radially and feeds
   * the `land` band. It is normalised to its own measured range, so every one of
   * these changes the picture's character without changing how much of the band
   * range the terrain is worth. That is `land`'s job alone.
   */
  frequency: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  /** 0 rounded hills, 1 creased ridges. The difference between landform and crinkle. */
  ridge: number;
  /** Slides the sample point across the sphere. Marbles the terrain, swirls `strata`. */
  warp: number;
  /**
   * Blend from terrain to latitude bands — 0 a world, 1 a gas giant. The stripes
   * are read at the warped latitude, so `warp` is what stops them being a barcode.
   * Their frequency competes with `detail` for the same budget: bands are shaded
   * from a per-vertex height, so anything finer than the mesh reads as polygons.
   */
  strata: number;
  strataFrequency: number;
  /**
   * How far the field moves the surface. Signed: positive raises the peaks,
   * negative carves them inward, and because the texture reads the field's own
   * height rather than the radius, the same map can be embossed or engraved
   * without the pattern changing. Pairs with `relief`, which is the same
   * quantity for the shading normal alone.
   */
  amplitude: number;
  /**
   * Flattens the field's negative half onto the sphere, so the amplitude only
   * ever works one way: at 1 a negative amplitude cuts pits into a smooth ball
   * and cannot push ridges back out, and a positive one raises without denting.
   * The texture is unaffected and still reads the whole field.
   */
  clip: number;
  /** Edge subdivisions, not recursive: the mesh is 20·(detail+1)² triangles. */
  detail: number;

  /**
   * Features instead of octaves. Each tier drops a count of round caps of a size
   * in radians onto the sphere — 3 at 0.42 is three continents — and `caps`
   * blends the terrain from the noise to their sum. It is a blend rather than a
   * sum so the noise survives as the *coast* on the caps' landforms; at 1 there
   * is nothing but smooth domes, and everything between is a shaped world with
   * a rough shoreline. `warp` bends the caps too, which is what stops a
   * continent being a circle. At 0 the whole system is inert.
   *
   * `lift` is signed per tier: positive raises, negative sinks, so the same
   * three sliders make continents at one end and craters at the other. The sum
   * is normalised on its own before the blend, so half really is half.
   */
  caps: number;
  /**
   * A ring just outside every cap, running against its lift and back to nothing.
   * It exists so the ground *between* caps is not one constant: a constant has no
   * band boundary in it, so at a high blend the water goes dead and `contour` has
   * nothing to draw. With it, the water within reach of a coast has a gradient,
   * and the bands quantise it into shallows the hairline rings.
   *
   * One number for all three tiers, and the reach is fixed at half each cap's own
   * radius — the slider is the ring's depth, which is the part that decides
   * whether it survives at 80px.
   *
   * Signed, because the ring is the *only* thing that says which way the ground
   * leans as it leaves a cap and both readings are wanted. Positive digs: a
   * trough hugging every coast, drawn below the open water, which is the dark
   * coastal band an engraved map uses — and on a crater it is the raised rim a
   * crater actually has. Negative banks it the other way, a shoal ringing the
   * land lighter than the sea it sits in.
   *
   * It reaches as far as a coast does. What is further out than that is
   * `capSwell`'s.
   */
  capSkirt: number;
  /**
   * The open sea. `capSkirt` grades the water a coast can reach and no further,
   * which leaves the rest of it one flat tone — so this is a long, low set of
   * bands laid across the water alone, masked out wherever a cap has said
   * anything. Warped latitude, the same term `strata` uses, so `warp` swirls it
   * and it is swell rather than a ruled grid.
   *
   * It goes in as height, not as a normal, and that is the useful way round: with
   * `clip` at 1 the sea is flattened onto the sphere and is not deformed by this
   * at all, so the swell survives purely as tone and as whatever `contour` draws
   * along its band edges — line work on a sea that stays perfectly smooth.
   *
   * `capSwellBands` competes with `detail` exactly as `strataFrequency` does:
   * the field is read per vertex, so bands finer than the mesh read as polygons.
   */
  capSwell: number;
  capSwellBands: number;
  capCoarse: number;
  capCoarseSize: number;
  capCoarseLift: number;
  capMid: number;
  capMidSize: number;
  capMidLift: number;
  capFine: number;
  capFineSize: number;
  capFineLift: number;

  /**
   * Two layers, quantised separately.
   *
   * `land` is the *texture* — the terrain, read from a vertex attribute, so it
   * is the only term that turns with the surface. The field is normalised, so it
   * reads directly: 1 is the terrain owning the whole ramp, 0.25 a quarter of it.
   *
   * `rim` and `key` are the *shade*, both view-space, and neither reaches the
   * band coordinate. They are composited afterwards as a shift along the ramp,
   * which is what keeps the pattern a property of the world instead of of where
   * the camera stands. `rim` is signed: positive darkens the limb, negative
   * lightens it — the atmosphere reading. With `land` and shadeDepth` both at
   * zero, nothing is left but a flat fill and the outline.
   *
   * The shading normal is always the field's own, so the shade follows the
   * terrain's slope rather than the triangles under it — which is why `detail`
   * should be pushed as high as a world can afford.
   */
  rim: number;
  rimGamma: number;
  land: number;
  /**
   * How much of the key this world takes. Not a light — there is no light — but
   * the same maths, and the only term that tells you which way a slope faces.
   * Where it comes from is not authored here: the aim is one token for the whole
   * system, in `light.svelte.ts`, and the anchors read the same one.
   */
  key: number;
  bias: number;
  steps: number;
  toneFloor: number;
  toneCeil: number;
  /**
   * A hairline at each band boundary, in pixels — the band's edge drawn instead
   * of left as a step between two tones. Its width is independent of `detail`,
   * so it is the band mark that survives at 40px; its *path* is not, and kinks
   * at triangle scale. With `toneFloor` and `toneCeil` equal it is the only
   * thing drawn, which is a flat body carrying line work and nothing else.
   */
  contour: number;
  /**
   * Two inks, picked by which side of the terminator the line falls on rather
   * than by the tone under it — so a contour stays legible crossing out of a
   * pale band into a dark one. The switch is the shade level, which is computed
   * whatever `shadeDepth` is: at 0 the contour's ink is then the only thing on
   * the planet saying where the light comes from.
   */
  contourTone: number;
  contourShadowTone: number;
  /**
   * The grain, and the only noise in the body's fragment. Both of the body's
   * quantisers are exact level sets, so a smooth field crosses one as a perfect
   * curve — this displaces the coordinate before the floor, and the boundary
   * comes apart into paper instead.
   *
   * `grain` is how far the texture band wanders, in **slots**, and `shadeGrain`
   * is the same for the shade level. Two amounts because they are two pictures:
   * one is the world's own pattern and the other is where the light falls on it,
   * and a world can want its terrain broken up without its terminator going with
   * it.
   *
   * One noise sample under both, though, and that is deliberate. The veil
   * decorrelates its two cuts because they are one ruling read twice, and
   * sharing collapsed every shoulder onto one slot; here the two coordinates are
   * already independent fields, so a shared displacement is a grain in the
   * *paper* rather than a correlation — and it is one `snoise` instead of two.
   *
   * `grainScale` is that noise's scale, shared, and it is the whole of the
   * difference between a rough edge and a mottled one. Faded to nothing as its
   * period approaches two pixels, `veilFbm`'s rule with its constants: the limb
   * compresses the sphere hard, and an unfaded grain fizzes there. To nothing
   * and not to its mean, because a grain stuck at its mean is a constant offset
   * on the band, which is `bias` said badly.
   *
   * A contour follows the grained band rather than the clean one, so the line
   * stays coincident with the edge it is the boundary of. Its *width* comes off
   * the clean rate — a rate carrying the displacement spikes wherever the noise
   * runs fast, and anything scaled by it thins to nothing there.
   */
  grain: number;
  shadeGrain: number;
  grainScale: number;
  /**
   * How the shade composites. `shadeSteps` is its granularity — 1 is a
   * three-tone terminator, 2 a five-tone one — and `shadeDepth` is how many ramp
   * slots each level moves the texture's tone by. At 0 the picture is the
   * texture alone, with `rim`, `key` and the key's aim all still authored and
   * inert, so it is one knob from flat to shaded and back.
   */
  shadeSteps: number;
  shadeDepth: number;
  /**
   * Terrain in the shading normal that the surface does not actually have —
   * added to `amplitude`, so it is what lets a disc at `amplitude` 0 still be
   * lit by its own landscape instead of banding as plane cuts of a sphere.
   * Signed like `amplitude`, and opposite signs shade against the geometry.
   * Baked per vertex, so it rebuilds the mesh.
   */
  relief: number;

  /** Outline, in pixels — held constant on screen at any widget size. */
  outline: number;
  outlineTone: number;

  /**
   * The window and what it shows. One feature and one group, because neither
   * half is worth anything alone: a body opened onto nothing is a hole, and a
   * core behind a solid body is not drawn.
   *
   * Neither is on unless the view says so. The mark *is* the harvest's
   * alignment, and a view with no alignment to draw passes `clarity` 0 and
   * mounts no core — so the sliders here author what the harvest screen looks
   * like, and every other view is untouched however they are set.
   *
   * `clarity` is how far open the front goes, read off the same fresnel the
   * shade's `rim` is and turned round: the front dissolves and the limb stays
   * whole, because the silhouette is where a world's shape is read and is the
   * one half that may not be spent.
   *
   * It is spent as an **opacity**, and it is the one place on the world where
   * the seven inks are knowingly broken: a blend lands between the surface's
   * slot and the core's. A dithered cutout held the inks and was tried first,
   * but a hole is all or nothing, so a barely-open window came out as confetti
   * rather than as thin — and thin is what most of this window is. A speckle on
   * the alpha went the same way after it: the window is a *clearing*, and grain
   * in it read as damage to the surface rather than as the surface thinning.
   *
   * **The veil opens with it.** Both veil modes take the same factor off the
   * same radial normal, so the weather over an opened front is as thin as the
   * front is — a cloud left hanging in the hole read as a lid.
   *
   * `clarityGamma` is how far down the sphere the window reaches: low is a wide
   * one that closes only at the limb, high is a small clearing dead centre. The
   * fresnel is put through an S before the clarity is spent on it, so this moves
   * a rim rather than stretching a wash — a falloff spread over the whole disc
   * reads as haze over the world instead of an opening in it.
   *
   * `claritySteps` bands the result, which is `steps`' own argument spent on the
   * one quantity here that had escaped it: the window is a few fixed opacities
   * and nothing between, the way the surface is a few fixed inks. The lattice is
   * fixed at 0 and 1 rather than laid across whatever `clarity` reaches, so a
   * level means the same thing on every world and lowering the clarity drops
   * bands off the open end instead of sliding all of them.
   */
  clarity: number;
  clarityGamma: number;
  claritySteps: number;
  /**
   * The core's radius, in body radii. 0 draws none — and then the swarm has
   * nowhere to arrive, so souls settle to `settleAt` as they always did.
   *
   * **Its inks are not here.** They are fixed in `material.ts` — `CORE_TONES` —
   * because this one mark is a *reading* of the harvest rather than a world's
   * own character, and a reading each world stated in its own colours would be
   * one nobody could learn. Positive is paper, negative is black, even is a
   * mid-light grey, and each ruled end hatches one step in from its own ground.
   * The souls in it are fixed there too, fill and ring both. Only the core's
   * *shape* is authored below.
   *
   * `coreFeather` softens the rim, on the same fresnel the window is cut from
   * and read the other way round — it shuts the core's own limb instead of
   * opening its front. 0 is a hard edge, which reads as a coin lying on the
   * world; up from there the edge gives itself back to the ink and the core
   * reads as something inside it.
   *
   * `coreHatchDensity` is strokes per body radius, so the ruling holds its
   * spacing against the core rather than against the box. `coreHatchWidth` is
   * the stroke weight in px, and it is a **line** rather than a floor — so
   * `scaleInk` brings it up on a push-in, where `veilHatchWidth` is deliberately
   * left alone.
   *
   * `coreHatchReach` is how far in from the limb the ruling comes, as a share of
   * the disc, and the width above is its weight **at the rim** — the middle is
   * bare and thickens outward from wherever this starts it. Flat strokes across
   * the whole disc read as a ruled plate the size of the core; a weight that
   * answers the silhouette reads as curvature, which is the one thing a mark
   * with no shading of its own cannot otherwise say. Past 1 the middle keeps a
   * share of the weight rather than none, which is the old flat ruling
   * approached rather than restored.
   *
   * `coreSeed` is how much of that radius is drawn before a single soul has
   * arrived, as a share of it — and so also how much travel the split is left.
   * See `coreFillOf`, which is where the growth and the reasons are.
   */
  core: number;
  coreSeed: number;
  coreFeather: number;
  coreHatchDensity: number;
  coreHatchWidth: number;
  coreHatchReach: number;

  /**
   * A second surface, above the first. It is a cloud deck at one tuning and an
   * aurora at another, and the difference between them is four sliders: how
   * high it sits, how far toward the poles it is allowed, how hard its edge is,
   * and which side of the light it lives on.
   *
   * Unlike everything above, its field is evaluated **in the shader**. The
   * body's is baked on the CPU because `buildGeometry`, `placeAnchors` and the
   * sparks must all sample one field and can never disagree about the ground.
   * Nothing stands on a cloud, so that reason does not reach here — and the veil
   * pays nothing for it: it borrows the body's cached geometry for its topology
   * alone, renormalised to a true sphere, so **no field here rebuilds a mesh**.
   *
   * At `veil` 0 the whole layer is inert and its material is never compiled.
   */
  veil: number;
  /**
   * How it composites. 0 alpha over `veilTone`, which invents a grey between
   * two ramp slots wherever it is partly open; 1 the hatch, which spends the
   * same coverage as a *density* of marks instead and so can stay inside the
   * seven inks. Picks between two materials — see `veilMaterialFor`.
   *
   * It also decides what `veilKey` means, which is the only place the two modes
   * disagree about anything but their marks. See there.
   */
  veilInk: number;
  veilTone: number;
  /**
   * How far above the surface, in body radii. Under an orthographic camera a
   * shell has no parallax to buy, so this is honestly a *limb reach*: it is how
   * far the veil stands past the body's own silhouette, and wants reading
   * against `outline / zoom`, which is the same quantity for the ink.
   */
  veilHeight: number;
  /**
   * The field. No `lacunarity` — it is fixed at 2, because the veil has no
   * measured range to absorb what a second octave-shaping knob does to it and
   * `veilCoverage` would quietly re-mean itself. No `ridge` either: ridging
   * makes a crease, and neither a cloud deck nor an aurora has one.
   */
  veilFrequency: number;
  veilOctaves: number;
  veilGain: number;
  veilWarp: number;
  /** Latitude bands, blended in at the warped direction — `strata`, one shell up. */
  veilBands: number;
  veilBandFrequency: number;
  /**
   * Where the field becomes a shape. `veilCoverage` is the threshold and
   * `veilEdge` its softness in field units, floored by the screen derivative so
   * an edge is never harder than the pixels can draw.
   */
  veilCoverage: number;
  veilEdge: number;
  /**
   * A line around the fill, in pixels, drawn at the contour where the fill
   * reaches *full* rather than at the silhouette — which is what makes it move
   * on its own. At a hard edge the two are a pixel apart and the line is the
   * silhouette; open `veilEdge` and full coverage retreats up the field's slope
   * toward each blob's core and takes the line with it, so a diffuse veil is a
   * soft mass with its solid heart drawn around. No second slider says where it
   * sits, because `veilEdge` already does.
   *
   * It follows the field, not a centre, so a long curtain keeps a line down its
   * spine rather than collapsing to a dot — and a wisp that never reaches full
   * coverage carries no line at all, having no solid part to be the edge of.
   *
   * Never hatched. A broken hairline is not a line, so in mode 1 it takes a
   * hard half-cut and stays solid.
   */
  veilOutline: number;
  veilOutlineTone: number;
  /**
   * Which latitudes it is allowed, as an annulus rather than a cap: `veilPole`
   * is the sin-latitude the band is *centred* on and `veilPoleEdge` its width.
   * An aurora is a ring at about sixty degrees — a cap centred on the pole is a
   * hat. A width past 2 cannot fail the test, and is the cloud reading: the
   * mask is simply gone.
   */
  veilPole: number;
  veilPoleEdge: number;
  /**
   * How the key reaches it, and it reaches the two modes differently.
   *
   * At `veilInk` 0 it is a *coverage* term: a single ink has no band coordinate
   * to shift along, so the only thing it can shade is how much veil there is,
   * and the veil thins toward the far side of the light.
   *
   * At `veilInk` 1 it is the shading proper — the veil keeps its full shape and
   * walks `veilHatchShade` slots down the ramp instead, which is what the hatch
   * dithers. That is the one thing a density mode buys that an alpha one
   * cannot: a mark can be sparse *and* dark, so shape and light stop competing
   * for the same number.
   *
   * Signed either way, and the sign is which side of the light it belongs to: a
   * cloud burns off — or shades — the dark half at a positive value, and an
   * aurora is a night mark and lives at a negative one. The magnitude is how
   * hard the reading is pressed, and at 0 the light does not reach the veil.
   */
  veilKey: number;
  /**
   * Its **drift over the ground**, not a rate of its own: the veil turns at
   * `spin + veilSpin`, so 0 is a deck locked to the surface and travelling with
   * it, and either direction from there is how fast it pulls away — ahead of the
   * world one way, against it the other.
   *
   * Relative because that is the reading the eye has. An absolute rate makes
   * authoring a cloud an arithmetic problem — hold `spin` in your head, solve
   * for the difference — and lets a later edit to `spin` silently re-mean every
   * veil under it. Nothing downstream changed: the veil group is still a sibling
   * of the spin group and `clock.veilAngle` is still an absolute angle. Only
   * what feeds it is a sum.
   *
   * Here rather than in `Motion` because `Motion` is how the *world* is held,
   * and a session tuning the veil wants its rate under its coverage.
   */
  veilSpin: number;
  /**
   * The hatch, and inert at any `veilInk` but 1. One family of strokes, ruled
   * on the sphere itself rather than on the paper, so they turn with the world.
   *
   * These author a *screen*, not a picture. The strokes are never the veil —
   * they are what a tone looks like part of the way to solid, so a full cloud
   * is unbroken ink and the marks live in its gradient. Two tones are cut
   * against one family read at two phases: coverage opens the silhouette, and
   * the key walks the ramp against the same strokes displaced by the noise.
   *
   * `veilHatchDensity` is strokes per radian, and it is the only thing about
   * the ruling that is authored. There is no angle: the family runs in
   * latitude, on the world's own axis. Any other axis puts the measure's two
   * degenerate poles somewhere arbitrary in object space, where they read as a
   * whorl in the middle of the disc; on this one they land on the poles, where
   * a ruling in latitude is *supposed* to converge. There is no second angle
   * either — the tone's strokes run the same way and weave between the
   * silhouette's, because a family square to the first is a cross-hatch on
   * paper and a net on a sphere.
   *
   * `veilHatchWidth` is *not* the stroke weight — the tone is — but **the
   * thinnest mark this pen draws**, in CSS pixels, at both ends of the range: a
   * stroke under it is lifted onto it and a *gap* under it is opened out to it.
   * Those two are the hairlines that survive at any density, since density is
   * spacing and this is width. At 0 the floors are gone and the dither is plain.
   *
   * Its range runs well past a legibility fix, because it does not stay one. As
   * the floors close on each other the tones between them are squeezed out, and
   * a veil goes from graded to two-level — every mark either a minimum stroke or
   * a minimum gap. That is a look, not a failure, and it is the far end of the
   * only slider in the group that speaks in the pen's units rather than the
   * field's. They meet at a tone of 0.4, where the picture stops changing.
   *
   * `veilHatchBreak` is the fraction of the surface where no stroke is drawn at
   * all, cut from a one-octave noise, and `veilHatchGrainScale` is that noise's
   * scale — so break is how much is gone and the scale is how big the gaps are. At
   * 0 nothing is cut and the mode is plain line hatching; at 1 only solid tone
   * survives. Each phase breaks on its own offset of the noise, and the second
   * offset does double duty: it is also what displaces the tone's strokes off
   * the silhouette's.
   *
   * A patch that is cut still fills at solid tone, which is what keeps a dense
   * cloud from going holey. That is Christoph's screen, over a near-binary mask
   * rather than over the raw noise — the raw form only shortens strokes, and
   * shortened strokes on two crossed rulings is the net again.
   *
   * `veilHatchShade` is how many ramp slots `veilKey` walks from `veilTone`
   * toward ink as the surface turns from the light. At 0 the veil is one flat
   * ink, the key does nothing to it, and the woven phase never draws.
   *
   * Two knobs cost the seven-ink guarantee, and they are not the same knob
   * twice. `veilHatchSoften` blurs each mark's *edge* over that many pixels and
   * leaves its middle pure; `veilHatchAlpha` thins the whole sheet evenly and
   * leaves every edge as hard as it was, so the faceted read survives it. Both
   * invent a grey between the ink and the ground the way mode 0 does, both are
   * authored per world, and alpha is the one to reach for first: at full weight
   * the hatch has only its density to say anything with, and density is already
   * carrying the silhouette. The outline is never thinned — a line at part
   * weight is a smudge.
   *
   * Soften does nothing at either end of a tone's range — bare stays bare and
   * solid stays unbroken — and it widens `veilHatchWidth`'s floors by its own
   * reach, so a hairline is blurred rather than blurred away. Both matter at the
   * settings that make it visible: a blur that ran off the top of the ruling
   * would draw a pale line down the middle of every gap in solid ink, and one
   * that ate the floor would take the hairline with it.
   */
  veilHatchDensity: number;
  veilHatchWidth: number;
  veilHatchAlpha: number;
  veilHatchBreak: number;
  veilHatchGrainScale: number;
  veilHatchShade: number;
  veilHatchSoften: number;

  /** Motion. */
  spin: number;

  /**
   * How the world is held: three angles, applied outermost first so each means
   * the same thing whatever the other two are. The key is view-space, so none of
   * them moves the light — the world turns under it.
   *
   * `tilt` tips the pole at the camera: foreshortening, not a move across the
   * screen. `lean` is its lean in the screen plane, positive to the right,
   * outside the tilt so it stays a screen lean. `turn` is which face is forward,
   * inside the tilt and outside the spin — a starting phase on a world that
   * turns, the whole choice of what a seed shows on one that does not.
   */
  tilt: number;
  lean: number;
  turn: number;
}

export type VisualGroup =
  'Shape' | 'Caps' | 'Texture' | 'Shade' | 'Outline' | 'Core' | 'Veil' | 'Motion';

export interface VisualParam {
  key: keyof PlanetVisual;
  label: string;
  group: VisualGroup;
  min: number;
  max: number;
  step: number;
  /** Rebuilding geometry is the only expensive change, so it is marked rather than guessed. */
  shape?: true;
}

/** The lab's whole control surface. A new knob is a line here and a uniform. */
export const VISUAL_PARAMS: VisualParam[] = [
  // Not `shape` — the mesh is identical at every value. What moves is what
  // stands on it, which is why the body's own sliders cannot say this.
  { key: 'size', label: 'Size', group: 'Shape', min: 0.25, max: 4, step: 0.05 },
  { key: 'frequency', label: 'Frequency', group: 'Shape', min: 0.2, max: 8, step: 0.05, shape: true },
  { key: 'octaves', label: 'Octaves', group: 'Shape', min: 1, max: 6, step: 1, shape: true },
  { key: 'lacunarity', label: 'Lacunarity', group: 'Shape', min: 1, max: 4, step: 0.05, shape: true },
  { key: 'gain', label: 'Gain', group: 'Shape', min: 0, max: 1, step: 0.01, shape: true },
  { key: 'ridge', label: 'Ridge', group: 'Shape', min: 0, max: 1, step: 0.01, shape: true },
  { key: 'warp', label: 'Warp', group: 'Shape', min: 0, max: 0.6, step: 0.005, shape: true },
  { key: 'strata', label: 'Strata', group: 'Shape', min: 0, max: 1, step: 0.01, shape: true },
  { key: 'strataFrequency', label: 'Strata bands', group: 'Shape', min: 1, max: 12, step: 0.5, shape: true },
  { key: 'amplitude', label: 'Amplitude', group: 'Shape', min: -0.6, max: 0.6, step: 0.005, shape: true },
  { key: 'clip', label: 'Clip', group: 'Shape', min: 0, max: 1, step: 0.01, shape: true },
  { key: 'detail', label: 'Detail', group: 'Shape', min: 1, max: 48, step: 1, shape: true },

  { key: 'caps', label: 'Caps', group: 'Caps', min: 0, max: 1, step: 0.01, shape: true },
  { key: 'capSkirt', label: 'Skirt', group: 'Caps', min: -1, max: 1, step: 0.01, shape: true },
  { key: 'capSwell', label: 'Swell', group: 'Caps', min: 0, max: 1, step: 0.01, shape: true },
  { key: 'capSwellBands', label: 'Swell bands', group: 'Caps', min: 1, max: 16, step: 0.5, shape: true },
  { key: 'capCoarse', label: 'Coarse count', group: 'Caps', min: 0, max: 8, step: 1, shape: true },
  { key: 'capCoarseSize', label: 'Coarse size', group: 'Caps', min: 0.05, max: 1.4, step: 0.01, shape: true },
  { key: 'capCoarseLift', label: 'Coarse lift', group: 'Caps', min: -1, max: 1, step: 0.01, shape: true },
  { key: 'capMid', label: 'Mid count', group: 'Caps', min: 0, max: 16, step: 1, shape: true },
  { key: 'capMidSize', label: 'Mid size', group: 'Caps', min: 0.03, max: 0.8, step: 0.005, shape: true },
  { key: 'capMidLift', label: 'Mid lift', group: 'Caps', min: -1, max: 1, step: 0.01, shape: true },
  { key: 'capFine', label: 'Fine count', group: 'Caps', min: 0, max: 32, step: 1, shape: true },
  { key: 'capFineSize', label: 'Fine size', group: 'Caps', min: 0.02, max: 0.4, step: 0.005, shape: true },
  { key: 'capFineLift', label: 'Fine lift', group: 'Caps', min: -1, max: 1, step: 0.01, shape: true },

  { key: 'land', label: 'Land', group: 'Texture', min: 0, max: 1.5, step: 0.01 },
  { key: 'bias', label: 'Bias', group: 'Texture', min: -0.6, max: 0.6, step: 0.01 },
  { key: 'steps', label: 'Steps', group: 'Texture', min: 1, max: 8, step: 1 },
  { key: 'toneFloor', label: 'Tone floor', group: 'Texture', min: 0, max: 6, step: 1 },
  { key: 'toneCeil', label: 'Tone ceiling', group: 'Texture', min: 0, max: 6, step: 1 },
  { key: 'contour', label: 'Contour px', group: 'Texture', min: 0, max: 4, step: 0.25 },
  { key: 'contourTone', label: 'Contour lit', group: 'Texture', min: 0, max: 6, step: 1 },
  { key: 'contourShadowTone', label: 'Contour shadow', group: 'Texture', min: 0, max: 6, step: 1 },
  { key: 'grain', label: 'Grain', group: 'Texture', min: 0, max: 2, step: 0.01 },
  // Shared with `shadeGrain`, and sat here because this is where a grain is
  // first reached for. One noise under both — see the field's comment.
  { key: 'grainScale', label: 'Grain scale', group: 'Texture', min: 4, max: 80, step: 0.5 },

  { key: 'shadeDepth', label: 'Shade depth', group: 'Shade', min: -6, max: 6, step: 0.5 },
  { key: 'shadeSteps', label: 'Shade steps', group: 'Shade', min: 1, max: 6, step: 1 },
  { key: 'shadeGrain', label: 'Shade grain', group: 'Shade', min: 0, max: 2, step: 0.01 },
  { key: 'relief', label: 'Relief', group: 'Shade', min: -0.6, max: 0.6, step: 0.005, shape: true },
  { key: 'key', label: 'Key', group: 'Shade', min: 0, max: 1.5, step: 0.01 },
  { key: 'rim', label: 'Rim', group: 'Shade', min: -1.5, max: 1.5, step: 0.01 },
  { key: 'rimGamma', label: 'Rim sharpness', group: 'Shade', min: 0.25, max: 10, step: 0.05 },

  { key: 'outline', label: 'Outline px', group: 'Outline', min: 0, max: 8, step: 0.25 },
  { key: 'outlineTone', label: 'Outline tone', group: 'Outline', min: 0, max: 6, step: 1 },

  // Not one `shape` here either: the window is a cut in the body's own fragment
  // and the core is a sphere of its own, so nothing in the group rebuilds a mesh.
  { key: 'clarity', label: 'Clarity', group: 'Core', min: 0, max: 1, step: 0.01 },
  { key: 'clarityGamma', label: 'Clarity falloff', group: 'Core', min: 0.25, max: 8, step: 0.05 },
  { key: 'claritySteps', label: 'Clarity bands', group: 'Core', min: 2, max: 12, step: 1 },
  { key: 'core', label: 'Core', group: 'Core', min: 0, max: 0.8, step: 0.005 },
  // 1 is the core it was: full from the first frame, whatever has merged.
  { key: 'coreSeed', label: 'Core seed', group: 'Core', min: 0, max: 1, step: 0.01 },
  { key: 'coreFeather', label: 'Core feather', group: 'Core', min: 0, max: 8, step: 0.05 },
  { key: 'coreHatchDensity', label: 'Core hatch density', group: 'Core', min: 2, max: 40, step: 0.5 },
  { key: 'coreHatchWidth', label: 'Core hatch px', group: 'Core', min: 0, max: 6, step: 0.25 },
  // Past 1 the middle is thinned rather than emptied — see the field's note.
  { key: 'coreHatchReach', label: 'Core hatch reach', group: 'Core', min: 0.05, max: 2, step: 0.01 },

  // Not one `shape` in the group, and that is the point: the shell borrows the
  // body's geometry and its field lives in the fragment, so every slider here
  // is a uniform write and nothing under it rebuilds a mesh.
  { key: 'veil', label: 'Veil', group: 'Veil', min: 0, max: 1, step: 0.01 },
  { key: 'veilInk', label: 'Composite', group: 'Veil', min: 0, max: 1, step: 1 },
  { key: 'veilTone', label: 'Veil tone', group: 'Veil', min: 0, max: 6, step: 1 },
  { key: 'veilHeight', label: 'Veil height', group: 'Veil', min: 0.005, max: 0.25, step: 0.005 },
  { key: 'veilFrequency', label: 'Veil frequency', group: 'Veil', min: 0.025, max: 10, step: 0.025 },
  { key: 'veilOctaves', label: 'Veil octaves', group: 'Veil', min: 1, max: 5, step: 1 },
  { key: 'veilGain', label: 'Veil gain', group: 'Veil', min: 0, max: 1, step: 0.01 },
  { key: 'veilWarp', label: 'Veil warp', group: 'Veil', min: 0, max: 2, step: 0.005 },
  { key: 'veilBands', label: 'Veil bands', group: 'Veil', min: 0, max: 1, step: 0.01 },
  { key: 'veilBandFrequency', label: 'Veil band freq', group: 'Veil', min: 1, max: 16, step: 0.5 },
  { key: 'veilCoverage', label: 'Coverage', group: 'Veil', min: 0, max: 1, step: 0.01 },
  { key: 'veilEdge', label: 'Veil edge', group: 'Veil', min: 0, max: 0.5, step: 0.005 },
  { key: 'veilOutline', label: 'Veil outline px', group: 'Veil', min: 0, max: 4, step: 0.25 },
  { key: 'veilOutlineTone', label: 'Veil outline tone', group: 'Veil', min: 0, max: 6, step: 1 },
  { key: 'veilPole', label: 'Veil latitude', group: 'Veil', min: 0, max: 1, step: 0.01 },
  { key: 'veilPoleEdge', label: 'Veil band width', group: 'Veil', min: 0.05, max: 2, step: 0.01 },
  { key: 'veilKey', label: 'Veil key', group: 'Veil', min: -1, max: 1, step: 0.01 },
  { key: 'veilSpin', label: 'Veil spin', group: 'Veil', min: -0.6, max: 0.6, step: 0.005 },
  { key: 'veilHatchDensity', label: 'Hatch density', group: 'Veil', min: 4, max: 60, step: 0.5 },
  { key: 'veilHatchWidth', label: 'Hairline px', group: 'Veil', min: 0, max: 12, step: 0.1 },
  { key: 'veilHatchAlpha', label: 'Hatch alpha', group: 'Veil', min: 0, max: 1, step: 0.01 },
  { key: 'veilHatchBreak', label: 'Hatch break', group: 'Veil', min: 0, max: 1, step: 0.01 },
  { key: 'veilHatchGrainScale', label: 'Hatch grain scale', group: 'Veil', min: 4, max: 80, step: 0.5 },
  { key: 'veilHatchShade', label: 'Hatch shade', group: 'Veil', min: 0, max: 4, step: 0.5 },
  { key: 'veilHatchSoften', label: 'Hatch soften px', group: 'Veil', min: 0, max: 20, step: 0.5 },

  { key: 'spin', label: 'Spin', group: 'Motion', min: -0.6, max: 0.6, step: 0.005 },
  // No row for `tilt` or `lean`: they are one puck under this one. `turn` keeps a
  // slider — it is a phase, and a phase reads along a line.
  { key: 'turn', label: 'Turn', group: 'Motion', min: -Math.PI, max: Math.PI, step: 0.01 },
];

/**
 * The puck's reach. Lean goes past the pole horizontal both ways; further is
 * upside-down, which tilt at ±0.8 cannot meet and so has no picture to pair with.
 */
export const TILT_REACH = 0.8;
export const LEAN_REACH = 1.6;

export const VISUAL_GROUPS: VisualGroup[] = [
  'Shape', 'Caps', 'Texture', 'Shade', 'Outline', 'Core', 'Veil', 'Motion',
];

export const DEFAULT_VISUAL: PlanetVisual = {
  seed: 1,

  size: 1,
  frequency: 1.8,
  octaves: 3,
  lacunarity: 2,
  gain: 0.5,
  ridge: 0,
  warp: 0,
  strata: 0,
  strataFrequency: 4,
  amplitude: 0.07,
  clip: 0,
  detail: 28,

  /** Off. The tiers below are the shape the slider opens onto, not a shape in effect. */
  caps: 0,
  capSkirt: 0.45,
  capSwell: 0.12,
  capSwellBands: 7,
  capCoarse: 3,
  capCoarseSize: 0.42,
  capCoarseLift: 1,
  capMid: 6,
  capMidSize: 0.2,
  capMidLift: 0.5,
  capFine: 7,
  capFineSize: 0.09,
  capFineLift: -0.6,

  rim: 0.7,
  rimGamma: 2.4,
  land: 0.5,
  key: 0,
  bias: -0.1,
  steps: 4,
  toneFloor: 0,
  toneCeil: 5,
  contour: 0,
  contourTone: 6,
  contourShadowTone: 6,

  /** Off, and the scale below is what the two amounts open onto. */
  grain: 0,
  shadeGrain: 0,
  grainScale: 30,

  shadeSteps: 2,
  shadeDepth: 0,
  relief: 0,

  outline: 2,
  outlineTone: 6,

  /**
   * Off. The numbers under it are a reading waiting on two sliders, and nothing
   * draws either until a view hands the world an alignment to put in the core.
   */
  clarity: 1,
  clarityGamma: 1.35,
  claritySteps: 4,
  core: 0.8,
  coreSeed: 0.72,
  coreFeather: 0.2,
  coreHatchDensity: 18,
  coreHatchWidth: 2.25,
  coreHatchReach: 0.98,

  /** Off, and the numbers below are the cloud reading the slider opens onto. */
  veil: 0,
  veilInk: 0,
  veilTone: 0,
  veilHeight: 0.03,
  veilFrequency: 2.6,
  veilOctaves: 4,
  veilGain: 0.55,
  veilWarp: 0.28,
  veilBands: 0.25,
  veilBandFrequency: 5,
  veilCoverage: 0.52,
  veilEdge: 0.08,
  veilOutline: 1.5,
  veilOutlineTone: 6,
  veilPole: 0,
  veilPoleEdge: 2,
  veilKey: 0.4,
  /** Locked to the ground: a drift is a choice, and 0 is the deck riding its world. */
  veilSpin: 0,
  veilHatchDensity: 24,
  veilHatchWidth: 1,
  veilHatchAlpha: 0.85,
  veilHatchBreak: 0.45,
  veilHatchGrainScale: 30,
  veilHatchShade: 2,
  veilHatchSoften: 0,

  spin: 0.1,
  tilt: 0.2,
  lean: 0,
  turn: 0,
};

/**
 * Only the fields that change the mesh — shading edits must not rebuild it.
 * `relief` is here despite being a shading control, because it is baked into
 * the normals rather than read from a uniform.
 */
export function keyShape(visual: PlanetVisual) {
  return [
    visual.seed, visual.frequency, visual.octaves, visual.lacunarity, visual.gain,
    visual.ridge, visual.warp, visual.strata, visual.strataFrequency,
    visual.amplitude, visual.clip, visual.relief, visual.detail,
    visual.caps, visual.capSkirt, visual.capSwell, visual.capSwellBands,
    visual.capCoarse, visual.capCoarseSize, visual.capCoarseLift,
    visual.capMid, visual.capMidSize, visual.capMidLift,
    visual.capFine, visual.capFineSize, visual.capFineLift,
  ].join('/');
}

export function cloneVisual(visual: PlanetVisual): PlanetVisual {
  return { ...visual };
}

/**
 * How much of its radius the core is drawn at, given the share of the swarm
 * given to it. The mark is built out of what has arrived, so it has a size only
 * once something has.
 *
 * **The cube root is a floor, not the curve.** The berths fill from the middle
 * outward by volume and the outermost occupied one sits at exactly `cbrt(share)`
 * of the radius — see `berthOf` — so that is the sphere that wraps what has
 * landed, and the drawn one may never go under it or the core is inside its own
 * souls. It is a *bound*, and the whole of what it has to say.
 *
 * Above it the shape is free, and it is a **straight line** from the seed. The
 * root was the curve for a while and read as a lurch: its slope at nothing is
 * infinite, so the first hair of the slider was worth more of the ball than the
 * whole back half of it, and the mark jumped rather than grew. At the seeds
 * shipping now the line clears the bound everywhere — they meet only at a full
 * harvest, where both are the whole radius — so the `max` below never fires. It
 * is there for a seed dragged low in the lab, which is the one case where the
 * wrap is the larger of the two and has to win.
 *
 * `seed` is a floor under all of it — a core at nothing is a reading nobody can
 * take, and the lean is the whole of what this mark says. It is also the one
 * knob on **how much the split moves this mark at all**: the travel is whatever
 * is left above it, so a high seed is a core mostly already there that answers
 * the slider with a nudge. It reaches the sphere alone — the window has its own
 * floor in `CLARITY_SHUT`, and the two are kept apart on purpose.
 *
 * The berths themselves are packed against the **full** radius and never move.
 * This grows over them.
 */
export function coreFillOf(share: number, seed: number) {
  const at = Math.max(0, Math.min(1, share));
  const floor = Math.max(0, Math.min(1, seed));

  return Math.max(floor + (1 - floor) * at, Math.cbrt(at));
}

/**
 * How much tighter the window is shut with **nothing** merged, as a multiple of
 * the authored falloff. One number for every world: the window is the core's
 * other half and the core's inks are fixed for the same reason — this is a
 * reading of the harvest, not a world's character. Worlds may still differ in
 * how open they get, which is what `clarityGamma` itself is.
 *
 * The full multiple is only seen at a split of nothing, which a tolled harvest
 * does not offer — at the lightest toll shipping, the window starts a little
 * inside it and opens from there.
 */
export const CLARITY_SHUT = 3.6;

/**
 * The window's falloff at a given merge, from a world's authored one. Authored
 * is the **open** end — the lab judges a full harvest — and the split walks the
 * rim in from there toward a clearing dead centre.
 *
 * Straight in the split, and on nothing of the core's. It was briefly driven off
 * the core's drawn radius, on the reading that a front should only dissolve as
 * far as there is a sphere behind it — and that put both marks on `coreSeed`,
 * where every move to settle one of them dragged the other off. How big the core
 * is and how far open the window goes are two authorial wants, so they get a
 * knob each: `coreSeed` for the sphere, `CLARITY_SHUT` for the window. Nothing
 * is left here that wants a cube root: that curve is the berths' and it is the
 * berths' alone.
 *
 * Spent as a *power* rather than a lerp because gamma is an exponent — halving
 * it and doubling it have to be the same size of move. Which is also what makes
 * the ends carry: a straight walk through an exponent is an even-feeling one,
 * so the whole of the multiple is spent on the whole of the slider instead of
 * being used up in the first inch.
 */
export function clarityGammaOf(gamma: number, share: number) {
  const at = Math.max(0, Math.min(1, share));

  return gamma * CLARITY_SHUT ** (1 - at);
}

/**
 * A hairline, against the 2px every world ships. `bleed` is `outline / zoom`
 * and `zoom` is `px / frame`, so the same ink is 0.8% of the body radius at
 * 400px and around 9% at a 48px row — seven times the weight for no edit. One
 * pixel is a list row's ink, and it belongs to the still rather than to the
 * nine records.
 *
 * The other end of the same argument is `scaleInk`: shrink the widget and the
 * line is held, push in and it comes along.
 */
export const STILL_OUTLINE = 1;

/**
 * The world's drawn radius on the detail stage — 355px of box over `frame` 3.2
 * — and so the size every px-authored mark on a `PlanetVisual` was last judged
 * at. Kept here rather than read off `PlanetStage`, which is a screen and cannot
 * be imported by the widget; if that stage's box or framing moves, this moves.
 */
export const STAGE_RADIUS = 111;

/**
 * The same world drawn nearer, with its ink brought along.
 *
 * There are two ways a world can change size on screen and they want opposite
 * things. A **smaller widget** is the world further off in the same drawing, so
 * its ink holds its weight — that is what a px-authored mark is for, and why a
 * 24px row still has a legible outline. A **push-in** is the drawing itself
 * getting bigger, and there a fixed 2px line is a hairline scratched across a
 * world three times its authored size.
 *
 * Everything measured in body radii already does this for free: souls are sized
 * in radii, so `zoom` carries them and their rings with them, and the anchors
 * and sparks the same. Only the px marks are stranded, so only they are scaled.
 *
 * The four that scale are **lines** — the silhouette, the band hairline, the
 * veil's edge, the core's ruling — chosen for their weight against the world.
 * What is deliberately left alone is the **floors**: `dotFloor`,
 * `veilHatchWidth`. A floor is not a mark but a legibility rule about the
 * smallest thing this screen can draw, and a push-in is exactly the case where
 * it should stop biting. `coreHatchWidth` sits on the near side of that line
 * despite the name it shares with one: it is the stroke's own weight, and the
 * core is only ever seen at the one size that pushes in.
 *
 * `HarnessVisual.width` is px too and is not reached from here — it is its own
 * record, and no view that pushes in draws a harness yet.
 */
export function scaleInk(visual: PlanetVisual, radiusPx: number): PlanetVisual {
  const by = Math.max(0, radiusPx) / STAGE_RADIUS;

  return {
    ...visual,
    outline: visual.outline * by,
    contour: visual.contour * by,
    veilOutline: visual.veilOutline * by,
    coreHatchWidth: visual.coreHatchWidth * by,
  };
}

/**
 * The world the harvest is decided over: one disc drawn across the whole block
 * with the decision standing on it, a shade larger than the detail stage's —
 * `STAGE_RADIUS` there against this. Near enough that it is recognisably the
 * same world seen again rather than a poster of it; the screen reads as a
 * takeover because it takes the Overview whole, not because the disc is big.
 *
 * A **radius rather than a `frame`**, and that is the whole of the size. `frame`
 * is world units across the short axis, so the same number is a different planet
 * in every box, and this box is whatever the window is. The stage divides
 * instead: `frame = min(width, height) / HARVEST_RADIUS`, and the world is the
 * same size at any window it is dragged to.
 *
 * `HARVEST_ANCHOR` is where **down** the box that disc's centre sits — 0.5 is
 * the middle, and this holds it above it, because the split and the verb take
 * the foot of the block and the swarm wants the room over them. A **ratio
 * rather than a pixel count**, because the row it answers to is one: a px offset
 * would hold still while the controls moved with the window.
 */
export const HARVEST_RADIUS = 120;
export const HARVEST_ANCHOR = 0.34;

/**
 * The world as a picture rather than as a view.
 *
 * `spin` goes to nought because a snapshot is drawn on a manual frame, whose
 * delta is however long since the last one — a turning world would land on a
 * different face every capture. `veilSpin` goes with it, and for that reason
 * twice over: the veil integrates its own angle off the same wall clock, and
 * the snapshot renderer keeps one scene warm across a whole batch, so a live
 * veil would put a different sky on every world in a family strip. It takes the
 * pair to still it — the veil turns at `spin + veilSpin` — and zeroing both is
 * what leaves the sky where the body is.
 *
 * What both land on instead is `turn`, which sits outside the spin and outside
 * the veil's — so a still's sky is chosen by the slider that already chooses
 * its face, and no second field was needed for it. On the live world beside it
 * `turn` is only a starting phase the two rates walk away from at their own
 * speeds. The face is authored once, and costs the view nothing.
 *
 * `veil` itself is not dropped. A still is the world, and its weather is part
 * of the world.
 */
export function toStill(visual: PlanetVisual): PlanetVisual {
  return { ...visual, spin: 0, veilSpin: 0, outline: STILL_OUTLINE };
}

/** A TS literal, ready to paste into `$data/planet-visuals`. */
export function printVisual(id: string, visual: PlanetVisual) {
  const lines = Object.entries(visual).map(
    ([key, value]) => `    ${key}: ${Number(value.toFixed(4))},`,
  );

  return `  '${id}': {\n${lines.join('\n')}\n  },`;
}

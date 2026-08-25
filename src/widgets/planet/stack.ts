/**
 * What draws over what. Load-bearing, and read by four components, so it is
 * stated once rather than as four numbers that have to agree.
 *
 * ```
 * -3 core           the harvest's alignment, inside the world and under all of it
 * -2 body           writes depth, so the far side of everything solid is hidden
 * -1 burst          the click, the world's own shape thrown out behind it
 * 0  veil           the same shell again, over the body it is a layer on — no
 *                   depth test, and its far half is culled rather than cut
 * 1  placed anchor  depth-tested, so the solid caps the lines that end in it
 * 2  harness        no depth test — the ink rule is its whole depth cue
 *                   (quads, not lines: a line has no width to carry)
 * 3  ghost anchor   no depth test: a place does not stop existing when it turns away
 * 4  souls          discard what is behind the world themselves
 * 5  halo           the click, around the world and behind it, inverting what it crosses
 * 6  spark          the click, lying in the terrain and drawn through the body on purpose
 * 7  flare          the same spark standing up off it
 * 8  spark outline  both again, grown, on the plane behind — so the depth test
 * 9  flare outline  rejects the ink under the mark and leaves its border
 * ```
 *
 * The two outlines come *after* what they outline rather than before it. On the
 * plane behind and drawn second, every pixel the mark claimed rejects them and
 * what is left is the border of the union of all four shapes; drawn first, the
 * mark's own fade would let them back through its middle.
 *
 * The design handoff draws anchors last, at 3/4. That is reversed here because
 * its souls had no depth cue of their own; ours discard everything behind the
 * world already, so a soul that is drawn at all is in front of the surface an
 * anchor stands on and should pass over it.
 *
 * The two click marks take the top because a flash is an event: it is the
 * newest thing on screen for as long as it lasts, and anything it went behind
 * would read as having happened somewhere else.
 */
/**
 * The body is here at all because its window is an **alpha**, so the surface is
 * transparent and no longer sorts itself by being opaque. It takes the bottom
 * but one, and the core takes the bottom: everything the window is for is that
 * the core is already on screen when the front blends over it, and how much of
 * it survives is exactly the body's alpha there.
 *
 * The core is under the *outline hull* too, which is opaque and so drawn ahead
 * of both regardless. That is what the core is seen against wherever its own rim
 * has feathered away — the hull's far hemisphere in `outlineTone`, and the
 * reason the fade lands on ink rather than on paper.
 *
 * The body writes depth, at full alpha and at none. That is what keeps the burst
 * below reading the way it did when the body was opaque.
 *
 * And it puts one condition on everything above it: **a mark listed after the
 * body must be transparent too.** Three draws the whole opaque pass first and
 * sorts by `renderOrder` only within a pass, so an opaque mark above the body is
 * still drawn *before* it and painted over — the harness and both anchor
 * materials are `transparent` for that reason alone, at alpha 1 throughout.
 * Only the outline hull is exempt, and only because being ahead of both is what
 * it is for.
 */
/**
 * The burst is behind the body and drawn **after** it, which only looks like a
 * contradiction. It depth-tests on strictly-less against a body that has just
 * written its own depth, so every fragment the body covers is rejected and what
 * survives is the ring outside the silhouette — the same picture the opaque body
 * used to cut for it from the pass in front. Ordered before the veil and the
 * marks above so those still land over it.
 */
/**
 * The veil takes the body's own number rather than one of its own. It is not a
 * mark standing beside the world, it is a second surface of it — and being
 * transparent it is drawn after the whole opaque pass whatever the number says,
 * so 0 buys the reading and costs nothing. What it does buy is a place *before*
 * the harness and the souls, which stand off the world and must cross it.
 *
 * It draws over a placed anchor, which is opaque and so lands in the opaque
 * pass ahead of it. No screen draws an anchor today; if one ever does and the
 * two meet, the fix is a cut in the veil's fragment against the anchor's own
 * reach, not a depth flag — a depth test here would put the terrain back into a
 * shell that was built by discarding it.
 */
export const RENDER_ORDER = {
  core: -3,
  body: -2,
  burst: -1,
  veil: 0,
  anchor: 1,
  harness: 2,
  ghost: 3,
  soul: 4,
  halo: 5,
  spark: 6,
  flare: 7,
  sparkOutline: 8,
  flareOutline: 9,
};
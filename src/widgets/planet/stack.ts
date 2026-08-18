/**
 * What draws over what. Load-bearing, and read by four components, so it is
 * stated once rather than as four numbers that have to agree.
 *
 * ```
 * -1 burst          the click, the world's own shape thrown out behind it
 * 0  body           writes depth, so the far side of everything solid is hidden
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
 * The burst is the one negative, and it is behind the body rather than in front
 * of it — the only mark here that is. Being transparent, three draws it after
 * the opaque pass whatever this says; what the order buys is that it is first
 * among the transparent marks, so the halo and the sparks land over it.
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
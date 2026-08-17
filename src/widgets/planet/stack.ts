/**
 * What draws over what. Load-bearing, and read by four components, so it is
 * stated once rather than as four numbers that have to agree.
 *
 * ```
 * 0  body           writes depth, so the far side of everything solid is hidden
 * 1  harness        no depth test — the ink rule is its whole depth cue
 * 2  placed anchor  depth-tested, so the solid caps the lines that end in it
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
export const RENDER_ORDER = {
  harness: 1,
  anchor: 2,
  ghost: 3,
  soul: 4,
  halo: 5,
  spark: 6,
  flare: 7,
  sparkOutline: 8,
  flareOutline: 9,
};
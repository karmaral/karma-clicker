/**
 * Extended info: the roster's figures at their full reading, for as long as the
 * derivation is up.
 *
 * It is the right button's own hold — the same one that opens the panel, and the
 * same flag every row asks before it opens at all, because the box is one box and
 * holding the button across rows walks it from row to row.
 *
 * So the mode is the **table's** and not a row's. The panel can only ever argue
 * about the row you are pointing at, and the thing it costs the rest of the table
 * is the second figure in every count — so the rest of the table spells itself out
 * while you are already reading. One press, one register.
 *
 * A rune, unlike the plain flag this started as: it is read in the markup now and
 * not only inside tippy's hooks. Written from event handlers and never from an
 * effect, so nothing loops.
 */

let active = $state(false);

export const extended = {
  get active() { return active; },

  open() { active = true; },
  close() { active = false; },
};

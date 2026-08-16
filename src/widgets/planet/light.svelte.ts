/**
 * Where the key comes from. There is one fake light in the system, so it is a
 * token rather than a property of a world — the same standing the ink ramp has,
 * and read the same ambient way. Worlds still choose how much of it they take,
 * through `key`; only the aim is shared.
 *
 * Held in view space, so a planet turns under the light instead of carrying it
 * around. `x`/`y` are the direction projected on screen, inside the unit disc.
 */
const AUTHORED = { x: 0.619, y: 0.622 };

const aim = $state({ ...AUTHORED });

export const keyLight = {
  get x() { return aim.x; },
  get y() { return aim.y; },

  /**
   * The unit direction. z is whatever is left over, so the centre of the disc
   * points straight at the camera and the rim lies in the screen plane.
   */
  get direction() {
    const reach = Math.hypot(aim.x, aim.y);
    const scale = reach > 1 ? 1 / reach : 1;
    const x = aim.x * scale;
    const y = aim.y * scale;

    return { x, y, z: Math.sqrt(Math.max(0, 1 - x * x - y * y)) };
  },

  /** Clamped to the unit disc — outside it there is no z left to point with. */
  point(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const reach = Math.hypot(x, y);
    const scale = reach > 1 ? 1 / reach : 1;

    aim.x = x * scale;
    aim.y = y * scale;
  },

  revert() {
    Object.assign(aim, AUTHORED);
  },
};

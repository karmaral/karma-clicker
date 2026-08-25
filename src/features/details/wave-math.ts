/** The bezier the wave is drawn from — shared by the full and compact views. */

export const H = 70;
export const MID = H / 2;
export const AMP = H * 0.371;
const CTRL = (4 / 3) * AMP;

const r = (n: number) => Math.round(n * 100) / 100;

export function ctrlY(i: number, k: number) {
  return MID + (i % 2 === 1 ? CTRL : -CTRL) * k;
}

export function buildWavePath(phases: number, W: number, k: number) {
  const seg = W / phases;
  let d = `M0,${MID} C${r(seg / 3)},${r(ctrlY(0, k))} ${r((2 * seg) / 3)},${r(ctrlY(0, k))} ${seg},${MID}`;
  for (let i = 1; i < phases; i++) {
    d += ` S${r(i * seg + (2 * seg) / 3)},${r(ctrlY(i, k))} ${r((i + 1) * seg)},${MID}`;
  }
  return d;
}

export function markerY(phases: number, position: number, k: number) {
  const g = position * phases;
  const i = Math.min(phases - 1, Math.floor(g));
  const t = g - i;
  return MID * ((1 - t) ** 3 + t ** 3) + 3 * ctrlY(i, k) * t * (1 - t);
}

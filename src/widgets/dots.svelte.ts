import { DOT_TYPE_KEYS, type DotType } from './dot-types';

export const dotCapacity = 100;

export const currentDots = $state<Record<DotType, number>>(emptyCounts());

function emptyCounts(): Record<DotType, number> {
  const counts = {} as Record<DotType, number>;
  for (const type of DOT_TYPE_KEYS) {
    counts[type] = 0;
  }
  return counts;
}

export function setDots(counts: Partial<Record<DotType, number>>) {
  for (const type of DOT_TYPE_KEYS) {
    currentDots[type] = Math.max(0, Math.min(dotCapacity, counts[type] ?? 0));
  }
}

export function setDotCount(type: DotType, value: number) {
  const clamped = Math.max(0, Math.min(dotCapacity, Math.floor(value)));
  const others = DOT_TYPE_KEYS.filter((t) => t !== type);
  const othersTotal = others.reduce((sum, t) => sum + (currentDots[t] ?? 0), 0);
  const remainder = dotCapacity - clamped;

  currentDots[type] = clamped;

  let used = 0;
  others.forEach((t, i) => {
    const weight = othersTotal > 0 ? (currentDots[t] ?? 0) / othersTotal : 1 / others.length;
    const raw = remainder * weight;
    const v = i === others.length - 1 ? remainder - used : Math.max(0, Math.floor(raw));
    currentDots[t] = v;
    used += v;
  });
}

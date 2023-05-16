import type { Polarity } from '$types';

export function formatRounded(ms: number, size = 1) {
  const s = 10 ** size;
  return Math.round(ms * s) / s;
}
export const numberFormat = Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  maximumSignificantDigits: 5,
});


// p r o o m p t
export function formatNumber(val: number, floats = 2, useLongForm = false) {
  const suffixes = useLongForm
    ? ['', ' thousand', ' million', ' billion', ' trillion', ' quadrillion', ' quintillion', ' sextillion', ' septillion', ' octillion', ' nonillion' ]
    : ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
  const prefixes = useLongForm
    ? ['', 'un', 'duo', 'tre', 'quattuor', 'quin', 'sex', 'septen', 'octo', 'novem']
    : ['', 'Un', 'Do', 'Tr', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
  const base = 1000;
  let notationValue = '';
  if (!isFinite(val)) {
    return 'Infinity';
  }
  if (val >= base ** suffixes.length) {
    return 'Infinity';
  }
  if (val >= base) {
    let baseIndex = 1;
    while (val >= base ** (baseIndex + 1)) {
      baseIndex++;
    }
    notationValue = suffixes[baseIndex];
    val /= base ** baseIndex;
  }
  return (
    (Math.round(val * 10 ** floats) / 10 ** floats).toString().replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ','
    ) + notationValue
  );
}


export function withinRange(val: number, min: number, max: number) {
  return val >= min && val < max;
}

export function compoundScale(initial: number, times: number, multiplier: number) {
  return initial * (1 + multiplier) ** (times - 1);
}
export function compoundSum(initial: number, times: number, multiplier: number) {
  let total = compoundScale(initial, 1, multiplier);

  for (let i = 1; i < times; ++i) {
    total += compoundScale(total, 1, multiplier);
  }
  return total;
}

export function multPow10(x: number, n: number) {
  const multiplier = Math.pow(10, n);
  return x * multiplier;
}

export function getUpgradeTypeLabel(id: string) {
  if (id.startsWith('core')) {
    return id === 'core_0' ? 'Blueprint': 'Core';
  }
  return 'Enhancement';
}

export function getPolarityLabel(p: Polarity) {
  switch(p) {
    case 1:
      return 'positive';
    case 0:
      return 'neutral';
    case -1:
      return 'negative';
    default: break;
  }
}

export function randomPolarity() {
  return Math.random() * 2 - 1;
}

export function biasedPolarity(bias: number) {
  const random = Math.random();
  const chance = bias === 0 ? 0.5 : (1 + bias) / 2;
  return random < chance ? 1 : -1;
}

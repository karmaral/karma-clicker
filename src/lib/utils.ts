import type { Polarity } from '$types';

export function formatRounded(ms: number, size = 1) {
  const s = 10 ** size;
  return Math.round(ms * s) / s;
}
export const numberFormat = Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  maximumSignificantDigits: 5,
});


const BASE = 1000;

/** Digits carry themselves this far; commas already group them. */
const SUFFIX_FLOOR = BASE ** 2;
/** Padded, so a figure holds its width as it ticks: 1.06M, not 1.1M. Two, not
 *  three — the header has no room for a third and the tail says little. */
const SCALED_DECIMALS = 2;

/**
 * Below the suffix floor, where the integer is the figure: 1.23, 12.3, 123. A
 * decimal earns its place under a hundred — past that the integer has already
 * said it and the tail is noise you cannot act on.
 */
function decimalsFor(val: number) {
  const abs = Math.abs(val);
  if (abs < 10) return 2;
  if (abs < 100) return 1;
  return 0;
}

// p r o o m p t
export function f(val: number, floats?: number, useLongForm = false) {
  const suffixes = useLongForm
    ? ['', ' thousand', ' million', ' billion', ' trillion', ' quadrillion', ' quintillion', ' sextillion', ' septillion', ' octillion', ' nonillion' ]
    : ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
  const prefixes = useLongForm
    ? ['', 'un', 'duo', 'tre', 'quattuor', 'quin', 'sex', 'septen', 'octo', 'novem']
    : ['', 'Un', 'Do', 'Tr', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
  if (!isFinite(val)) {
    return 'Infinity';
  }
  if (val >= BASE ** suffixes.length) {
    return 'Infinity';
  }

  let baseIndex = 0;
  if (val >= SUFFIX_FLOOR) {
    baseIndex = 2;
    while (val >= BASE ** (baseIndex + 1)) {
      baseIndex++;
    }
    val /= BASE ** baseIndex;
  }

  const decimals = floats ?? (baseIndex ? SCALED_DECIMALS : decimalsFor(val));
  let rounded = Math.round(val * 10 ** decimals) / 10 ** decimals;

  // Rounding can carry past the scale it was measured at: 999.9999M is
  // 1000.000M once its decimals land, a figure nobody writes. Step the suffix.
  if (baseIndex === 0 && rounded >= SUFFIX_FLOOR) {
    rounded /= SUFFIX_FLOOR;
    baseIndex = 2;
  } else if (baseIndex && rounded >= BASE && baseIndex + 1 < suffixes.length) {
    rounded /= BASE;
    baseIndex++;
  }

  const digits = baseIndex
    ? rounded.toFixed(floats ?? SCALED_DECIMALS)
    : rounded.toString();

  return (
    digits.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ','
    ) + suffixes[baseIndex]
  );
}

/**
 * A price, rounded the way a price has to round: never below what you will be
 * charged. A rate that reads low is an estimate; a cost that reads low is a
 * button that does nothing when you press it.
 */
export function formatCost(val: number) {
  if (!isFinite(val) || val <= 0) return f(val);
  if (val < BASE) {
    const step = 10 ** -decimalsFor(val);

    return f(Math.ceil(val / step) * step);
  }
  if (val < SUFFIX_FLOOR) return f(Math.ceil(val));

  const scale = BASE ** Math.floor(Math.log10(val) / 3);
  const step = scale / 10 ** SCALED_DECIMALS;

  return f(Math.ceil(val / step) * step);
}


/** A countdown, mm:ss. Clamped at zero — a batch already landed reads 00:00. */
export function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * A length of time, as you would say it: `4m 10s`, `50s`, `1h 2m`. Two units at
 * most and never a leading zero — `formatClock` is a countdown, where the digits
 * hold still because they are being watched, and a span is read once.
 */
export function formatSpan(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total}s`;

  const minutes = Math.floor(total / 60);
  if (minutes < 60) {
    const seconds = total % 60;

    return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

const NUMERALS: [number, string][] = [
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

/**
 * A rung, not a quantity. Upgrade titles number themselves this way — `Shorter
 * Lives I` — so anything sharing that shelf has to. Falls back to the digits
 * past X, where a numeral stops being read and starts being decoded.
 */
export function roman(value: number) {
  if (!Number.isFinite(value) || value < 1 || value > 10) return String(value);

  let left = Math.trunc(value);

  return NUMERALS.reduce((out, [figure, numeral]) => {
    while (left >= figure) {
      left -= figure;
      out += numeral;
    }

    return out;
  }, '');
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

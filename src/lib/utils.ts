import type { Polarity } from '$types';
export function formatRounded(ms: number, size = 1) {
  const s = 10 ** size;
  return Math.round(ms * s) / s;
}
export const numberFormat = Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  maximumSignificantDigits: 5,
});

export function formatNumber(num: number, useLongFormSuffixes = true): string {
  const shortUnits = ['', 'k', 'M', 'B', 'T', 'q', 'Q', 's', 'S', 'O', 'N', 'D', 'U', 'd', 'T', 'q', 'Q', 's', 'S', 'O', 'N', 'V', 'c'];
  const longUnits = ['', 'thousand', 'million', 'billion', ' trillion', 'quadrillion', 'quintillion','sextillion', 'septillion', 'octillion', 'nonillion', 'decillion', 'undecillion', 'duodecillion', 'tredecillion', 'quattuordecillion', 'quindecillion', 'sexdecillion', 'septendecillion', 'octodecillion', 'novemdecillion', 'vigintillion', 'centillion'];
  const units = useLongFormSuffixes ? longUnits : shortUnits;
  const exponent = Math.floor(Math.log10(num));
  const unitIndex = exponent >= 0 ? Math.floor(exponent / 3) : Math.ceil(exponent / 3);
  const unit = units[unitIndex] ?? '';
  let mantissa: string;
  if (num < 1000) {
    mantissa = formatRounded(num, 2).toString();
  } else {
    mantissa = (num / Math.pow(10, unitIndex * 3)).toFixed(3).replace(/\.?0+$/, '');
  }
  return `${mantissa}${useLongFormSuffixes ? ' ' : ''}${unit}`.trimEnd();
}


export function withinRange(val: number, min: number, max: number) {
  return val >= min && val < max;
}

export function compoundScale(initial: number, times: number, multiplier: number) {
  return initial * (1 + multiplier) ** (times - 1);
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

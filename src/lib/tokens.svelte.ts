/**
 * The grades above the refinery, and the only place matching happens. The
 * refinery is throughput and never pairs anything off; yellow is bought by
 * pairing the two reds, blue by spending yellow, and either red by spending its
 * opposite at a price that only ever climbs.
 *
 * Not a producer, so it composes no `ResourceEmitter`: nothing here runs on a
 * clock. A purchase is a click, which is why the layer needs a buyer at all.
 */

import { ResourceManager } from '$lib/managers';
import { getPolarityLabel } from '$lib/utils';
import type { Polarity, ResourceType } from '$types';

/**
 * Red from **each** pile, per yellow — the figure is per side, not the total, so
 * what the button reads is what a pile loses. Placeholder figure.
 */
const YELLOW_PRICE = 1500;

/** Yellow per blue. Placeholder figure. */
const BLUE_PRICE = 3000;

/**
 * Opposite red for the first single unit inverted. Flat prices above; this one
 * scales, because it is the only purchase that must never become the cheap way
 * to run a single polarity. Placeholder figures.
 */
const INVERSION_BASE = 24;

const INVERSION_GROWTH = 1.25;

function redFor(polarity: Polarity) {
  return `red_${getPolarityLabel(polarity)}` as ResourceType;
}

/** The pile an inversion is paid out of, given the one it fills. */
function oppositeOf(polarity: Polarity): Polarity {
  return polarity > 0 ? -1 : 1;
}

class Tokens {
  /**
   * Never resets — not on harvest, not on reaching. Each inversion is a
   * confession and makes the next dearer for the rest of the run.
   */
  #inversions = $state(0);

  #posRed = $derived(ResourceManager.getAmount('red_positive'));
  #negRed = $derived(ResourceManager.getAmount('red_negative'));
  #yellow = $derived(ResourceManager.getAmount('yellow'));

  /**
   * Cumulative over the counter, the same shape `Building.#cumulativePrice`
   * uses. Deliberately a second loop rather than a shared helper: that curve
   * prices a building and this one prices a confession, and they are allowed to
   * diverge. Each step rounded before it is added, like that one — a price is a
   * whole number, and one at a time must total what the batch charges.
   */
  inversionCost(n = 1) {
    let sum = 0;

    for (let i = 0; i < n; i++) {
      sum += Math.round(INVERSION_BASE * INVERSION_GROWTH ** (this.#inversions + i));
    }

    return sum;
  }

  /** Both piles pay, so a partial purchase is not a thing — pairing is the point. */
  purchaseYellow(n = 1) {
    const price = n * YELLOW_PRICE;
    if (n < 1) return;
    if (this.#posRed < price || this.#negRed < price) return;

    ResourceManager.remove('red_positive', price);
    ResourceManager.remove('red_negative', price);
    ResourceManager.add('yellow', n);

    return true;
  }

  purchaseBlue(n = 1) {
    const price = n * BLUE_PRICE;
    if (n < 1) return;
    if (this.#yellow < price) return;

    ResourceManager.remove('yellow', price);
    ResourceManager.add('blue', n);

    return true;
  }

  /** Named for where it lands, because the row it sits on is the destination. */
  invert(to: Polarity, n = 1) {
    if (n < 1) return;

    const cost = this.inversionCost(n);
    const from = redFor(oppositeOf(to));
    if (ResourceManager.getAmount(from) < cost) return;

    ResourceManager.remove(from, cost);
    ResourceManager.add(redFor(to), n);
    this.#inversions += n;

    return true;
  }

  canInvert(to: Polarity, n = 1) {
    return ResourceManager.getAmount(redFor(oppositeOf(to))) >= this.inversionCost(n);
  }

  canPurchaseYellow(n = 1) {
    const price = n * YELLOW_PRICE;

    return this.#posRed >= price && this.#negRed >= price;
  }

  canPurchaseBlue(n = 1) {
    return this.#yellow >= n * BLUE_PRICE;
  }

  /** The ladder teaches itself: the grade opens once the one below it exists. */
  get isBlueUnlocked() {
    return this.#yellow > 0;
  }

  get yellowPrice() { return YELLOW_PRICE; }
  get bluePrice() { return BLUE_PRICE; }

  /** The inversion price's only input. */
  get inversions() { return this.#inversions; }

  restore(inversions: number) {
    this.#inversions = inversions;
  }

  /** How many of this red the opposite pile can pay for, one at a time — the curve is geometric. */
  getMaxInvert(to: Polarity) {
    const balance = ResourceManager.getAmount(redFor(oppositeOf(to)));
    let n = 0;

    while (this.inversionCost(n + 1) <= balance) n++;

    return n;
  }

  /** Flat prices, so the ceiling is a straight division — no scan needed. */
  getMaxYellow() {
    return Math.floor(Math.min(this.#posRed, this.#negRed) / YELLOW_PRICE);
  }

  getMaxBlue() {
    return Math.floor(this.#yellow / BLUE_PRICE);
  }
}

export const tokens = new Tokens();

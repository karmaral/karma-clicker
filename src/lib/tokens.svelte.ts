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
const YELLOW_PRICE = 12;

/** Yellow per blue. Placeholder figure. */
const BLUE_PRICE = 12;

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
   * diverge.
   */
  inversionCost(n = 1) {
    let sum = 0;

    for (let i = 0; i < n; i++) {
      sum += INVERSION_BASE * INVERSION_GROWTH ** (this.#inversions + i);
    }

    return sum;
  }

  /** Both piles pay, so a partial buy is not a thing — pairing is the point. */
  buyYellow(n = 1) {
    const price = n * YELLOW_PRICE;
    if (n < 1) return;
    if (this.#posRed < price || this.#negRed < price) return;

    ResourceManager.remove('red_positive', price);
    ResourceManager.remove('red_negative', price);
    ResourceManager.add('yellow', n);

    return true;
  }

  buyBlue(n = 1) {
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

  canInvert(to: Polarity) {
    return ResourceManager.getAmount(redFor(oppositeOf(to))) >= this.inversionCost(1);
  }

  get canBuyYellow() {
    return this.#posRed >= YELLOW_PRICE && this.#negRed >= YELLOW_PRICE;
  }

  get canBuyBlue() {
    return this.#yellow >= BLUE_PRICE;
  }

  /** The ladder teaches itself: the grade opens once the one below it exists. */
  get isBlueUnlocked() {
    return this.#yellow > 0;
  }

  get yellowPrice() { return YELLOW_PRICE; }
  get bluePrice() { return BLUE_PRICE; }

  /** The inversion price's only input. */
  get inversions() { return this.#inversions; }
}

export const tokens = new Tokens();

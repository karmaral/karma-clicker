/**
 * The handle a rail hands the panels inside it. Which one is open is the rail's
 * to know, so opening one closes the last without either panel hearing about it.
 */

export const RAIL = Symbol('lab-rail');

export interface Rail {
  /** Registers a panel. The first to ask is the one that starts open. */
  claim(id: symbol): void;
  isOpen(id: symbol): boolean;
  toggle(id: symbol): void;
}

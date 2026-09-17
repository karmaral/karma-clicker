import tippy, { createSingleton } from 'tippy.js';
import type { CreateSingletonInstance, Instance, Props } from 'tippy.js';

type TooltipOptions = Partial<Props>;

export class TooltipManager {
  #singleton: CreateSingletonInstance | undefined;
  #options: Record<string, unknown>;
  #singletonOptions: TooltipOptions;
  #instances: Instance[] = [];
  #resize: ResizeObserver | undefined;

  /**
   * `singletonOptions` are the box's own, settled once and never per instance:
   * `arrow` and `popperOptions` are not in the `overrides` below and so never
   * transfer off an instance, whatever a call site passes.
   */
  constructor(singletonOptions: TooltipOptions = {}) {
    this.#options = {
      delay: 0,
      interactive: true,
    };
    this.#singletonOptions = singletonOptions;
  }

  /**
   * Built on the first tooltip rather than at module load: `createSingleton`
   * reaches for `document`, and the manager barrel is imported by things with
   * no document to reach for — the headless run among them.
   */
  #getSingleton() {
    this.#singleton ??= createSingleton([], {
      interactive: true,
      ...this.#singletonOptions,
      overrides: [
        'placement',
        'offset',
        'delay',
        'interactive',
        'appendTo',
        // How long the box takes to fade, not how long it waits — that is
        // `delay`. Overridable because a panel that opens *over* something you
        // then want to click has to clear out faster than one that opens into
        // empty room; a tooltip that says nothing about it keeps tippy's own.
        'duration',
        'hideOnClick',
        // Whether this reference gets to open at all. The singleton listens on
        // hover for everyone, so a tooltip with another trigger — the cohort
        // rows, which open on a held right button — vetoes the hover here and
        // opens itself through `show` below.
        'onShow',
        // What the box points at, which is not always what you hovered — a
        // reference that only triggers can borrow another's rect, so two cells
        // of the same row open one panel in one place.
        'getReferenceClientRect',
      ],
      // The singleton never hides between rows during a drag — it retargets
      // the same box via setProps(), which is gated behind tippy's own
      // `ignoreOnFirstUpdate` flag (only cleared by a real hide()). So the
      // reflow+forceUpdate tippy bakes into onMount silently no-ops on every
      // retarget but the first; onMount itself never fires again either.
      // `onAfterUpdate` is what actually runs on each retarget — tippy uses
      // this exact rAF-deferred forceUpdate itself, for the same reason, to
      // fix re-rendered nested poppers.
      onAfterUpdate: (instance) => requestAnimationFrame(() => instance.popperInstance?.forceUpdate()),
    });

    // One box for every row means its height is whatever the last row left in
    // it. That only ever shows on a `top` placement, where popper anchors the
    // box's *bottom* edge — `y = referenceTop - height` — so a height measured
    // a beat before the new content lays out drops the box onto the thing it
    // was supposed to clear. On `bottom` the top edge is the anchor and the
    // same staleness is invisible, which is why only half the placements ever
    // looked broken.
    // Watching the box is the fix that does not depend on guessing which beat
    // the content lands on: whenever the size actually changes, popper runs
    // again. `forceUpdate` writes a transform and nothing else, so it cannot
    // feed its own observer.
    this.#resize = new ResizeObserver(() => this.#singleton?.popperInstance?.forceUpdate());
    this.#resize.observe(this.#singleton.popper);

    return this.#singleton;
  }

  addInstance(elem: HTMLElement, contentElem: HTMLElement, options: TooltipOptions = {}) {
    const instance = tippy(elem, {
      ...this.#options,
      ...options,
      content: contentElem,
    });

    this.#instances.push(instance);
    this.#getSingleton().setInstances(this.#instances);

    return instance;
  }

  /**
   * Open on something other than a hover. The singleton's own trigger is fixed
   * for every reference it holds, so a call site that wants a different one
   * refuses the hover through `onShow` and presses the box open here.
   *
   * The element is the instance's own reference: passing it retargets the box
   * before the show lands, which is the same order a real trigger arrives in.
   */
  show(elem: HTMLElement) {
    this.#getSingleton().show(elem);
  }

  hide() {
    this.#singleton?.hide();
  }

  removeInstance(instance: Instance) {
    const index = this.#instances.indexOf(instance);
    if (index !== -1) {
      this.#instances[index].destroy();
      this.#instances.splice(index, 1);
      this.#getSingleton().setInstances(this.#instances);
    }
  }
}

/**
 * The one box, and the reason a tooltip never opens over another one: every
 * instance is folded into a single popper that retargets rather than a second
 * one that appears.
 */
const manager = new TooltipManager();

/**
 * The second box, and the only one there will be — a panel that opens *beside*
 * the first rather than instead of it. Its own singleton, so the two retarget
 * independently and a reference can be in both.
 *
 * Its placement is fixed here because it is the whole point of the layer: it
 * opens to the left of a panel already standing to the left of the rail, and
 * flipping it back to the right would only run it under the rail. Everything a
 * call site is allowed to differ on is in `overrides` above.
 *
 * No arrow, to match the box it opens beside — an arrow here would point at
 * that box rather than at the chip either of them is about.
 */
export const asideManager = new TooltipManager({
  placement: 'left-start',
  popperOptions: { modifiers: [{ name: 'flip', enabled: false }] },
});

export default manager;

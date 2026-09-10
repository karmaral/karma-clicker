import tippy, { createSingleton } from 'tippy.js';
import type { CreateSingletonInstance, Instance, Props } from 'tippy.js';

type TooltipOptions = Partial<Props>;

export class TooltipManager {
  #singleton: CreateSingletonInstance | undefined;
  #options: Record<string, unknown>;
  #singletonOptions: TooltipOptions;
  #instances: Instance[] = [];

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

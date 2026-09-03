import tippy, { createSingleton } from 'tippy.js';
import type { CreateSingletonInstance, Instance, Props } from 'tippy.js';

type TooltipOptions = Partial<Props>;

class TooltipManager {
  #singleton: CreateSingletonInstance | undefined;
  #options: Record<string, unknown>;
  #instances: Instance[] = [];

  constructor() {
    this.#options = {
      delay: 0,
      interactive: true,
    };
  }

  /**
   * Built on the first tooltip rather than at module load: `createSingleton`
   * reaches for `document`, and the manager barrel is imported by things with
   * no document to reach for — the headless run among them.
   */
  #getSingleton() {
    this.#singleton ??= createSingleton([], {
      interactive: true,
      overrides: [
        'placement',
        'offset',
        'delay',
        'interactive',
        'appendTo',
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

const manager = new TooltipManager();
export default manager;

import tippy, { createSingleton, delegate } from 'tippy.js';
import type { CreateSingletonInstance, Instance } from 'tippy.js';

class TooltipManager {
  #singleton: CreateSingletonInstance | null = null;
  #options: Record<string, unknown>;
  #instances: Instance[] = [];

  constructor() {
    this.#options = {
      delay: 0,
      interactive: true,
    };
    this.init();
  }

  init() {
    if (this.#singleton) return;

    const tooltipSelector = 'body';
    const triggers = '[data-tippy]';
    const content = '.tooltip';

   this.#singleton = createSingleton(
      delegate(tooltipSelector, {
        target: triggers,
        content,
        ...this.#options,
      }),
      {
        interactive: true,
      }
    );
  }

  addInstance(elem: HTMLElement, contentElem: HTMLElement) {
    const instance = tippy(elem, {
      ...this.#options,
      content: contentElem,
    });

    this.#instances.push(instance);
    this.#singleton.setInstances(this.#instances);

    return instance; 
  }

  removeInstance(instance: Instance) {
    const index = this.#instances.indexOf(instance);
    if (index !== -1) {
      this.#instances.splice(index, 1);
    }
  }
}

const manager = new TooltipManager();
export default manager;

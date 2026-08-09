import tippy, { createSingleton } from 'tippy.js';
import type { CreateSingletonInstance, Instance, Props } from 'tippy.js';

type TooltipOptions = Partial<Props>;

class TooltipManager {
  #singleton: CreateSingletonInstance;
  #options: Record<string, unknown>;
  #instances: Instance[] = [];

  constructor() {
    this.#options = {
      delay: 0,
      interactive: true,
    };
    this.#singleton = createSingleton([], {
      interactive: true,
      overrides: [
        'placement',
        'offset',
        'delay',
        'interactive',
        'appendTo',
      ],
    });
  }

  addInstance(elem: HTMLElement, contentElem: HTMLElement, options: TooltipOptions = {}) {
    const instance = tippy(elem, {
      ...this.#options,
      ...options,
      content: contentElem,
    });

    this.#instances.push(instance);
    this.#singleton.setInstances(this.#instances);

    return instance; 
  }

  removeInstance(instance: Instance) {
    const index = this.#instances.indexOf(instance);
    if (index !== -1) {
      this.#instances[index].destroy();
      this.#instances.splice(index, 1);
      this.#singleton.setInstances(this.#instances);
    }
  }
}

const manager = new TooltipManager();
export default manager;

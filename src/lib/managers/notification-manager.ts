import type { ItemTextData } from '$types';

export type Notifier = (data: ItemTextData) => void;

/**
 * Holds no toast and no component: the app hands in what draws, and without one
 * there is nothing to draw on. That keeps every consumer of the manager barrel
 * clear of the DOM — the headless run imports this into a worker, and in dev a
 * `.svelte` module carries Vite's own client, whose module scope wants a window.
 */
class NotificationManager {
  #notify: Notifier | undefined;

  use(notify: Notifier) {
    this.#notify = notify;
  }

  notify(data: ItemTextData) {
    this.#notify?.(data);
  }
}

const manager = new NotificationManager();
export default manager;

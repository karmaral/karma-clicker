/**
 * One run per worker. The managers are module singletons, so a fresh module
 * graph is the reset — and it is what lets several policies run at once.
 *
 * Import order is the contract: `UpgradeManager` builds its map at module load
 * and `BuildingManager` reads the data at unlock, so overrides must land before
 * `run` is pulled in. Hence the dynamic import.
 *
 * The other contract is that nothing reachable from here may statically import a
 * `.svelte` component. In dev those carry Vite's own client, whose module scope
 * calls `window.addEventListener` — and a worker has no window. That is why
 * `NotificationManager` loads its toast lazily.
 */

import buildings from '$data/buildings';
import planets from '$data/planets';
import balance from '$data/balance';
import { applyOverrides } from './overrides';
import type { SimConfig, SimProgress, SimResult } from './types';

export type WorkerMessage =
  | { type: 'progress'; progress: SimProgress }
  | { type: 'done'; result: SimResult }
  | { type: 'error'; message: string };

function post(message: WorkerMessage) {
  self.postMessage(message);
}

self.onmessage = async ({ data }: MessageEvent<Partial<SimConfig>>) => {
  try {
    applyOverrides({ buildings, planets, balance }, data.overrides ?? {});

    const { run } = await import('./run');
    const result = await run(data, (progress) => post({ type: 'progress', progress }));

    post({ type: 'done', result });
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};

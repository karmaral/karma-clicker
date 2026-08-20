/**
 * Page side of a run. One worker per run — the reset is the fresh module graph,
 * which is also what lets several policies compute at once without the UI
 * stopping to wait for them.
 */

import type { SimConfig, SimProgress, SimResult } from './types';
import type { WorkerMessage } from './worker';

export interface SimRun<T> {
  done: Promise<T>;
  stop(): void;
}

export function startSim(
  config: Partial<SimConfig>,
  onProgress?: (progress: SimProgress) => void,
): SimRun<SimResult> {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

  const done = new Promise<SimResult>((resolve, reject) => {
    worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
      if (data.type === 'progress') return onProgress?.(data.progress);

      worker.terminate();

      if (data.type === 'done') resolve(data.result);
      else reject(new Error(data.message));
    };

    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || 'the run failed to start'));
    };
  });

  worker.postMessage(config);

  return { done, stop: () => worker.terminate() };
}

/** Every run at once, so a sweep costs one wait rather than several. */
export function startSims(
  configs: Partial<SimConfig>[],
  onProgress?: (index: number, progress: SimProgress) => void,
): SimRun<SimResult[]> {
  const runs = configs.map((config, index) =>
    startSim(config, (progress) => onProgress?.(index, progress)));

  return {
    done: Promise.all(runs.map((run) => run.done)),
    stop: () => runs.forEach((run) => run.stop()),
  };
}

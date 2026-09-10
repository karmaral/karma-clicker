import TooltipManager, { asideManager } from '$lib/managers/tooltip-manager';
import type { Props } from 'tippy.js';

/**
 * Which box a tooltip opens in. There are two, and only two: the one every
 * tooltip shares, and the aside that opens *beside* it rather than instead of
 * it — see `tooltip-manager`.
 */
export type TooltipLayer = 'default' | 'aside';

interface TooltipParam {
  content?: HTMLElement;
  options?: Partial<Props>;
  layer?: TooltipLayer;
}

export function tooltip(param?: HTMLElement | TooltipParam) {
  return (node: HTMLElement) => {
    let instance: ReturnType<typeof TooltipManager.addInstance> | null = null;

    const { content, options, layer } = param instanceof HTMLElement
      ? { content: param, options: undefined, layer: undefined }
      : (param ?? {});

    const manager = layer === 'aside' ? asideManager : TooltipManager;

    if (content) {
      instance = manager.addInstance(node, content, options);
    }

    return () => {
      if (instance) {
        manager.removeInstance(instance);
      }
    }

  }
}

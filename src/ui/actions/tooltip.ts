import TooltipManager from '$lib/managers/tooltip-manager';
import type { Props } from 'tippy.js';

interface TooltipParam {
  content?: HTMLElement;
  options?: Partial<Props>;
}

export function tooltip(param?: HTMLElement | TooltipParam) {
  return (node: HTMLElement) => {
    let instance: ReturnType<typeof TooltipManager.addInstance> | null = null;

    const { content, options } = param instanceof HTMLElement
      ? { content: param, options: undefined }
      : (param ?? {});

    if (content) {
      instance = TooltipManager.addInstance(node, content, options);
    }

    return () => {
      if (instance) {
        TooltipManager.removeInstance(instance);
      }
    }

  }
}

const DRAG_THRESHOLD = 4;

export function dragScroll(node: HTMLElement) {
  let down = false;
  let moved = false;
  let startY = 0;
  let startScroll = 0;

  const scrollable = () => node.scrollHeight > node.clientHeight;

  function refreshCursor() {
    node.style.cursor = scrollable() ? 'grab' : '';
  }

  function onpointerdown(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !scrollable()) return;
    down = true;
    moved = false;
    startY = e.clientY;
    startScroll = node.scrollTop;
  }

  /**
   * Capture only once the drag is real — grabbing it on plain pointerdown
   * would retarget the click that follows a non-drag press to `node` itself,
   * past the chip the user actually meant to hit.
   */
  function onpointermove(e: PointerEvent) {
    if (!down) return;
    const dy = e.clientY - startY;
    if (!moved && Math.abs(dy) > DRAG_THRESHOLD) {
      moved = true;
      node.setPointerCapture(e.pointerId);
      node.style.cursor = 'grabbing';
    }
    if (moved) node.scrollTop = startScroll - dy;
  }

  function onpointerup(e: PointerEvent) {
    if (!down) return;
    down = false;
    if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId);
    refreshCursor();
  }

  function onclick(e: MouseEvent) {
    if (!moved) return;
    e.preventDefault();
    e.stopPropagation();
  }

  const ro = new ResizeObserver(refreshCursor);
  ro.observe(node);
  refreshCursor();

  node.addEventListener('pointerdown', onpointerdown);
  node.addEventListener('pointermove', onpointermove);
  node.addEventListener('pointerup', onpointerup);
  node.addEventListener('pointercancel', onpointerup);
  node.addEventListener('click', onclick, true);

  return {
    destroy() {
      ro.disconnect();
      node.removeEventListener('pointerdown', onpointerdown);
      node.removeEventListener('pointermove', onpointermove);
      node.removeEventListener('pointerup', onpointerup);
      node.removeEventListener('pointercancel', onpointerup);
      node.removeEventListener('click', onclick, true);
    },
  };
}

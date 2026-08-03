const DRAG_THRESHOLD = 4;

export function dragScroll(node: HTMLElement) {
  let down = false;
  let moved = false;
  let startX = 0;
  let startScroll = 0;

  const scrollable = () => node.scrollWidth > node.clientWidth;

  function refreshCursor() {
    node.style.cursor = scrollable() ? 'grab' : '';
  }

  function onwheel(e: WheelEvent) {
    if (!scrollable()) return;

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!delta) return;

    const atStart = node.scrollLeft <= 0;
    const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 1;
    if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;

    e.preventDefault();
    node.scrollLeft += delta;
  }

  function onpointerdown(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !scrollable()) return;
    down = true;
    moved = false;
    startX = e.clientX;
    startScroll = node.scrollLeft;
    node.setPointerCapture(e.pointerId);
    node.style.cursor = 'grabbing';
  }

  function onpointermove(e: PointerEvent) {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > DRAG_THRESHOLD) moved = true;
    if (moved) node.scrollLeft = startScroll - dx;
  }

  function onpointerup(e: PointerEvent) {
    if (!down) return;
    down = false;
    node.releasePointerCapture(e.pointerId);
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

  node.addEventListener('wheel', onwheel, { passive: false });
  node.addEventListener('pointerdown', onpointerdown);
  node.addEventListener('pointermove', onpointermove);
  node.addEventListener('pointerup', onpointerup);
  node.addEventListener('pointercancel', onpointerup);
  node.addEventListener('click', onclick, true);

  return {
    destroy() {
      ro.disconnect();
      node.removeEventListener('wheel', onwheel);
      node.removeEventListener('pointerdown', onpointerdown);
      node.removeEventListener('pointermove', onpointermove);
      node.removeEventListener('pointerup', onpointerup);
      node.removeEventListener('pointercancel', onpointerup);
      node.removeEventListener('click', onclick, true);
    },
  };
}

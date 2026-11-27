import type { Directive } from 'vue';

const activeClassClickHandlers = new WeakMap<HTMLElement, () => void>();

export const vUrlHashActive: Directive<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    const id = binding.value;
    if (!id) return;

    el.id = id;
    if (window.location.hash.slice(1) !== id) return;

    el.classList.add('url-hash-active', 'url-hash-keep');
    const clearActiveClass = () => {
      el.classList.remove('url-hash-active');
      activeClassClickHandlers.delete(el);
    };
    activeClassClickHandlers.set(el, clearActiveClass);
    document.addEventListener('click', clearActiveClass, { once: true, capture: true });
    requestAnimationFrame(() => {
      if (el.isConnected) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });
  },
  beforeUnmount(el) {
    const clickHandler = activeClassClickHandlers.get(el);
    if (!clickHandler) return;

    document.removeEventListener('click', clickHandler, true);
    activeClassClickHandlers.delete(el);
  },
};

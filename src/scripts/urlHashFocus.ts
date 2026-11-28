import type { Directive } from 'vue';

const focusTimeouts = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
const focusableSelector = 'input, textarea, select, button, [tabindex]:not([tabindex="-1"])';

function getFocusTarget(el: HTMLElement): HTMLElement {
  if (el.matches(focusableSelector)) return el;
  return el.querySelector<HTMLElement>(focusableSelector) ?? el;
}

export const vUrlHashFocus: Directive<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    const id = binding.value;
    if (!id) return;

    const target = getFocusTarget(el);
    target.id = id;
    if (window.location.hash.slice(1) !== id) return;

    target.classList.add('url-hash-focus', 'url-hash-keep');
    const timeout = setTimeout(() => {
      if (target.isConnected && window.location.hash.slice(1) === id) target.focus();
      focusTimeouts.delete(el);
    }, 0);
    focusTimeouts.set(el, timeout);
  },
  beforeUnmount(el) {
    const timeout = focusTimeouts.get(el);
    if (timeout === undefined) return;

    clearTimeout(timeout);
    focusTimeouts.delete(el);
  },
};

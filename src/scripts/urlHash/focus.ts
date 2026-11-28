import type { HashBehavior } from './types';
import { setHashTargetId } from './utils';

const focusableSelector = 'input, textarea, select, button, [tabindex]:not([tabindex="-1"])';

function getFocusTarget(element: HTMLElement): HTMLElement {
  if (element.matches(focusableSelector)) return element;
  return element.querySelector<HTMLElement>(focusableSelector) ?? element;
}

function restoreTargetId(target: HTMLElement, id: string | null): void {
  if (id === null) target.removeAttribute('id');
  else target.id = id;
}

export function createFocusBehavior(element: HTMLElement): HashBehavior {
  let current: { target: HTMLElement; id: string; originalId: string | null } | undefined;
  let match: { target: HTMLElement; id: string } | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  function cleanup(): void {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = undefined;
    match = undefined;
  }

  return {
    sync(id, hash) {
      const previous = current;
      const target = getFocusTarget(element);
      let originalId = target.getAttribute('id');

      if (previous) {
        if (previous.target === target) {
          originalId = previous.originalId;
        } else {
          previous.target.classList.remove('url-hash-focus');
          if (previous.target.id === previous.id) {
            restoreTargetId(previous.target, previous.originalId);
          }
        }
      }

      if (!id) {
        cleanup();
        if (previous?.target === target) {
          target.classList.remove('url-hash-focus');
          restoreTargetId(target, previous.originalId);
        }
        current = undefined;
        return;
      }

      const matches = setHashTargetId(target, id, hash);
      if (matches && match?.target === target && match.id === id) {
        current = { target, id, originalId };
        return;
      }

      cleanup();
      if (previous?.target === target) target.classList.remove('url-hash-focus');
      current = { target, id, originalId };
      if (!matches) return;

      match = { target, id };
      target.classList.add('url-hash-focus', 'url-hash-keep');
      timeout = setTimeout(() => {
        if (
          current?.target === target &&
          current.id === id &&
          target.isConnected &&
          window.location.hash === hash
        ) {
          target.focus();
        }
        timeout = undefined;
      }, 0);
    },
    revoke(id) {
      cleanup();
      if (current) {
        current.target.classList.remove('url-hash-focus', 'url-hash-keep');
        if (current.target.id === id) {
          restoreTargetId(current.target, current.originalId === id ? null : current.originalId);
        }
      }
      current = undefined;
    },
    destroy() {
      cleanup();
      current = undefined;
    },
  };
}

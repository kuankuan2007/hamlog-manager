import type { HashBehavior } from './types';
import { setHashTargetId } from './utils';

const activeElements = new Set<HTMLElement>();

function clearActiveClasses(): void {
  for (const element of activeElements) element.classList.remove('url-hash-active');
}

function registerActiveElement(element: HTMLElement): void {
  if (activeElements.size === 0) document.addEventListener('click', clearActiveClasses, true);
  activeElements.add(element);
}

function unregisterActiveElement(element: HTMLElement): void {
  activeElements.delete(element);
  if (activeElements.size === 0) document.removeEventListener('click', clearActiveClasses, true);
}

export function createActiveBehavior(element: HTMLElement): HashBehavior {
  let matchedId: string | undefined;
  let currentId: string | undefined;
  const frames = new Set<number>();
  registerActiveElement(element);

  function cancelFrames(): void {
    for (const frame of frames) cancelAnimationFrame(frame);
    frames.clear();
  }

  return {
    sync(id, hash) {
      registerActiveElement(element);
      currentId = id;
      const matches = setHashTargetId(element, id, hash);
      if (!id || !matches) {
        element.classList.remove('url-hash-active');
        matchedId = undefined;
        return;
      }
      if (matchedId === id) return;

      matchedId = id;
      element.classList.add('url-hash-active', 'url-hash-keep');
      const frame = requestAnimationFrame(() => {
        frames.delete(frame);
        if (currentId === id && element.isConnected && window.location.hash === hash) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      });
      frames.add(frame);
    },
    revoke(id) {
      cancelFrames();
      matchedId = undefined;
      currentId = undefined;
      unregisterActiveElement(element);
      element.classList.remove('url-hash-active', 'url-hash-keep');
      if (element.id === id) element.removeAttribute('id');
    },
    destroy() {
      cancelFrames();
      matchedId = undefined;
      currentId = undefined;
      unregisterActiveElement(element);
    },
  };
}

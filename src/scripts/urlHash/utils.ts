import type { HashId } from './types';

export function setHashTargetId(element: HTMLElement, id: HashId, hash: string): boolean {
  if (!id) {
    element.removeAttribute('id');
    return false;
  }

  element.id = id;
  return hash.slice(1) === id;
}

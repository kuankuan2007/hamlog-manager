import type { Directive } from 'vue';
import { claimHashId, releaseHashId, type HashOwner } from './registry';
import type { HashBehavior, HashId } from './types';

export function createHashDirective(
  createBehavior: (element: HTMLElement) => HashBehavior
): Directive<HTMLElement, HashId> {
  const instances = new WeakMap<HTMLElement, { update(id: HashId): void; destroy(): void }>();

  return {
    mounted(element, binding) {
      const behavior = createBehavior(element);
      let id: HashId;
      let owned = false;
      let alive = true;
      const owner: HashOwner = {
        element,
        sync(hash) {
          if (alive && owned && id) behavior.sync(id, hash);
        },
        revoke() {
          if (!alive || !owned || !id) return;
          owned = false;
          behavior.revoke(id);
        },
      };

      const instance = {
        update(nextId: HashId) {
          if (!alive) return;
          if (owned && id) releaseHashId(id, owner);
          owned = false;
          id = nextId;
          if (id) {
            owned = claimHashId(id, owner);
            if (!owned) {
              behavior.revoke(id);
              return;
            }
          }
          behavior.sync(id, window.location.hash);
        },
        destroy() {
          if (!alive) return;
          alive = false;
          if (owned && id) releaseHashId(id, owner);
          owned = false;
          behavior.destroy();
        },
      };
      instances.set(element, instance);
      instance.update(binding.value);
    },
    updated(element, binding) {
      if (binding.value !== binding.oldValue) instances.get(element)?.update(binding.value);
    },
    beforeUnmount(element) {
      instances.get(element)?.destroy();
      instances.delete(element);
    },
  };
}

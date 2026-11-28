import type { Directive } from 'vue';

type HashId = string | undefined;
type HashDirectiveSync = (el: HTMLElement, id: HashId, hash: string) => void;
type HashDirectiveCleanup = (el: HTMLElement) => void;
type HashDirectiveHook = (el: HTMLElement) => void;
type HashDirectiveOptions = {
  cleanup?: HashDirectiveCleanup;
  onMounted?: HashDirectiveHook;
  onBeforeUnmount?: HashDirectiveHook;
};
type HashRouteChangeDetail = { newHash: string; oldHash: string };
type HashRouteChangeSyncer = (detail: HashRouteChangeDetail) => void;

const activeElements = new Set<HTMLElement>();
const urlHashSyncersById = new Map<string, HashRouteChangeSyncer[]>();
const urlHashSyncerIds = new WeakMap<HashRouteChangeSyncer, string>();
const focusTimeouts = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
const activeHashMatches = new WeakMap<HTMLElement, string>();
const focusHashMatches = new WeakMap<HTMLElement, { target: HTMLElement; id: string }>();
const focusTargets = new WeakMap<
  HTMLElement,
  { target: HTMLElement; id: string; originalId: string | null }
>();
const focusableSelector = 'input, textarea, select, button, [tabindex]:not([tabindex="-1"])';
const routeChangeEventName = 'url-hash-route-change';

function setHashTargetId(el: HTMLElement, id: HashId, hash: string): boolean {
  if (!id) {
    el.removeAttribute('id');
    return false;
  }

  el.id = id;
  return hash.slice(1) === id;
}

function createHashDirective(
  sync: HashDirectiveSync,
  { cleanup, onMounted, onBeforeUnmount }: HashDirectiveOptions = {}
): Directive<HTMLElement, HashId> {
  const syncStates = new WeakMap<
    HTMLElement,
    { id: HashId; sync: HashRouteChangeSyncer; setValue: (id: HashId) => void }
  >();

  return {
    mounted(el, binding) {
      let id = binding.value;
      const syncFromCurrentUrl = () => sync(el, id, window.location.hash);
      const syncFromRouteChange = (detail: HashRouteChangeDetail) => {
        if (!id || (id !== detail.newHash.slice(1) && id !== detail.oldHash.slice(1))) return;
        sync(el, id, detail.newHash);
      };
      syncStates.set(el, { id, sync: syncFromRouteChange, setValue: (nextId) => (id = nextId) });
      registerUrlHashSyncer(id, syncFromRouteChange);
      onMounted?.(el);
      syncFromCurrentUrl();
    },
    updated(el, binding) {
      if (binding.value !== binding.oldValue) {
        const state = syncStates.get(el);
        if (state) {
          unregisterUrlHashSyncer(state.id, state.sync);
          state.id = binding.value;
          state.setValue(binding.value);
          registerUrlHashSyncer(state.id, state.sync);
        }
        sync(el, binding.value, window.location.hash);
      }
    },
    beforeUnmount(el) {
      const state = syncStates.get(el);
      if (state) unregisterUrlHashSyncer(state.id, state.sync);
      syncStates.delete(el);
      cleanup?.(el);
      onBeforeUnmount?.(el);
    },
  };
}

function syncMountedUrlHashDirectives(event: Event): void {
  const { newHash, oldHash } = (event as CustomEvent<HashRouteChangeDetail>).detail;
  if (newHash === oldHash) return;
  const detail = { newHash, oldHash };
  syncUrlHashersForId(oldHash.slice(1), detail);
  syncUrlHashersForId(newHash.slice(1), detail);
}

function syncUrlHashersForId(id: string, detail: HashRouteChangeDetail): void {
  const syncers = urlHashSyncersById.get(id);
  if (!syncers) return;

  for (const sync of syncers.slice()) sync(detail);
}

function registerUrlHashSyncer(id: HashId, sync: HashRouteChangeSyncer): void {
  if (!id) return;

  const registeredId = urlHashSyncerIds.get(sync);
  if (registeredId === id) return;
  if (registeredId) unregisterUrlHashSyncer(registeredId, sync);

  let syncers = urlHashSyncersById.get(id);
  if (!syncers) {
    syncers = [];
    urlHashSyncersById.set(id, syncers);
  }
  if (syncers.includes(sync)) {
    urlHashSyncerIds.set(sync, id);
    return;
  }
  syncers.push(sync);
  urlHashSyncerIds.set(sync, id);

  if (urlHashSyncersById.size === 1 && syncers.length === 1) {
    window.addEventListener(routeChangeEventName, syncMountedUrlHashDirectives);
  }
}

function unregisterUrlHashSyncer(id: HashId, sync: HashRouteChangeSyncer): void {
  const registeredId = urlHashSyncerIds.get(sync) ?? id;
  if (!registeredId) return;

  const syncers = urlHashSyncersById.get(registeredId);
  if (syncers) {
    const index = syncers.indexOf(sync);
    if (index !== -1) syncers.splice(index, 1);
    if (syncers.length === 0) urlHashSyncersById.delete(registeredId);
  }
  urlHashSyncerIds.delete(sync);
  if (urlHashSyncersById.size === 0) {
    window.removeEventListener(routeChangeEventName, syncMountedUrlHashDirectives);
  }
}

function clearActiveClasses(): void {
  for (const el of activeElements) el.classList.remove('url-hash-active');
}

function registerActiveElement(el: HTMLElement): void {
  if (activeElements.size === 0) {
    document.addEventListener('click', clearActiveClasses, true);
  }
  activeElements.add(el);
}

function unregisterActiveElement(el: HTMLElement): void {
  activeElements.delete(el);
  if (activeElements.size === 0) {
    document.removeEventListener('click', clearActiveClasses, true);
  }
}

function cleanupActive(el: HTMLElement): void {
  activeHashMatches.delete(el);
}

function syncUrlHashActive(el: HTMLElement, id: HashId, hash: string): void {
  const matchesHash = setHashTargetId(el, id, hash);
  if (!id || !matchesHash) {
    el.classList.remove('url-hash-active');
    activeHashMatches.delete(el);
    return;
  }

  if (activeHashMatches.get(el) === id) return;

  activeHashMatches.set(el, id);
  el.classList.add('url-hash-active', 'url-hash-keep');
  requestAnimationFrame(() => {
    if (el.isConnected && window.location.hash === hash) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  });
}

function cleanupFocus(el: HTMLElement): void {
  const timeout = focusTimeouts.get(el);
  if (timeout !== undefined) {
    clearTimeout(timeout);
    focusTimeouts.delete(el);
  }
  focusHashMatches.delete(el);
}

function getFocusTarget(el: HTMLElement): HTMLElement {
  if (el.matches(focusableSelector)) return el;
  return el.querySelector<HTMLElement>(focusableSelector) ?? el;
}

function restoreTargetId(target: HTMLElement, id: string | null): void {
  if (id === null) target.removeAttribute('id');
  else target.id = id;
}

function syncUrlHashFocus(el: HTMLElement, id: HashId, hash: string): void {
  const previous = focusTargets.get(el);
  const target = getFocusTarget(el);
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
    cleanupFocus(el);
    if (previous?.target === target) {
      target.classList.remove('url-hash-focus');
      restoreTargetId(target, previous.originalId);
    }
    focusTargets.delete(el);
    return;
  }

  const matchesHash = setHashTargetId(target, id, hash);
  const previousMatch = focusHashMatches.get(el);
  if (matchesHash && previousMatch?.target === target && previousMatch.id === id) {
    focusTargets.set(el, { target, id, originalId });
    return;
  }

  cleanupFocus(el);
  if (previous?.target === target) target.classList.remove('url-hash-focus');
  focusTargets.set(el, { target, id, originalId });
  if (!matchesHash) return;

  focusHashMatches.set(el, { target, id });
  target.classList.add('url-hash-focus', 'url-hash-keep');
  const timeout = setTimeout(() => {
    if (target.isConnected && window.location.hash === hash) target.focus();
    focusTimeouts.delete(el);
  }, 0);
  focusTimeouts.set(el, timeout);
}

export const vUrlHashActive = createHashDirective(syncUrlHashActive, {
  cleanup: cleanupActive,
  onMounted: registerActiveElement,
  onBeforeUnmount: unregisterActiveElement,
});
export const vUrlHashFocus = createHashDirective(syncUrlHashFocus, { cleanup: cleanupFocus });

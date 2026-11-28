import type { Router } from 'vue-router';
import { syncHashId } from './registry';

export function installHashRouteSync(router: Router): () => void {
  return router.afterEach((to, from, failure) => {
    if (failure || to.hash === from.hash) return;
    syncHashId(from.hash.slice(1), to.hash);
    syncHashId(to.hash.slice(1), to.hash);
  });
}

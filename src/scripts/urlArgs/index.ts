import {
  getCurrentInstance,
  getCurrentScope,
  onScopeDispose,
  reactive,
  readonly,
  watch,
  type DeepReadonly,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createField, parseURLArgs, serializeURLArgs } from './parse';
import type { Field, HasReadonlyField, URLArgs, URLArgsConfig } from './type';

export * from './fields';
export * from './type';

export function getURLArgs<const T extends URLArgsConfig>(
  config: T
): HasReadonlyField<T> extends true ? DeepReadonly<URLArgs<T>> : URLArgs<T> {
  if (!getCurrentScope() || !getCurrentInstance()) {
    throw new Error('getURLArgs must be called within a component setup scope');
  }
  const route = useRoute();
  const router = useRouter();
  const path = route.path;
  const fields = Object.fromEntries(
    Object.entries(config).map(([key, fieldConfig]) => [key, createField(fieldConfig)])
  ) as Record<keyof T, Field<unknown>>;
  const args = reactive(
    parseURLArgs(fields, config, new URL(route.fullPath, window.location.origin).search)
  ) as URLArgs<T>;
  let readingURL = false;
  let disposed = false;
  let pending = false;
  let running = false;
  let expectedPath: string | undefined;

  async function syncToURL(): Promise<void> {
    if (running) return;
    running = true;
    try {
      while (pending && !disposed && route.path === path) {
        pending = false;
        const url = new URL(route.fullPath, window.location.origin);
        readingURL = true;
        try {
          serializeURLArgs(fields, config, args, url);
        } finally {
          readingURL = false;
        }
        const target = `${route.path}${url.search}${url.hash}`;
        expectedPath = router.resolve(target).fullPath;
        if (expectedPath !== route.fullPath) await router.replace(target);
        expectedPath = undefined;
      }
    } finally {
      expectedPath = undefined;
      running = false;
    }
  }

  function scheduleSync(): void {
    if (readingURL || disposed) return;
    pending = true;
    queueMicrotask(() => {
      void syncToURL().catch((error: unknown) =>
        console.error('Failed to sync URL arguments:', error)
      );
    });
  }

  function syncFromURL(fullPath: string): void {
    if (disposed || route.path !== path || fullPath === expectedPath) return;
    pending = false;
    readingURL = true;
    try {
      const nextArgs = parseURLArgs(
        fields,
        config,
        new URL(fullPath, window.location.origin).search
      );
      for (const key of Object.keys(config) as (keyof T)[]) {
        const current = args[key];
        const next = nextArgs[key];
        if (
          Array.isArray(current) &&
          Array.isArray(next) &&
          current.length === next.length &&
          current.every((value, index) => value === next[index])
        )
          continue;
        args[key] = next;
      }
    } finally {
      readingURL = false;
    }
  }

  watch(args, scheduleSync, { deep: true, flush: 'sync' });
  watch(() => route.fullPath, syncFromURL, { flush: 'sync' });
  scheduleSync();
  onScopeDispose(() => {
    disposed = true;
    pending = false;
  });

  const isReadonly = Object.values(fields).some((field) => field.isReadonly);
  return (isReadonly ? readonly(args) : args) as HasReadonlyField<T> extends true
    ? DeepReadonly<URLArgs<T>>
    : URLArgs<T>;
}

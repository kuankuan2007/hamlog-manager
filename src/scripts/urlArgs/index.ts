import { onScopeDispose, reactive, readonly, watch, type DeepReadonly } from 'vue';
import { createField, parseURLArgs, serializeURLArgs } from './parse';
import type { Field, HasReadonlyField, URLArgs, URLArgsConfig } from './type';

export * from './fields';
export * from './type';

export function getURLArgs<const T extends URLArgsConfig>(
  config: T
): HasReadonlyField<T> extends true ? DeepReadonly<URLArgs<T>> : URLArgs<T> {
  const fields = Object.fromEntries(
    Object.entries(config).map(([key, fieldConfig]) => [key, createField(fieldConfig)])
  ) as Record<keyof T, Field<unknown>>;
  const args = reactive(parseURLArgs(fields, config, window.location.search)) as URLArgs<T>;
  let readingURL = false;

  function syncToURL(): void {
    if (readingURL) return;

    const url = new URL(window.location.href);
    readingURL = true;
    try {
      serializeURLArgs(fields, config, args, url);
    } finally {
      readingURL = false;
    }
    window.history.replaceState(window.history.state, '', url);
  }

  function syncFromURL(): void {
    readingURL = true;
    try {
      const nextArgs = parseURLArgs(fields, config, window.location.search);
      for (const key of Object.keys(config) as (keyof T)[]) args[key] = nextArgs[key];
    } finally {
      readingURL = false;
    }
  }

  watch(args, syncToURL, { deep: true, flush: 'sync' });
  syncToURL();
  window.addEventListener('popstate', syncFromURL);
  onScopeDispose(() => window.removeEventListener('popstate', syncFromURL));

  const isReadonly = Object.values(fields).some((field) => field.isReadonly);
  return (isReadonly ? readonly(args) : args) as HasReadonlyField<T> extends true
    ? DeepReadonly<URLArgs<T>>
    : URLArgs<T>;
}

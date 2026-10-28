import { ArrayField, ChoiceField, NumberField, StringField } from './fields';
import { Field, type FieldConfig, type URLArgs, type URLArgsConfig } from './type';

export function createField(config: FieldConfig): Field<unknown> {
  if (config instanceof Field) return config;

  switch (config.type) {
    case 'string':
      return new StringField(config);
    case 'array':
      return new ArrayField(config);
    case 'number':
      return new NumberField(config);
    case 'choice':
      return new ChoiceField(config);
  }
}

export function parseURLArgs<T extends URLArgsConfig>(
  fields: Record<keyof T, Field<unknown>>,
  config: T,
  search: string
): URLArgs<T> {
  const params = new URLSearchParams(search);
  const values: Record<string, unknown> = {};

  for (const key of Object.keys(config) as (keyof T)[]) {
    const field = fields[key];
    field.reset();
    for (const value of params.getAll(key as string)) field.parse(value);
    values[key as string] = field.value;
  }

  return values as URLArgs<T>;
}

export function serializeURLArgs<T extends URLArgsConfig>(
  fields: Record<keyof T, Field<unknown>>,
  config: T,
  values: URLArgs<T>,
  url: URL
): void {
  for (const key of Object.keys(config) as (keyof T)[]) {
    const field = fields[key];
    field.value = values[key] as never;
    url.searchParams.delete(key as string);
    const value = field.toURL();
    values[key] = field.value as URLArgs<T>[typeof key];
    if (value) url.searchParams.set(key as string, value);
  }
}

import {
  plainDateTimeToDateTagString,
  plainDateTimeToTimeTagString,
  timeTagStringToPlainDateTime,
} from '@util/time';
import { Field } from '../type';

export interface TimeFieldConfig {
  default?: string;
  readonly?: boolean;
}

const DATE_TAG_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_TAG_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

function normalizeDateTag(value: string): string {
  if (!DATE_TAG_RE.test(value)) return '';

  try {
    const normalized = plainDateTimeToDateTagString(timeTagStringToPlainDateTime(value));
    return normalized === value ? normalized : '';
  } catch {
    return '';
  }
}

function normalizeDateTimeTag(value: string): string {
  if (!DATE_TIME_TAG_RE.test(value)) return '';

  try {
    const normalized = plainDateTimeToTimeTagString(timeTagStringToPlainDateTime(value));
    return normalized === value ? normalized : '';
  } catch {
    return '';
  }
}

export class DateTagField extends Field<string> {
  constructor(config: TimeFieldConfig | string = '') {
    const options = typeof config === 'string' ? { default: config } : config;
    super(normalizeDateTag(options.default ?? ''), options.readonly);
  }

  parse(inArgs: string): void {
    const value = normalizeDateTag(inArgs);
    if (value) this.value = value;
  }

  toURL(): string {
    this.value = normalizeDateTag(this.value);
    return this.value;
  }
}

export class DateTimeTagField extends Field<string> {
  constructor(config: TimeFieldConfig | string = '') {
    const options = typeof config === 'string' ? { default: config } : config;
    super(normalizeDateTimeTag(options.default ?? ''), options.readonly);
  }

  parse(inArgs: string): void {
    const value = normalizeDateTimeTag(inArgs);
    if (value) this.value = value;
  }

  toURL(): string {
    this.value = normalizeDateTimeTag(this.value);
    return this.value;
  }
}

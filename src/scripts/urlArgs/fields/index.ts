import type {
  ArrayFieldConfig,
  ChoiceFieldConfig,
  NumberFieldConfig,
  StringFieldConfig,
} from '../type';
import { Field } from '../type';

export { DateTagField, DateTimeTagField } from './time';

export class StringField extends Field<string> {
  constructor(config: StringFieldConfig = { type: 'string' }) {
    super(config.default ?? '', config.readonly);
  }

  parse(inArgs: string): void {
    this.value = inArgs;
  }

  toURL(): string {
    return this.value;
  }
}

export class ArrayField extends Field<string[]> {
  constructor(config: ArrayFieldConfig = { type: 'array' }) {
    super(config.default ?? [], config.readonly);
  }

  protected override copyDefaultValue(): string[] {
    return [...this.defaultValue];
  }

  parse(inArgs: string): void {
    for (const value of inArgs
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)) {
      if (!this.value.includes(value)) this.value.push(value);
    }
  }

  toURL(): string {
    this.value = [...new Set(this.value.map((value) => value.trim()).filter(Boolean))];
    return this.value.join(',');
  }
}

export class NumberField extends Field<number> {
  private readonly integer: boolean;
  private readonly min?: number;
  private readonly max?: number;

  constructor(config: NumberFieldConfig) {
    super(config.default ?? 0, config.readonly);
    this.integer = config.integer ?? false;
    this.min = config.min;
    this.max = config.max;
  }

  parse(inArgs: string): void {
    const value = Number(inArgs);
    if (!this.isValid(value)) return;
    this.value = value;
  }

  toURL(): string {
    return this.isValid(this.value) ? String(this.value) : '';
  }

  private isValid(value: number): boolean {
    return (
      Number.isFinite(value) &&
      (!this.integer || Number.isInteger(value)) &&
      (this.min === undefined || value >= this.min) &&
      (this.max === undefined || value <= this.max)
    );
  }
}

export class ChoiceField<T extends string> extends Field<T | ''> {
  private readonly values: readonly T[];

  constructor(config: ChoiceFieldConfig<T>) {
    if (config.values.length === 0) throw new Error('choice 字段至少需要一个可选值');
    super(config.default ?? '', config.readonly);
    if (config.default !== undefined && !config.values.includes(config.default)) {
      throw new Error('choice 字段默认值必须包含在 values 中');
    }
    this.values = config.values;
  }

  parse(inArgs: string): void {
    if (this.values.includes(inArgs as T)) this.value = inArgs as T;
  }

  toURL(): string {
    return this.value === '' || this.values.includes(this.value) ? this.value : '';
  }
}

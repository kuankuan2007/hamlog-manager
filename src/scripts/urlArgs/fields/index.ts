import type {
  ArrayFieldConfig,
  ChoiceFieldConfig,
  NumberFieldConfig,
  StringFieldConfig,
} from '../type';
import { Field } from '../type';

export { DateTagField, DateTimeTagField } from './time';

export class StringField<ReadonlyValue extends boolean = false> extends Field<
  string,
  ReadonlyValue
> {
  constructor(config: StringFieldConfig & { readonly?: ReadonlyValue } = { type: 'string' }) {
    super(config.default ?? '', (config.readonly ?? false) as ReadonlyValue);
  }

  parse(inArgs: string): void {
    this.value = inArgs;
  }

  toURL(): string {
    return this.value;
  }
}

export class ArrayField<ReadonlyValue extends boolean = false> extends Field<
  string[],
  ReadonlyValue
> {
  constructor(config: ArrayFieldConfig & { readonly?: ReadonlyValue } = { type: 'array' }) {
    super(config.default ?? [], (config.readonly ?? false) as ReadonlyValue);
  }

  protected override copyDefaultValue(): string[] {
    return [...this.defaultValue];
  }

  override reset(hasURLValues = false): void {
    if (hasURLValues) this.value = [];
    else super.reset();
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
    const normalized = [...new Set(this.value.map((value) => value.trim()).filter(Boolean))];
    if (
      normalized.length !== this.value.length ||
      normalized.some((value, index) => value !== this.value[index])
    ) {
      this.value = normalized;
    }
    return this.value.join(',');
  }
}

export class NumberField<ReadonlyValue extends boolean = false> extends Field<
  number,
  ReadonlyValue
> {
  private readonly integer: boolean;
  private readonly min?: number;
  private readonly max?: number;

  constructor(config: NumberFieldConfig & { readonly?: ReadonlyValue }) {
    super(config.default ?? 0, (config.readonly ?? false) as ReadonlyValue);
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

export class ChoiceField<T extends string, ReadonlyValue extends boolean = false> extends Field<
  T | '',
  ReadonlyValue
> {
  private readonly values: readonly T[];

  constructor(config: ChoiceFieldConfig<T> & { readonly?: ReadonlyValue }) {
    if (config.values.length === 0) throw new Error('choice 字段至少需要一个可选值');
    super(config.default ?? '', (config.readonly ?? false) as ReadonlyValue);
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

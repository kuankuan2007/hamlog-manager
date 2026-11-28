export abstract class Field<T, ReadonlyValue extends boolean = boolean> {
  protected readonly defaultValue: T;
  readonly isReadonly: ReadonlyValue;
  value: T;

  constructor(defaultValue: T, isReadonly: ReadonlyValue = false as ReadonlyValue) {
    this.defaultValue = defaultValue;
    this.isReadonly = isReadonly;
    this.value = this.copyDefaultValue();
  }

  reset(_hasURLValues = false): void {
    void _hasURLValues;
    this.value = this.copyDefaultValue();
  }

  abstract parse(inArgs: string): void;
  abstract toURL(): string;

  protected copyDefaultValue(): T {
    return this.defaultValue;
  }
}

export interface BaseFieldConfig {
  readonly?: boolean;
}

export interface StringFieldConfig extends BaseFieldConfig {
  type: 'string';
  default?: string;
}

export interface ArrayFieldConfig extends BaseFieldConfig {
  type: 'array';
  default?: string[];
}

export interface NumberFieldConfig extends BaseFieldConfig {
  type: 'number';
  default?: number;
  integer?: boolean;
  min?: number;
  max?: number;
}

export interface ChoiceFieldConfig<T extends string = string> extends BaseFieldConfig {
  type: 'choice';
  values: readonly T[];
  default?: T;
}

export type FieldConfig =
  | StringFieldConfig
  | ArrayFieldConfig
  | NumberFieldConfig
  | ChoiceFieldConfig
  | Field<unknown>;

export type URLArgsConfig = Record<string, FieldConfig>;

export type FieldValue<T extends FieldConfig> =
  T extends Field<infer Value>
    ? Value
    : T extends StringFieldConfig
      ? string
      : T extends ArrayFieldConfig
        ? string[]
        : T extends NumberFieldConfig
          ? number
          : T extends ChoiceFieldConfig<infer Value>
            ? T extends { default: string }
              ? Value
              : Value | ''
            : never;

export type URLArgs<T extends URLArgsConfig> = {
  -readonly [Key in keyof T]: FieldValue<T[Key]>;
};

export type HasReadonlyField<T extends URLArgsConfig> = true extends {
  [Key in keyof T]: T[Key] extends { readonly isReadonly: infer ReadonlyValue }
    ? true extends ReadonlyValue
      ? true
      : false
    : T[Key] extends { readonly?: infer ReadonlyValue }
      ? true extends ReadonlyValue
        ? true
        : false
      : false;
}[keyof T]
  ? true
  : false;

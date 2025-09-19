// Module declarations for third-party dependencies used by the form engine.
// These definitions provide the minimal surface needed by our TypeScript build
// without pulling in the full upstream typings.

declare module 'localforage' {
  type LocalForageDriver = string;

  interface LocalForageOptions {
    driver?: LocalForageDriver | LocalForageDriver[];
    name?: string;
    storeName?: string;
    version?: number;
    size?: number;
    description?: string;
  }

  interface DropInstanceOptions {
    name?: string;
    storeName?: string;
    driver?: LocalForageDriver | LocalForageDriver[];
  }

  interface LocalForageInstance {
    getItem<T>(key: string): Promise<T | null>;
    setItem<T>(key: string, value: T): Promise<T>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    length(): Promise<number>;
    key(index: number): Promise<string | null>;
    keys(): Promise<string[]>;
    iterate<T, TResult = void>(
      iteratee: (
        value: T,
        key: string,
        iterationNumber: number,
      ) => TResult | void | Promise<TResult | void>,
    ): Promise<TResult | void>;
    ready(): Promise<void>;
    dropInstance(options?: DropInstanceOptions): Promise<void>;
    config(options: LocalForageOptions): void;
  }

  interface LocalForageStatic extends LocalForageInstance {
    LOCALSTORAGE: LocalForageDriver;
    WEBSQL: LocalForageDriver;
    INDEXEDDB: LocalForageDriver;
    createInstance(options?: LocalForageOptions): LocalForageInstance;
    setDriver(driver: LocalForageDriver | LocalForageDriver[]): Promise<void>;
    defineDriver(driver: unknown): Promise<void>;
    driver(): LocalForageDriver;
  }

  const localforage: LocalForageStatic;
  export default localforage;
}

declare module 'crypto-js' {
  namespace CryptoJS {
    interface WordArray {
      toString(encoder?: Encoder): string;
    }

    interface CipherParams {
      toString(formatter?: Encoder | Formatter): string;
    }

    interface Encoder {
      stringify(wordArray: WordArray): string;
      parse(text: string): WordArray;
    }

    interface Formatter {
      stringify(cipherParams: CipherParams): string;
      parse(text: string): CipherParams;
    }

    const AES: {
      encrypt(message: string | WordArray, secret: string): CipherParams;
      decrypt(ciphertext: string | CipherParams, secret: string): WordArray;
    };

    const enc: {
      Utf8: Encoder;
      [name: string]: Encoder;
    };
  }

  const cryptoJS: typeof CryptoJS;
  export default cryptoJS;
}

declare module 'ajv' {
  type JSONSchema = boolean | Record<string, unknown>;

  interface AjvOptions {
    allErrors?: boolean;
    verbose?: boolean;
    strict?: boolean | 'log';
    validateFormats?: boolean;
    coerceTypes?: boolean | 'array';
    useDefaults?: boolean | 'empty';
    removeAdditional?: boolean | 'all' | 'failing';
    $data?: boolean;
    messages?: boolean;
  }

  interface ErrorObject<TParams = Record<string, unknown>, TData = unknown> {
    instancePath: string;
    schemaPath: string;
    keyword: string;
    params: TParams;
    message?: string;
    data?: TData;
  }

  type ValidateFunction<T = unknown> = ((data: T) => boolean | Promise<boolean>) & {
    errors?: ErrorObject[] | null;
    async?: boolean;
  };

  interface FormatDefinition {
    type?: string | string[];
    async?: boolean;
    validate: (data: unknown) => boolean | Promise<boolean>;
  }

  interface KeywordDefinition {
    keyword: string;
    type?: string | string[];
    schemaType?: string | string[];
    errors?: boolean | 'full';
    metaSchema?: JSONSchema;
    compile?: (
      schema: unknown,
      parentSchema: JSONSchema,
      it?: unknown,
    ) => (data: unknown, parent?: unknown, context?: unknown) => boolean | Promise<boolean>;
  }

  class Ajv {
    constructor(options?: AjvOptions);
    addFormat(
      name: string,
      format: FormatDefinition | ((data: unknown) => boolean | Promise<boolean>),
    ): this;
    addKeyword(keyword: string, definition?: KeywordDefinition): this;
    addKeyword(definition: KeywordDefinition): this;
    compile<T = unknown>(schema: JSONSchema): ValidateFunction<T>;
    validate<T = unknown>(
      schema: JSONSchema | ValidateFunction<T>,
      data: T,
    ): boolean | Promise<boolean>;
    getSchema<T = unknown>(id: string): ValidateFunction<T> | undefined;
    errors?: ErrorObject[] | null;
  }

  export default Ajv;
  export { AjvOptions, ErrorObject, FormatDefinition, KeywordDefinition, ValidateFunction };
}

declare module 'ajv-formats' {
  import Ajv from 'ajv';

  function addFormats(
    ajv: Ajv,
    formats?: string | string[],
    options?: Record<string, unknown>,
  ): Ajv;
  export default addFormats;
}

declare module 'ajv-errors' {
  import Ajv from 'ajv';

  function ajvErrors(ajv: Ajv): Ajv;
  export default ajvErrors;
}

declare module 'ajv-keywords' {
  import Ajv from 'ajv';

  function addKeywords(ajv: Ajv, keywords?: string[] | Record<string, unknown>): Ajv;
  export default addKeywords;
}

declare module 'expr-eval' {
  interface Expression {
    evaluate(scope?: Record<string, unknown>): unknown;
    substitute(variable: string, value: unknown): Expression;
    simplify(scope?: Record<string, unknown>): Expression;
  }

  class Parser {
    parse(expression: string): Expression;
    evaluate(expression: string, scope?: Record<string, unknown>): unknown;
  }

  export { Expression, Parser };
}

declare module 'jsonpath' {
  interface JSONPath {
    query<T = unknown>(obj: unknown, path: string): T[];
    value<T = unknown>(obj: unknown, path: string, newValue?: T): T | undefined;
  }

  const jsonpath: JSONPath;
  export default jsonpath;
}

// xstate.d.ts
declare module 'xstate' {
  /* Public event shape */
  export interface EventObject {
    type: string;
    [key: string]: unknown;
  }

  /* Assign helpers */
  export type AssignObject<TContext, TEvent extends EventObject> = {
    [key: string]: (context: TContext, event: TEvent) => unknown;
  };

  export type AssignAction<TContext, TEvent extends EventObject> = (
    context: TContext,
    event: TEvent
  ) => unknown;

  /* Machine config */
  export interface MachineConfig<TContext> {
    id?: string;
    initial: string;
    context: TContext;
    states: Record<string, unknown>;
  }

  export interface MachineOptions<TContext, TEvent extends EventObject = EventObject> {
    actions?: Record<string, (context: TContext, event: TEvent) => unknown>;
    guards?: Record<string, (context: TContext, event: TEvent) => boolean>;
    services?: Record<string, unknown>;
  }

  /* Lightweight runtime shape used in our code */
  export interface StateSnapshot<TContext> {
    context: TContext;
  }

  export type StateMachine<TContext = unknown, TEvent extends EventObject = EventObject> = {
    initialState: StateSnapshot<TContext>;
    transition: (state: StateSnapshot<TContext>, event: TEvent) => StateSnapshot<TContext>;
  };

  /* API surface we actually call */
  export function assign<
    TContext = unknown,
    TEvent extends EventObject = EventObject
  >(
    assignment:
      | AssignObject<TContext, TEvent>
      | Partial<TContext>
      | ((context: TContext, event: TEvent) => Partial<TContext>)
  ): AssignAction<TContext, TEvent>;

  export function createMachine<
    TContext = unknown,
    TEvent extends EventObject = EventObject
  >(
    config: MachineConfig<TContext>,
    options?: MachineOptions<TContext, TEvent>
  ): StateMachine<TContext, TEvent>;

  /* Compatibility alias */
  export type AnyStateMachine = StateMachine<any, any>;
}

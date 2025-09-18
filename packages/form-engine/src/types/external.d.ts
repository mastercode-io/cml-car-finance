// Temporary module declarations for external dependencies used by the form engine.
// TODO(form-engine): Replace these with precise typings or upgrade dependencies to include bundled types.
declare module 'localforage' {
  const localforage: any;
  export default localforage;
}

declare module 'crypto-js' {
  const CryptoJS: any;
  export default CryptoJS;
}

declare module 'ajv' {
  const Ajv: any;
  export default Ajv;
  export type ErrorObject = any;
  export type ValidateFunction = any;
}

declare module 'ajv-formats' {
  const addFormats: any;
  export default addFormats;
}

declare module 'ajv-errors' {
  const ajvErrors: any;
  export default ajvErrors;
}

declare module 'ajv-keywords' {
  const addKeywords: any;
  export default addKeywords;
}

declare module 'expr-eval' {
  export class Parser {
    parse(expression: string): {
      evaluate(scope: Record<string, unknown>): unknown;
    };
  }
}

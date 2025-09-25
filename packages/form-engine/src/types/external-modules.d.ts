declare module 'swr' {
  export type SWRConfiguration = any;
  const useSWR: any;
  export default useSWR;
}

declare module '@babel/traverse' {
  export type NodePath<T = any> = any;
  export default function traverse(node: any, visitors: any): void;
}

declare module 'zod-to-json-schema' {
  export function zodToJsonSchema(schema: any, options?: any): any;
}

declare module 'web-vitals' {
  export function onCLS(callback: (...args: any[]) => void, options?: any): void;
  export function onFCP(callback: (...args: any[]) => void, options?: any): void;
  export function onINP(callback: (...args: any[]) => void, options?: any): void;
  export function onLCP(callback: (...args: any[]) => void, options?: any): void;
  export function onTTFB(callback: (...args: any[]) => void, options?: any): void;
}

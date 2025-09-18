declare module '@/lib/utils' {
  export function cn(...args: any[]): string;
}

declare module '@/components/ui/*' {
  const Component: React.ComponentType<any>;
  export default Component;
  export = Component;
}

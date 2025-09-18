import * as React from 'react';

declare module '@/lib/utils' {
  export function cn(...args: any[]): string;
}

declare module '@/components/ui/input' {
  export const Input: React.FC<any>;
}

declare module '@/components/ui/label' {
  export const Label: React.FC<any>;
}

declare module '@/components/ui/button' {
  export const Button: React.FC<any>;
}

declare module '@/components/ui/select' {
  export const Select: React.FC<any>;
  export const SelectContent: React.FC<any>;
  export const SelectItem: React.FC<any>;
  export const SelectTrigger: React.FC<any>;
  export const SelectValue: React.FC<any>;
}

declare module '@/components/ui/checkbox' {
  export const Checkbox: React.FC<any>;
}

declare module '@/components/ui/radio-group' {
  export const RadioGroup: React.FC<any>;
  export const RadioGroupItem: React.FC<any>;
}

declare module '@/components/ui/textarea' {
  export const Textarea: React.FC<any>;
}

declare module '@/components/ui/calendar' {
  export const Calendar: React.FC<any>;
}

declare module '@/components/ui/popover' {
  export const Popover: React.FC<any>;
  export const PopoverContent: React.FC<any>;
  export const PopoverTrigger: React.FC<any>;
}

declare module '@/components/ui/slider' {
  export const Slider: React.FC<any>;
}

declare module '@/components/ui/badge' {
  export const Badge: React.FC<any>;
}

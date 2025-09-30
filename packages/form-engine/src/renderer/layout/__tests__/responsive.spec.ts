import { computeGridStyles, inferBreakpointFromWidth } from '../responsive';
import type { LayoutConfig } from '../../../types';

describe('responsive helpers', () => {
  const layout: LayoutConfig = {
    type: 'grid',
    columns: { md: 6, lg: 8 },
    gutter: { base: 12, md: 24 },
    rowGap: { base: 16 },
  };

  it('computes CSS variables for each breakpoint and collapses to a single column by default on base', () => {
    const baseStyles = computeGridStyles(layout, 'base');

    expect(baseStyles.columns).toBe(1);
    expect(baseStyles.style['--cols']).toBe('1');
    expect(baseStyles.style['--cols-base']).toBe('1');
    expect(baseStyles.style['--cols-md']).toBe('6');
    expect(baseStyles.style['--cols-lg']).toBe('8');
  });

  it('resolves breakpoint widths using overrides', () => {
    expect(inferBreakpointFromWidth(1280)).toBe('xl');
    expect(inferBreakpointFromWidth(900)).toBe('md');
    expect(inferBreakpointFromWidth(500)).toBe('base');

    const overrides = { sm: 500, md: 700 };
    expect(inferBreakpointFromWidth(750, overrides)).toBe('md');
    expect(inferBreakpointFromWidth(520, overrides)).toBe('sm');
    expect(inferBreakpointFromWidth(400, overrides)).toBe('base');
  });
});

import {
  computeGridStyles,
  computeItemStyles,
  inferBreakpointFromWidth,
  mergeLayout,
  resolveBreakpoint,
} from '../../../src/renderer/layout/responsive';

describe('layout responsive helpers', () => {
  it('merges section and widget layout hints with widget overrides taking precedence', () => {
    const base = {
      name: 'fullName',
      colSpan: { base: 2, lg: 3 },
      order: { base: 1 },
    };
    const override = {
      colSpan: { md: 4 },
      order: { base: 5 },
    };

    const merged = mergeLayout(base, override);

    expect(resolveBreakpoint(merged.colSpan, 'md')).toBe(4);
    expect(resolveBreakpoint(merged.colSpan, 'lg')).toBe(3);
    expect(resolveBreakpoint(merged.colSpan, 'sm')).toBe(2);
    expect(resolveBreakpoint(merged.order, 'base')).toBe(5);
  });

  it('falls back to base values when higher breakpoints are undefined', () => {
    const merged = mergeLayout(
      { name: 'email', colSpan: { base: 2 } },
      undefined,
    );

    expect(resolveBreakpoint(merged.colSpan, 'xl')).toBe(2);

    const styles = computeGridStyles(
      {
        type: 'grid',
        columns: { base: 4, md: 6 },
        gutter: { base: 12, md: 24 },
        rowGap: { base: 8 },
      },
      'md',
    );

    expect(styles.columns).toBe(6);
    const styleVars = styles.style as Record<string, string>;
    expect(styleVars['--cols']).toBe('6');
    expect(styleVars['--gutter']).toBe('24px');
    expect(styleVars['--rowgap']).toBe('8px');
  });

  it('computes per-item styles with clamped spans and breakpoint-specific order', () => {
    const layout = mergeLayout(
      {
        name: 'address',
        colSpan: { base: 2, md: 3 },
        order: { base: 1 },
      },
      {
        order: { lg: 4 },
        hide: { md: true },
      },
    );

    expect(resolveBreakpoint(layout.hide, 'md')).toBe(true);

    const mdStyles = computeItemStyles(layout, 'md', 6);
    expect(mdStyles.span).toBe(3);
    expect(mdStyles.style.gridColumn).toBe('span 3 / span 3');

    const lgStyles = computeItemStyles(layout, 'lg', 6);
    expect(lgStyles.span).toBe(3);
    expect(lgStyles.style.order).toBe(4);

    const clamped = computeItemStyles({ colSpan: { base: 12 } }, 'base', 4);
    expect(clamped.span).toBe(4);
  });

  it('infers breakpoints from viewport width with optional overrides', () => {
    expect(inferBreakpointFromWidth(500)).toBe('base');
    expect(inferBreakpointFromWidth(700)).toBe('sm');
    expect(inferBreakpointFromWidth(900)).toBe('md');
    expect(inferBreakpointFromWidth(1100)).toBe('lg');

    expect(
      inferBreakpointFromWidth(900, {
        md: 820,
        lg: 1100,
      }),
    ).toBe('md');
  });
});

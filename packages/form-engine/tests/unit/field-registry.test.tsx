import * as React from 'react';
import { cleanup, render, screen } from '@testing-library/react';

import { FieldFactory, FieldRegistry, initializeFieldRegistry } from '@form-engine/index';
import type { FieldProps } from '@form-engine/components/fields/types';

describe('FieldRegistry', () => {
  beforeEach(() => {
    FieldRegistry.reset();
    initializeFieldRegistry();
  });

  afterEach(() => {
    cleanup();
    FieldRegistry.reset();
  });

  it('registers and retrieves custom field components', () => {
    const registry = FieldRegistry.getInstance();

    const CustomComponent: React.FC<FieldProps> = () => <div>Custom</div>;

    registry.register('Custom', { component: CustomComponent });

    const retrieved = registry.get('Custom');
    expect(retrieved?.component).toBe(CustomComponent);
    expect(registry.list()).toContain('Custom');
  });

  it('merges default props when rendering through the FieldFactory', () => {
    const registry = FieldRegistry.getInstance();

    const CustomComponent: React.FC<FieldProps> = ({ label }) => (
      <div data-testid="custom-field">{label}</div>
    );

    registry.register('Custom', {
      component: CustomComponent,
      defaultProps: {
        label: 'Default Label',
      },
    });

    const { rerender } = render(<FieldFactory widget="Custom" name="custom" />);
    expect(screen.getByTestId('custom-field')).toHaveTextContent('Default Label');

    rerender(<FieldFactory widget="Custom" name="custom" label="Override" />);
    expect(screen.getByTestId('custom-field')).toHaveTextContent('Override');
  });
});

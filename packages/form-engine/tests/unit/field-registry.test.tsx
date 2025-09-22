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

    const CustomComponent: React.FC<FieldProps> = ({ placeholder }) => (
      <input data-testid="custom-field" placeholder={placeholder} />
    );

    registry.register('Custom', {
      component: CustomComponent,
      defaultProps: {
        label: 'Default Label',
        placeholder: 'Default placeholder',
      },
    });

    const { rerender } = render(<FieldFactory widget="Custom" name="custom" />);
    expect(screen.getByText('Default Label')).toBeInTheDocument();
    expect(screen.getByTestId('custom-field')).toHaveAttribute(
      'placeholder',
      'Default placeholder',
    );

    rerender(<FieldFactory widget="Custom" name="custom" label="Override" />);
    expect(screen.getByText('Override')).toBeInTheDocument();
  });

  it('initializes repeater field in the default registry', () => {
    const registry = FieldRegistry.getInstance();
    const repeater = registry.get('Repeater');
    expect(repeater).toBeDefined();
  });

  it('initializes postcode field in the default registry', () => {
    const registry = FieldRegistry.getInstance();
    const postcode = registry.get('Postcode');
    expect(postcode).toBeDefined();
  });
});

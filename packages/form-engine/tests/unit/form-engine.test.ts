import { initializeFormEngine } from '@form-engine/index';

describe('initializeFormEngine', () => {
  it('returns the bootstrap metadata', () => {
    expect(initializeFormEngine()).toEqual({
      version: '0.1.0',
      status: 'initializing',
    });
  });
});

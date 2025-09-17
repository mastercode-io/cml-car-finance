/**
 * Entry point for the form engine package.
 * This will be expanded in later steps of the implementation plan.
 */
export const initializeFormEngine = () => {
  return {
    version: '0.1.0',
    status: 'initializing',
  } as const;
};

export type FormEngineBootstrap = ReturnType<typeof initializeFormEngine>;

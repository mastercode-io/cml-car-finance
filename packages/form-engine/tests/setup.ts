import '@testing-library/jest-dom';

process.env.NEXT_DISABLE_LOCKFILE_PATCH = '1';

// Shared test setup for the form engine package will be expanded in later steps.
jest.mock('localforage');

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/packages/form-engine/tests/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@form-engine/(.*)$': '<rootDir>/packages/form-engine/src/$1',
    '^@testing/(.*)$': '<rootDir>/packages/form-engine/tests/$1',
  },
  testMatch: ['<rootDir>/packages/form-engine/tests/**/*.test.(ts|tsx)'],
  collectCoverageFrom: ['packages/form-engine/src/**/*.{ts,tsx}'],
};

module.exports = createJestConfig(customJestConfig);

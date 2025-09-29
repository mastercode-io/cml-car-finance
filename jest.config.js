module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/packages'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/components/ui/(.*)$': '<rootDir>/components/ui/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/(.*)$': '<rootDir>/$1',
    '^@form-engine/validation/worker-client$':
      '<rootDir>/packages/form-engine/tests/__mocks__/worker-client.ts',
    '^@form-engine/(.*)$': '<rootDir>/packages/form-engine/src/$1',
    '^@testing/(.*)$': '<rootDir>/packages/form-engine/tests/$1',
    '\\./validation/worker-client$':
      '<rootDir>/packages/form-engine/tests/__mocks__/worker-client.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          target: 'ES2022',
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
        diagnostics: false,
        transpilation: true,
      },
    ],
  },
  collectCoverageFrom: [
    'packages/form-engine/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setup.ts'],
  globalSetup: '<rootDir>/src/test-utils/globalSetup.ts',
  globalTeardown: '<rootDir>/src/test-utils/globalTeardown.ts',
  modulePathIgnorePatterns: ['<rootDir>/src/test-utils/'],
};
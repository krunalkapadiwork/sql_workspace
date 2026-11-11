/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: {
          ignoreCodes: [151002],
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/jobs/email.worker.ts'],
  globalTeardown: '<rootDir>/tests/helpers/global-teardown.ts',
  clearMocks: true,
};

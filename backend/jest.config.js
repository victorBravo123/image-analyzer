/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageThreshold: {
    './src/domain/': { branches: 90, functions: 90, lines: 90 },
    './src/application/': { branches: 90, functions: 90, lines: 90 },
  },
  clearMocks: true,
};

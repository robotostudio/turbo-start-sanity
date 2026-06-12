/** @type {import('jest').Config} */
module.exports = {
  coverageReporters: ['clover', 'lcov', 'text'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^@workspace/sanity-blocks$': '<rootDir>/src/sanity-blocks.ts',
    '^@workspace/sanity-blocks/(.*)$': '<rootDir>/src/$1',
    '^@workspace/env/client$': '<rootDir>/src/internal/testing/env.mock.ts',
    '^@workspace/ui/(.*)$': '<rootDir>/../../packages/ui/src/$1',
    '^@workspace/logger$': '<rootDir>/../../packages/logger/src/index.ts',
    '^lucide-react$': '<rootDir>/src/internal/testing/lucide-react.mock.tsx',
    '^lucide-react/dynamic$': '<rootDir>/src/internal/testing/lucide-react-dynamic.mock.tsx',
    '^next/link$': '<rootDir>/src/internal/testing/next-link.mock.tsx',
    '^next-sanity$': '<rootDir>/src/internal/testing/next-sanity.mock.tsx',
  },
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
  },
}

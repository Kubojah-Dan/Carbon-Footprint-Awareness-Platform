const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/.turbo/'],
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    '^@/(.*)$': '<rootDir>/$1',
    '^@earthprint/types$': '<rootDir>/../packages/types/src/index.ts',
    '^@earthprint/ui$': '<rootDir>/../packages/ui/src/index.ts',
    '^@earthprint/emission-engine$': '<rootDir>/../packages/emission-engine/src/index.ts',
  },
};

module.exports = createJestConfig(customJestConfig);

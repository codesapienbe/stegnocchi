/**
 * Jest Configuration
 * Configuration for unit and integration tests
 */

module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|react-native-.*)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js|jsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx|js|jsx)',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/**/__tests__/**',
    '!src/**/*.test.(ts|tsx|js|jsx)',
    '!src/**/*.spec.(ts|tsx|js|jsx)',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
}; 
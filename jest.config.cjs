module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.spec.ts",
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/__tests__/**",
    "!src/test-utils/**",
    "!src/index.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/src/test-utils/setup/jest.setup.ts"],
  testTimeout: 10000,
  maxWorkers: "50%",
  cache: true,
  clearMocks: true,
  restoreMocks: true,
  transform: {
    "^.+\.ts$": ["ts-jest", {
      tsconfig: "tsconfig.json",
    }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(uuid)/)",
  ],
  moduleFileExtensions: ["ts", "js", "json"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/coverage/",
  ],
};

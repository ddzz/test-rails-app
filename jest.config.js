module.exports = {
  testEnvironment: "jsdom",
  // Clear mock call history between tests: suites assert negatives on call
  // counts (e.g. "fetchTasks was not called"), which leaked history breaks.
  clearMocks: true,
  testMatch: ["<rootDir>/frontend/src/**/*.test.jsx"],
  setupFiles: ["<rootDir>/frontend/jest.env.js"],
  setupFilesAfterEnv: ["<rootDir>/frontend/jest.setup.js"]
};

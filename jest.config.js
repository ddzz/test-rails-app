module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/frontend/src/**/*.test.jsx"],
  setupFiles: ["<rootDir>/frontend/jest.env.js"],
  setupFilesAfterEnv: ["<rootDir>/frontend/jest.setup.js"]
};

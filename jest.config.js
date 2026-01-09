module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // This tells Jest to look for files in your tests folder
  testMatch: ["**/tests/**/*.test.ts"],
  // This handles the "Cannot use import statement" error
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
  },
};

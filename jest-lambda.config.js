module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/lib/functions"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};

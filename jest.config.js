/* eslint-disable no-undef */
/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*spec.ts"],
  testPathIgnorePatterns: ["node_modules", "dist"],
  coveragePathIgnorePatterns: ["node_modules", "dist"],
};

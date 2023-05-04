module.exports = {
  branches: ["master"], // the branch to monitor for new commits and releases
  plugins: [
    "@semantic-release/commit-analyzer", // analyzes commit messages to determine the release type
    "@semantic-release/release-notes-generator", // generates release notes from the commit messages
    "@semantic-release/npm", // updates the version in package.json
    [
      "@semantic-release/git",
      {
        assets: ["package.json"], // commits and tags only package.json file
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}", // commit message
      },
    ],
  ],
  preset: "angular", // the default preset to use for commit message parsing
};

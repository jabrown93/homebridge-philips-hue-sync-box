// semantic-release configuration.
//
// Versioning is automated from Conventional Commits:
//   * push to `main` -> stable release (feat -> minor, fix/perf -> patch, ! -> major)
//   * push to `beta` -> prerelease (vX.Y.Z-beta.N)
//
// Routine runtime dependency bumps (fix(deps), from Renovate via the shared
// preset) do NOT cut a release on ordinary pushes -- they would otherwise
// publish a new npm version per merged Renovate PR. The weekly scheduled run
// in .github/workflows/release.yml sets RELEASE_DEPS=true, which promotes the
// accumulated bumps into one patch release. Vulnerability fixes are typed
// fix(security) by the preset, not fix(deps), so they are unaffected by the
// suppression and still release immediately. See jabrown93/.github's README,
// "Weekly dependency releases".
//
// This file is ESM (package.json sets "type": "module"), so it uses
// `export default`, not `module.exports` -- the latter throws
// "ReferenceError: module is not defined in ES module scope" here.
// `${...}` placeholders are expanded by semantic-release, not by JS -- keep
// them inside double-quoted strings so JS does not interpolate them.

const releaseDeps = process.env.RELEASE_DEPS === "true";

const depReleaseRules = [
  // Required: commit-analyzer evaluates every matching custom rule and keeps
  // the highest release type, so without this a breaking fix(deps)! would
  // match ONLY the suppression rule below and never release. Listed first so
  // the analyzer short-circuits on major.
  { type: "fix", scope: "deps", breaking: true, release: "major" },
  releaseDeps
    ? { type: "fix", scope: "deps", release: "patch" }
    : { type: "fix", scope: "deps", release: false },
];

const noteKeywords = ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"];

export default {
  branches: ["main", "next", { name: "beta", prerelease: true }, { name: "alpha", prerelease: true }],
  preset: "conventionalcommits",
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      { parserOpts: { noteKeywords }, releaseRules: depReleaseRules },
    ],
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          "test ${branch.type} != release || sed -i '/^## \\[/h;x;/^[^]]*-/{x;d};x' CHANGELOG.md",
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        parserOpts: { noteKeywords },
        writerOpts: { commitsSort: ["subject", "scope"] },
      },
    ],
    [
      "@semantic-release/changelog",
      {
        changelogTitle:
          "# Changelog\n\nAll notable changes to this project will be documented in this file. See\n[Conventional Commits](https://conventionalcommits.org) for commit guidelines.",
      },
    ],
    ["@semantic-release/npm", { tarballDir: "dist" }],
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          "npx --yes @cyclonedx/cyclonedx-npm@4.2.1 --ignore-npm-errors --output-format JSON --output-file sbom.cdx.json",
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [{ path: "sbom.cdx.json", label: "CycloneDX SBOM (sbom.cdx.json)" }],
      },
    ],
    [
      "@semantic-release/git",
      { message: "ci(release): ${nextRelease.version}\n\n${nextRelease.notes}" },
    ],
  ],
};

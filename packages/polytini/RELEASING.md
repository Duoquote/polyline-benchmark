# Releasing

Releases go out from GitHub Actions (`.github/workflows/release.yml`) to JSR and npm. Neither registry needs a stored token: both trust GitHub's OIDC token for this repository. Scoped packages like `@duoquote/polytini` work the same way as unscoped ones here.

## Every release

1. Bump the version in three places: `package.json`, `jsr.json`, and `VERSION` in `src/cli-lib.js`. `test/cli.test.js` fails if they drift apart.
2. Commit, then either publish a GitHub release for the tag `vX.Y.Z` or push the tag:

   ```sh
   git tag v0.2.0
   git push origin v0.2.0
   ```

The workflow runs the full CI first. Then it checks that all three versions match the tag, and publishes to JSR (`deno publish`) and to npm (`npm publish --provenance --access public`). A published release also pushes its tag, so the workflow can start twice; each publish step skips a version the registry already has.

## One-time setup

### JSR

The package `@duoquote/polytini` exists on JSR. Link it to the GitHub repository `Duoquote/polytini` in the package settings on jsr.io ("Link repository"). After that, `deno publish` in the workflow authenticates with OIDC, which needs `permissions: id-token: write`; the workflow already sets it.

### npm

npm's trusted publishing can only be set up for a package that already exists, so the very first version is published by hand.

1. On your own machine, logged in as `duoquote` with 2FA:

   ```sh
   npm login
   npm publish --access public
   ```

   `--access public` is needed the first time for a scoped package (`publishConfig.access` in `package.json` says the same). Don't pass `--provenance` here: provenance only works from CI.

2. On npmjs.com, open `@duoquote/polytini` > Settings > Trusted publishing, and add a GitHub Actions publisher:
   - Organization or user: `Duoquote`
   - Repository: `polytini`
   - Workflow filename: `release.yml`
   - Environment: leave empty

3. Every release after that goes through the workflow. It uses Node 24 because trusted publishing needs npm 11.5.1 or newer.

Once trusted publishing works, it's worth setting the package to "Require two-factor authentication and disallow tokens" in its npm settings, so only the workflow and your own 2FA logins can publish.

### Deprecated: NPM_TOKEN

The workflow still uses an `NPM_TOKEN` repository secret if one exists, for the gap before trusted publishing is set up. Don't rely on it: npm is restricting tokens that bypass 2FA for direct publishing (https://gh.io/npm-gat-bypass2fa-deprecation). Delete the secret once the trusted publisher works; without it the workflow uses OIDC.

## Checking a release locally

```sh
npm test
node scripts/size.js
npm publish --dry-run
deno publish --dry-run --allow-dirty
node test/smoke.js
```

Nothing in this list publishes anything.

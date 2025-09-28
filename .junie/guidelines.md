Project: tsed-monorepo-tools (MonoRepo Utils)

This document captures project-specific notes to speed up future development on this repository. It assumes you are an experienced JavaScript/Node developer familiar with Yarn workspaces, ESM, and CI/CD.

1) Build and configuration

- Tooling and runtime:
  - Node: prefer >=18.x (ESM by default; top-level await available). Root package.json sets "type": "module".
  - Package manager: Yarn Berry (Yarn 4). packageManager is set to yarn@4.1.0. Use Corepack to ensure the correct version.
    - corepack enable
    - corepack prepare yarn@4.1.0 --activate
  - Workspaces: enabled at the root (workspaces: ["packages/*"]). The main CLI lives under packages/monorepo.

- Install:
  - yarn install
    - Yarn Berry will honor the existing yarn.lock. If you use PnP, keep in mind direct node executions that import workspace files (without bundling) should work inside this repo because we run source directly and most utilities use Node built-ins or dependencies declared in the workspace package.

- Build artifacts:
  - The CLI is authored in ESM and shipped as source (no transpilation step required). Build-related scripts orchestrate monorepo tasks (copy/write package.json, etc.).
  - Primary scripts (root package.json):
    - yarn build → node packages/monorepo/bin/monorepo-build.js --verbose
    - yarn clean → node packages/monorepo/bin/monorepo-clean workspace
    - yarn publish → node packages/monorepo/bin/monorepo-publish.js --dry-run packages (dry run by default)
    - yarn release → semantic-release (if configured)

- CLI usage in your own monorepo (from readme):
  - Add scripts in the target monorepo: monorepo build, monorepo publish, monorepo version <level>, etc.
  - The tool supports Lerna- and Yarn-based workspaces. It can also coordinate semantic-release driven versioning and GitHub releases.

- CI variables (if you adopt release flows):
  - EMAIL, USER, PROJECT_NAME, GH_TOKEN, DOCKER_HUB_ID, DOCKER_HUB_PWD, HEROKU_APP, and HEROKU_API_KEY (see root readme for exact semantics and examples).

2) Testing

Unit tests are now integrated using Vitest (ESM-friendly). Lint checks remain as before. Use the following commands:

- Lint/format checks:
  - yarn test → yarn test:lint
  - yarn test:lint → eslint '{packages,test}/**/*.js' --ext .ts
  - yarn test:lint:fix → eslint '{packages,test}/**/*.js' --fix
  - yarn prettier → prettier '{packages,test}/**/*.js' --write
  Notes:
  - ESLint 8 + Prettier 3 are used. The project is ESM; ensure your editor/ESLint understands ESM config resolution. The lint command targets JS files under packages/ and test/; adjust if you add TypeScript or change locations.

- Unit tests (Vitest):
  - Config: vitest.config.js at the repo root.
  - Test files: packages/*/src/**/*.spec.js
  - Env: node (no DOM globals). Globals (describe/it/expect/vi) are enabled by config; do not import them from 'vitest' (globals: true).
  - Commands:
    - yarn test:unit → run the unit test suite once (CI-friendly)
    - yarn test:watch → watch mode during development

- Writing tests (ESM):
  - Use ESM imports and include the .js extension for local files.
  - Example minimal spec (placed under packages/monorepo/src/utils/packages/readPackage.spec.js):
    // Note: Vitest globals are enabled; do not import from 'vitest'.
    import {readPackage} from './readPackage.js';
    describe('readPackage', () => {
      it('reads the root package.json', () => {
        const pkg = readPackage(new URL('../../../../package.json', import.meta.url).pathname);
        expect(pkg.name).toBe('@tsed/root');
      });
    });

- Notes
  - Node >=18 recommended. Repo is ESM-only ("type": "module").
  - If you add new packages or utilities, co-locate specs next to source under src using the .spec.js suffix so they are auto-discovered by Vitest.

3) Additional development information

- Module system and imports:
  - Root and packages use ESM ("type": "module"). Use .js/.mjs with ESM import/export. When importing local files, include file extensions.

- Workspace layout:
  - packages/monorepo is the primary package. Its src/ contains commands (packages/monorepo/src/commands/**), tasks (src/tasks/**), and utilities (src/utils/**). Notable entry points:
    - packages/monorepo/src/MonoRepo.js → central context and orchestration.
    - packages/monorepo/bin/monorepo.js and related bin scripts → CLI.

- Running tools directly from source:
  - You can invoke the CLI scripts via node without building (they are plain JS/ESM). However, many commands depend on external packages declared in packages/monorepo/package.json. If you plan to run complex commands (build/publish) outside CI, ensure you have run yarn install at the root so workspace dependencies are available.

- Code style:
  - Follow Prettier defaults; resolve lint issues using yarn test:lint:fix. Keep functions small and composable, favor pure utilities in src/utils, and avoid side effects in shared helpers.

- Common pitfalls:
  - Yarn Berry & ESM: ensure your editor and Node version are in sync. Running ad-hoc node scripts that cross package boundaries is fine within this repo, but end-users will usually consume the published package instead.
  - Semantic-release and CI: release flows assume proper env vars and branch configuration (see readme). If you don’t use semantic-release, use the provided monorepo version <level> commands.
  - Lerna/Nx/Yarn detection: MonoRepo.js contains feature detection helpers (hasLerna, hasNx, hasYarn, hasYarnBerry, etc.) that influence behavior when orchestrating workspace tasks.

- Useful scripts during development:
  - yarn clean → cleans workspace artifacts via the CLI.
  - yarn build → runs the internal build pipeline.
  - node packages/monorepo/bin/monorepo --help → discover available commands.

- Debugging tips:
  - Many tasks accept a --verbose flag (see build script usage). Add DEBUG-like logs where needed using chalk/fancy-log patterns used across the codebase.
  - For file operations, utilities often use fs-extra or Node fs directly; prefer existing helpers in src/utils/packages to avoid duplication (e.g., readPackage, writePackage).

Housekeeping for this guideline

- A temporary Node smoke test (temp-readPackage-test.mjs) was used to verify the test example above and has been removed. Recreate it locally when needed following the steps in section 2.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Commit Guidelines

- Do not include `Co-Authored-By` or any AI attribution in commit messages.
- When staging for a commit, use `git add -A` but flag any changes that appear
  unrelated to the current task and ask whether to include them.

## What This Project Is

A GitHub Action that runs VSTest unit tests for
[nanoFramework](https://www.nanoframework.net/) projects on Windows runners and
uploads the `.trx` results as an artifact.

## Commands

```bash
npm run bundle        # Format code + build distribution bundle (run before committing)
npm run package       # Build TypeScript → dist/index.js via @vercel/ncc
npm run package:watch # Watch mode for package building
npm run lint          # Run ESLint
npm run format:write  # Format code with Prettier
npm run format:check  # Check formatting without writing
npm run test          # Run Vitest with coverage
npm run ci-test       # Run Vitest without coverage (used by CI)
npm run all           # Full pipeline: format → lint → test → package
```

To run a single test file:

```bash
npx vitest run __tests__/path/to/test.test.ts
```

## Architecture

**Entry point**: `src/index.ts` → calls `run()` in `src/main.ts`

**Execution flow** (`src/main.ts`):

1. Fail on non-Windows runners; parse inputs (`src/inputs.ts`, defaults in
   `action.yml` only)
2. Find test assemblies (`src/find.ts`)
3. Plan: resolve each assembly's project, adapter (`packages.config` version)
   and run settings, and group them (`src/plan.ts`). Any error fails before
   tests run.
4. Locate vstest.console.exe: newest VS via vswhere, else Microsoft.TestPlatform
   via the tool cache (`src/vstest.ts`)
5. Run each group, continuing past failures (`src/vstest.ts`)
6. Upload results, best effort (`src/artifact.ts`), then fail with a per-group
   summary if any run failed

Unit tests build temporary fixture trees with `__tests__/helpers/fixture.ts`.

**Distribution**: The `dist/` directory contains the bundled single-file output
(`dist/index.js`) checked into git. Always run `npm run bundle` before
committing changes to source files — the `check-dist.yml` workflow will fail the
PR if `dist/` is out of sync. `rebuild-dist.yml` rebuilds and commits `dist/`
automatically on Dependabot PRs and on demand (`workflow_dispatch`) for any
other branch.

**Releases**: see README → Releasing. `v1` is frozen at v1.0.18.

## CI Constraints

- Unit tests (Vitest) run on `ubuntu-latest`
- End-to-end action tests run on `windows-latest` against `solution/`:
  `VsTestAction.sln` (two groups: own runsettings and package fallback) and
  `VsTestActionFailing.sln` (must fail)
- The action itself only works on Windows (requires VSTest / .NET tooling)

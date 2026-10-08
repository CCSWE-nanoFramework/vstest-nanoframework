# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Commit Guidelines

- Do not include `Co-Authored-By` or any AI attribution in commit messages.
- When staging for a commit, use `git add -A` but flag any changes that appear
  unrelated to the current task and ask whether to include them.

## What This Project Is

A GitHub Action that runs VSTest unit tests for
[nanoFramework](https://www.nanoframework.net/) projects. It locates test
assemblies and adapters, downloads VSTest tools from NuGet if needed, executes
tests via `vstest.console.exe` on Windows runners, and uploads results as GitHub
Actions artifacts.

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
npm run coverage      # Generate coverage badge
npm run all           # Full pipeline: format → lint → test → coverage → package
```

To run a single test file:

```bash
npx vitest run __tests__/path/to/test.test.ts
```

## Architecture

**Entry point**: `src/index.ts` → calls `run()` in `src/main.ts`

**Execution flow** (all in `src/main.ts`):

1. Parse action inputs (`src/inputs.ts`)
2. Find test assemblies via glob (`src/vstest.ts`)
3. Find test adapter DLL (`src/vstest.ts`)
4. Locate or download VSTest tools via NuGet (`src/vstest.ts`)
5. Build `vstest.console.exe` arguments and execute (`src/vstest.ts`)
6. Upload `.trx` test results as artifacts (`src/artifact.ts`)

**Default input values** (important for understanding file search behavior): see
`action.yml`, mirrored by `Default` in `src/inputs.ts`.

**Key modules**:

- `src/vstest.ts` — Core: finds assemblies/adapters/settings, downloads
  Microsoft.TestPlatform from NuGet, runs tests
- `src/inputs.ts` — Parses and validates all `action.yml` inputs
- `src/find.ts` — File globbing using `@actions/glob`
- `src/powershell.ts` — PowerShell helpers for expanding zip archives and
  downloading files
- `src/path.ts` — Path normalization utility
- `src/artifact.ts` — Uploads test results via `@actions/artifact`

**Distribution**: The `dist/` directory contains the bundled single-file output
(`dist/index.js`) checked into git. Always run `npm run bundle` before
committing changes to source files — the `check-dist.yml` workflow will fail the
PR if `dist/` is out of sync. `rebuild-dist.yml` rebuilds and commits `dist/`
automatically on Dependabot PRs and on demand (`workflow_dispatch`) for any
other branch.

## CI Constraints

- Unit tests (Vitest) run on `ubuntu-latest`
- End-to-end action tests run on `windows-latest` against the sample solution in
  `solution/`
- The action itself only works on Windows (requires VSTest / .NET tooling)

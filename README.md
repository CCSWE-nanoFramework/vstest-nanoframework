# vstest-nanoframework

A GitHub Action that runs [nanoFramework](https://nanoFramework.net) unit tests
with VSTest. Results are shown in the log and uploaded as `.trx` files.

> **Note:** This action only runs on `windows-*` runners.

## Prerequisites

Restore and build your solution (Release) before running this action, for
example with
[actions-nanoframework](https://github.com/CCSWE-nanoFramework/actions-nanoframework):

```yaml
- uses: actions/checkout@v7

- uses: CCSWE-nanoFramework/actions-nanoframework/.github/actions/setup-nanoframework@master

- uses: CCSWE-nanoFramework/actions-nanoframework/.github/actions/build-nanoframework@master
  with:
    solution: MySolution.sln
```

## How tests are run

- **Projects:** each test assembly maps to the `.nfproj` directory above it.
- **Test adapter:** comes from the `nanoFramework.TestFramework` version in the
  project's `packages.config`, restored under `packages/`.
- **Run settings:** the project's `nano.runsettings`. A project without one
  falls back to the template inside its TestFramework package. `run-settings`
  overrides both.
- **Runs:** assemblies that share settings and an adapter run in one vstest
  call. Every run happens even if an earlier one fails, and the action then
  fails once with a summary per run.

## Inputs

| Name                      | Default                             | Description                                                                                             |
| ------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `test-assemblies`         | `**/bin/Release/NFUnitTest.dll`     | Glob patterns, one per line. Relative patterns resolve against `working-directory`; `!` excludes.       |
| `working-directory`       | `.`                                 | Directory that relative patterns and paths resolve against                                              |
| `run-settings`            |                                     | Run settings file for every project, instead of the per-project lookup                                  |
| `other-console-options`   |                                     | Extra `vstest.console.exe` options, one per line, appended last                                         |
| `results-directory`       | `$RUNNER_TEMP/vstest-nanoframework` | TRX output directory, cleared before the run                                                            |
| `if-no-tests-found`       | `error`                             | `error`, `warn` or `ignore` when no test assemblies match                                               |
| `artifact-name`           | `vstest-results`                    | Results artifact name. Empty skips the upload. Must be unique per run (e.g. include the matrix values). |
| `artifact-retention-days` |                                     | 1-90; empty or 0 uses the repository default                                                            |

## Outputs

| Name                | Description                          |
| ------------------- | ------------------------------------ |
| `results-directory` | Directory containing the TRX results |
| `artifact-id`       | ID of the uploaded results artifact  |

The upload is best effort: missing results or an upload error produce a warning,
not a failure.

## Example

```yaml
- uses: CCSWE-nanoFramework/vstest-nanoframework@v2
  with:
    working-directory: src
    artifact-retention-days: 7
```

## Migrating from v1

v1 is frozen at v1.0.18 (critical fixes only).

- Inputs are kebab-case: `testAssemblies` → `test-assemblies`, `solutionFolder`
  → `working-directory`, `runSettings` → `run-settings`, `otherConsoleOptions` →
  `other-console-options`, `artifactName` → `artifact-name`,
  `artifactRetentionDays` → `artifact-retention-days`.
- Removed: `testAdapter` (resolved per project), `platform`, `runInParallel`,
  `runInIsolation`, `enableCodeCoverage`. Pass vstest flags through
  `other-console-options` if needed.
- `test-assemblies` defaults to `**/bin/Release/NFUnitTest.dll`; set it for
  Debug builds.
- `run-settings` is optional; each project uses its own `nano.runsettings`.
- `other-console-options` takes one option per line.
- Results go to `$RUNNER_TEMP/vstest-nanoframework`, one subdirectory per run.

## Releasing

Releases are tag-driven:

1. Make sure `master` is green and `dist/` is committed and up to date
   (`npm run bundle` produces no diff — CI enforces this).
2. Create and push a `vMAJOR.MINOR.PATCH` tag from `master`:

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

The [`Release`](.github/workflows/release.yml) workflow re-runs
format/lint/test, re-verifies `dist/`, creates a GitHub Release with generated
notes, and moves the major tag (`vN`) to the new release. A tag with a hyphen
(e.g. `v2.1.0-beta.1`) is a pre-release and doesn't move the major tag.

Runtime dependency fixes (including Dependabot security updates) are bundled
into `dist/`, so they only reach consumers once released.

To point a major tag at another release by hand (e.g. a rollback), run the
[`Update Main Version`](.github/workflows/update-main-version.yml) workflow.

### v1 fixes

1. Branch `release/v1` from `v1.0.18` and add `release/**` to the branch filters
   in `ci.yml` and `check-dist.yml`.
2. Fix, bundle, and tag `v1.0.19` on that branch. `release.yml` requires tags on
   `master`, so relax that check on the branch.
3. Create the release with
   `gh release create v1.0.19 --generate-notes --notes-start-tag v1.0.18 --latest=false`
   so v2 stays "Latest".

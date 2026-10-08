# vstest-nanoframework

A GitHub Action that executes [nanoFramework](https://nanoFramework.net) unit
tests using the VSTest framework. Test results are displayed in the console logs
and attached as a `.trx` artifact.

> **Note:** This action only runs on `windows-*` runners.

## Prerequisites

Your workflow must set up the following before using this action:

```yaml
- uses: actions/checkout@v7
  with:
    fetch-depth: 0

- uses: nanoframework/nanobuild@v1

- uses: microsoft/setup-msbuild@v3

- uses: nuget/setup-nuget@v4
```

After setup, restore NuGet packages and build your solution before running this
action.

## Inputs

| Name                    | Required | Default                                        | Type      | Description                                                                                                                                                                                       |
| ----------------------- | -------- | ---------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `testAssemblies`        | yes      | `**\bin\**\NFUnitTest.dll`                     | `string`  | Glob pattern for test assembly files to run                                                                                                                                                       |
| `solutionFolder`        | yes      | `.\`                                           | `string`  | Folder to search for the test assemblies and test adapter                                                                                                                                         |
| `testAdapter`           | yes      | `**\packages\**\nanoFramework.TestAdapter.dll` | `string`  | Glob pattern for the test adapter assembly                                                                                                                                                        |
| `runSettings`           | no       |                                                | `string`  | Path to runsettings or testsettings file to use with the tests. If not set, `solutionFolder` is searched for `nano.runsettings`; the action fails if none is found                                |
| `runInParallel`         | no       | `false`                                        | `boolean` | If set, tests will run in parallel leveraging available cores of the machine. This will override the MaxCpuCount if specified in your runsettings file. Valid values are: `true` and `false`      |
| `runInIsolation`        | no       | `false`                                        | `boolean` | Runs the tests in an isolated process. This makes vstest.console.exe process less likely to be stopped on an error in the tests, but tests might run slower. Valid values are: `true` and `false` |
| `enableCodeCoverage`    | no       | `false`                                        | `boolean` | Collect code coverage information from the test run                                                                                                                                               |
| `otherConsoleOptions`   | no       |                                                | `string`  | Other options that can be passed to vstest.console.exe                                                                                                                                            |
| `platform`              | no       |                                                | `string`  | Build platform against which the tests should be reported. Valid values are: `x86`, `x64`, and `ARM`                                                                                              |
| `artifactName`          | yes      | `vstest-results`                               | `string`  | Test result artifact name                                                                                                                                                                         |
| `artifactRetentionDays` | no       |                                                | `number`  | Duration after which artifact will expire in days. 0 means using default retention. Minimum 1 day. Maximum 90 days unless changed from the repository settings page.                              |

## Outputs

Test results are uploaded as a `.trx` artifact named by `artifactName`. The
artifact can be downloaded from the GitHub Actions run summary.

## Example usage

Minimal configuration using default glob patterns:

```yaml
- uses: CCSWE-nanoFramework/vstest-nanoframework@v1
  with:
    solutionFolder: '.\src'
    artifactName: 'unit_test_results'
    artifactRetentionDays: 7
```

With a runsettings file, parallel execution, and code coverage:

```yaml
- uses: CCSWE-nanoFramework/vstest-nanoframework@v1
  with:
    solutionFolder: '.\src'
    runSettings: '.\src\NFUnitTest1\nano.runsettings'
    runInParallel: true
    enableCodeCoverage: true
    artifactName: 'unit_test_results'
    artifactRetentionDays: 7
```

## Releasing

Releases are tag-driven. To cut a release:

1. Make sure `master` is green and `dist/` is committed and up to date
   (`npm run bundle` produces no diff — CI enforces this).
2. Create and push a `vMAJOR.MINOR.PATCH` tag:

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

The [`Release`](.github/workflows/release.yml) workflow then re-runs
format/lint/test, re-verifies the committed `dist/`, creates a GitHub Release
with auto-generated (categorized) notes, and moves the major tag (`v1`) to the
new release.

For a prerelease, include a hyphen (e.g. `v1.1.0-beta.1`): the release is marked
**pre-release** and the major `v1` tag is **not** moved.

Consumers keep referencing the major tag:

```yaml
- uses: CCSWE-nanoFramework/vstest-nanoframework@v1
```

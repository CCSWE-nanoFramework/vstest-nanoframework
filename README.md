# vstest-nanoframework

A GitHub Action that executes [nanoFramework](https://nanoFramework.net) unit
tests using the VSTest framework. Test results are displayed in the console logs
and attached as a `.trx` artifact.

> **Note:** This action only runs on `windows-*` runners.

## Prerequisites

Your workflow must set up the following before using this action:

```yaml
- uses: actions/checkout@v6
  with:
    fetch-depth: 0

- uses: nanoframework/nanobuild@v1

- uses: microsoft/setup-msbuild@v3

- uses: nuget/setup-nuget@v3
```

After setup, restore NuGet packages and build your solution before running this
action.

## Inputs

| Name                    | Default                                        | Type      | Description                                                                                                                                                                                       |
| ----------------------- | ---------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `testAssemblies`        | `**\bin\**\NFUnitTest.dll`                     | `string`  | Glob pattern for test assembly files to run                                                                                                                                                       |
| `solutionFolder`        | `.\`                                           | `string`  | Folder to search for the test assemblies and test adapter                                                                                                                                         |
| `testAdapter`           | `**\packages\**\nanoFramework.TestAdapter.dll` | `string`  | Glob pattern for the test adapter assembly                                                                                                                                                        |
| `runSettings`           |                                                | `string`  | Path to runsettings or testsettings file to use with the tests                                                                                                                                    |
| `runInParallel`         | `false`                                        | `boolean` | If set, tests will run in parallel leveraging available cores of the machine. This will override the MaxCpuCount if specified in your runsettings file. Valid values are: `true` and `false`      |
| `runInIsolation`        | `false`                                        | `boolean` | Runs the tests in an isolated process. This makes vstest.console.exe process less likely to be stopped on an error in the tests, but tests might run slower. Valid values are: `true` and `false` |
| `enableCodeCoverage`    | `false`                                        | `boolean` | Collect code coverage information from the test run                                                                                                                                               |
| `otherConsoleOptions`   |                                                | `string`  | Other options that can be passed to vstest.console.exe                                                                                                                                            |
| `platform`              |                                                | `string`  | Build platform against which the tests should be reported. Valid values are: `x86`, `x64`, and `ARM`                                                                                              |
| `artifactName`          | `vstest-results`                               | `string`  | Test result artifact name                                                                                                                                                                         |
| `artifactRetentionDays` |                                                | `number`  | Duration after which artifact will expire in days. 0 means using default retention. Minimum 1 day. Maximum 90 days unless changed from the repository settings page.                             |

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

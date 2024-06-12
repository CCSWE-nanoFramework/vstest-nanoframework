# vstest-nanoframework

This action is a rewrite of the
[vstest-action](https://github.com/microsoft/vstest-action) provided by
Microsoft.

It was created specifically to execute unit tests in a
[nanoFramework](https://nanoFramework.net) project using VSTest framework. This
action only supports `Windows` but NOT `Linux`.

Due to the unavailability of a test results UI, test results are displayed in
the console logs of the action and attached as an artifact.

## Inputs

| Name                    | Default                                        | Type      | Description                                                                                                                                                                                       |
| ----------------------- | ---------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `testAssemblies`        | `**\bin\**\NFUnitTest.dll`                     | `string`  | Run tests from the specified files                                                                                                                                                                |
| `solutionFolder`        | `.\`                                           | `string`  | Folder to search for the test assemblies and test adapter                                                                                                                                         |
| `testAdapter`           | `**\packages\**\nanoFramework.TestAdapter.dll` | `string`  | Run tests using the specified test adapter                                                                                                                                                        |
| `runSettings`           |                                                | `string`  | Path to runsettings or testsettings file to use with the tests                                                                                                                                    |
| `runInParallel`         | `false`                                        | `boolean` | If set, tests will run in parallel leveraging available cores of the machine. This will override the MaxCpuCount if specified in your runsettings file. Valid values are: `true` and `false`      |
| `runInIsolation`        | `false`                                        | `boolean` | Runs the tests in an isolated process. This makes vstest.console.exe process less likely to be stopped on an error in the tests, but tests might run slower. Valid values are: `true` and `false` |
| `enableCodeCoverage`    | `false`                                        | `boolean` | Collect code coverage information from the test run                                                                                                                                               |
| `otherConsoleOptions`   |                                                | `string`  | Other options that can be passed to vstest.console.exe                                                                                                                                            |
| `platform`              |                                                | `string`  | Build platform against which the tests should be reported. Valid values are: `x86`, `x64`, and `ARM`                                                                                              |
| `artifactName`          | `vstest-results`                               | `string`  | Test result artifact name                                                                                                                                                                         |
| `artifactRetentionDays` |                                                | `number`  | Duration after which artifact will expire in days. 0 means using default retention. Minimum 1 day. Maximum 90 days unless changed the repository settings page.                                   |

## Example usage

```yaml
- uses: CCSWE-nanoFramework/vstest-nanoframework@v1
  with:
    solutionFolder: '.\src'
    runSettings: '.\src\NFUnitTest1\nano.runsettings'
    artifactName: 'unit_test_results'
    artifactRetentionDays: 7
```

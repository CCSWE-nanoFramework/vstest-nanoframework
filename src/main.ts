import * as core from '@actions/core'
import * as io from '@actions/io'
import * as artifact from './artifact.js'
import { findFiles } from './find.js'
import { getActionInputs, Input } from './inputs.js'
import * as path from './path.js'
import { planTestGroups } from './plan.js'
import * as vstest from './vstest.js'

export async function run(): Promise<void> {
  try {
    if (process.platform !== 'win32') {
      throw new Error(
        'vstest-nanoframework requires a Windows runner (vstest.console.exe and the .NET Framework 4.8 test adapter)'
      )
    }

    const inputs = getActionInputs()

    const assemblies = await findFiles(
      inputs.testAssemblies,
      inputs.workingDirectory
    )
    if (assemblies.length === 0) {
      const message = `No test assemblies found for '${Input.TestAssemblies}': ${inputs.testAssemblies.join(', ')}`
      switch (inputs.ifNoTestsFound) {
        case 'error':
          throw new Error(message)
        case 'warn':
          core.warning(message)
          return
        case 'ignore':
          core.info(message)
          return
      }
    }

    const groups = planTestGroups(
      assemblies,
      inputs.runSettings,
      inputs.workingDirectory
    )
    for (const group of groups) {
      core.info(
        `${group.name}: ${group.assemblies.length} assembly(ies), settings ${group.runSettings}`
      )
    }

    const vsTestPath =
      (await vstest.getVsTestPath()) || (await vstest.downloadTestTools())
    core.info(`Using ${vsTestPath}`)

    const resultsDirectory =
      inputs.resultsDirectory ||
      path.join(process.env['RUNNER_TEMP'] ?? '.', 'vstest-nanoframework')
    await io.rmRF(resultsDirectory)
    await io.mkdirP(resultsDirectory)
    core.setOutput('results-directory', resultsDirectory)

    const results: vstest.GroupResult[] = []
    for (const group of groups) {
      results.push(
        await vstest.runTestGroup(
          vsTestPath,
          group,
          resultsDirectory,
          inputs.otherConsoleOptions
        )
      )
    }

    if (inputs.artifactName) {
      const id = await artifact.uploadResults(
        inputs.artifactName,
        resultsDirectory,
        inputs.artifactRetentionDays
      )
      if (id !== undefined) {
        core.setOutput('artifact-id', id)
      }
    }

    const failed = results.filter(r => r.exitCode !== 0)
    if (failed.length > 0) {
      const lines = failed.map(r =>
        r.hasResults
          ? `${r.group.name}: tests failed (exit code ${r.exitCode})`
          : `${r.group.name}: vstest failed without writing results (exit code ${r.exitCode})`
      )
      throw new Error(
        `${failed.length} of ${results.length} test run(s) failed:\n${lines.join('\n')}`
      )
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error))
  }
}

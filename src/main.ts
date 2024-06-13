import * as core from '@actions/core'
import * as path from 'path'
import * as artifact from './artifact'
import * as vstest from './vstest'
import { Default, getActionInputs } from './inputs'

export async function run(): Promise<void> {
  let testsExecuted = false
  const inputs = getActionInputs()

  try {
    const testAssemblies = await vstest.getTestAssemblies(inputs)
    if (testAssemblies.length === 0) {
      throw new Error('No test assemblies found.')
    }

    core.debug(`Matched test assemblies are:`)
    for (const testAssembly of testAssemblies) {
      core.debug(`${testAssembly}`)
    }

    const testAdapters = await vstest.getTestAdapters(inputs)
    core.debug(`Matched test adapters are:`)
    for (const testAdapter of testAdapters) {
      core.debug(`${testAdapter}`)
    }

    if (testAdapters.length === 0) {
      throw new Error('Test adapter not found')
    } else if (testAdapters.length > 1) {
      core.warning('Multiple test adapters found')
      for (const testAdapter of testAdapters) {
        core.warning(`${testAdapter}`)
      }
    }

    const testAdapterPath = path.dirname(testAdapters[0])

    if (!inputs.runSettings) {
      const runSettings = await vstest.getRunSettings(inputs)

      if (runSettings.length === 0) {
        throw new Error('Run settings not found')
      } else if (runSettings.length > 1) {
        core.warning('Multiple run settings found')
        for (const runSetting of runSettings) {
          core.warning(`${runSetting}`)
        }
      }

      inputs.runSettings = runSettings[0]
    }

    let vsTestPath = await vstest.getVsTestPath()
    if (!vsTestPath) {
      vsTestPath = await vstest.downloadTestTools()
    }

    core.info(`${vsTestPath}`)

    const args = vstest.getTestArguments(inputs)
    core.debug(`Arguments: ${args}`)

    core.info(`Running tests...`)
    testsExecuted = true
    await vstest.runTests(vsTestPath, testAssemblies, testAdapterPath, args)
  } catch (error) {
    core.setFailed(error.message)
  }

  try {
    if (testsExecuted) {
      await artifact.uploadArtifact(
        inputs.artifactName ?? Default.artifactName,
        'TestResults',
        inputs.artifactRetentionDays
      )
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

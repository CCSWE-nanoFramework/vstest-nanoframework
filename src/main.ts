import * as core from '@actions/core'
import * as path from 'path'
import * as vstest from './vstest'
import { getActionInputs } from './inputs'
import { uploadArtifact } from './__reference__/uploadArtifact'

export async function run(): Promise<void> {
  let testsExecuted = false

  try {
    const inputs = getActionInputs()

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
        core.info(`${testAdapter}`)
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
          core.info(`${runSetting}`)
        }
      }

      inputs.runSettings = runSettings[0]
    }

    const vsTestPath = await vstest.downloadTestTools()
    core.debug(`${vsTestPath}`)

    const args = vstest.getTestArguments(inputs)
    core.debug(`Arguments: ${args}`)

    core.info(`Running tests...`)
    testsExecuted = true
    await vstest.runTests(vsTestPath, testAssemblies, testAdapterPath, args)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unknown error occured.')
    }
  }

  try {
    if (testsExecuted) {
      await uploadArtifact()
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unknown error occured.')
    }
  }
}

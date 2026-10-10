import * as core from '@actions/core'

export enum Input {
  ArtifactName = 'artifact-name',
  ArtifactRetentionDays = 'artifact-retention-days',
  IfNoTestsFound = 'if-no-tests-found',
  OtherConsoleOptions = 'other-console-options',
  ResultsDirectory = 'results-directory',
  RunSettings = 'run-settings',
  TestAssemblies = 'test-assemblies',
  WorkingDirectory = 'working-directory'
}

export type IfNoTestsFound = 'error' | 'warn' | 'ignore'

const IfNoTestsFoundValues: IfNoTestsFound[] = ['error', 'warn', 'ignore']

export interface Inputs {
  artifactName: string
  artifactRetentionDays: number
  ifNoTestsFound: IfNoTestsFound
  otherConsoleOptions: string[]
  resultsDirectory: string
  runSettings: string
  testAssemblies: string[]
  workingDirectory: string
}

/**
 * Reads the action inputs. Defaults live in action.yml; invalid values throw.
 */
export function getActionInputs(): Inputs {
  return {
    artifactName: core.getInput(Input.ArtifactName),
    artifactRetentionDays: getRetentionDays(),
    ifNoTestsFound: getIfNoTestsFound(),
    otherConsoleOptions: core.getMultilineInput(Input.OtherConsoleOptions),
    resultsDirectory: core.getInput(Input.ResultsDirectory),
    runSettings: core.getInput(Input.RunSettings),
    testAssemblies: core.getMultilineInput(Input.TestAssemblies, {
      required: true
    }),
    workingDirectory: core.getInput(Input.WorkingDirectory, { required: true })
  }
}

function getIfNoTestsFound(): IfNoTestsFound {
  const value = core.getInput(Input.IfNoTestsFound, { required: true })
  const match = IfNoTestsFoundValues.find(v => v === value)
  if (!match) {
    throw new Error(
      `Invalid value for '${Input.IfNoTestsFound}': ${value}. Expected one of: ${IfNoTestsFoundValues.join(', ')}`
    )
  }
  return match
}

function getRetentionDays(): number {
  const value = core.getInput(Input.ArtifactRetentionDays)
  if (!value) {
    return 0
  }

  const days = Number(value)
  if (!/^\d+$/.test(value) || days > 90) {
    throw new Error(
      `Invalid value for '${Input.ArtifactRetentionDays}': ${value}. Expected a whole number from 0 to 90`
    )
  }
  return days
}

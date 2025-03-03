import * as core from '@actions/core'

export enum Input {
  ArtifactName = 'artifactName',
  ArtifactRetentionDays = 'artifactRetentionDays',
  EnableCodeCoverage = 'enableCodeCoverage',
  Platform = 'platform',
  RunInIsolation = 'runInIsolation',
  RunInParallel = 'runInParallel',
  RunSettings = 'runSettings',
  SolutionFolder = 'solutionFolder',
  TestAdapter = 'testAdapter',
  TestAssemblies = 'testAssemblies',
  VsTestArguments = 'vsTestArguments'
}

export interface Inputs {
  artifactName?: string
  artifactRetentionDays?: number
  enableCodeCoverage?: boolean
  platform?: string
  runInIsolation?: boolean
  runInParallel?: boolean
  runSettings?: string
  solutionFolder?: string
  testAdapter?: string
  testAssemblies?: string
  vsTestArguments?: string
}

export function getActionInputs(): Inputs {
  return {
    enableCodeCoverage: getBooleanInput(
      Input.EnableCodeCoverage,
      Default.enableCodeCoverage
    ),
    platform: getStringInput(Input.Platform, Default.platform),
    artifactName: getStringInput(Input.ArtifactName, Default.artifactName),
    artifactRetentionDays: getNumberInput(
      Input.ArtifactRetentionDays,
      Default.artifactRetentionDays
    ),
    runInIsolation: getBooleanInput(
      Input.RunInIsolation,
      Default.runInIsolation
    ),
    runInParallel: getBooleanInput(Input.RunInParallel, Default.runInParallel),
    runSettings: getStringInput(Input.RunSettings, Default.runSettings),
    solutionFolder: getStringInput(
      Input.SolutionFolder,
      Default.solutionFolder
    ),
    testAdapter: getStringInput(Input.TestAdapter, Default.testAdapter),
    testAssemblies: getStringInput(
      Input.TestAssemblies,
      Default.testAssemblies
    ),
    vsTestArguments: getStringInput(
      Input.VsTestArguments,
      Default.vsTestArguments
    )
  }
}

export function getBooleanInput(name: string, defaultValue: boolean): boolean {
  try {
    return core.getBooleanInput(name) ?? defaultValue
  } catch {
    return defaultValue
  }
}

export function getNumberInput(name: string, defaultValue: number): number {
  try {
    let input = defaultValue
    const inputString = core.getInput(name) ?? defaultValue

    if (inputString) {
      input = parseInt(inputString)
      if (isNaN(input)) {
        input = defaultValue
        core.warning(`Invalid input supplied for '${name}': ${inputString}`)
      }
    }

    return input
  } catch {
    return defaultValue
  }
}

export function getStringInput(name: string, defaultValue: string): string {
  try {
    const input = core.getInput(name) ?? defaultValue
    return input ? input : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Keep these in sync with action.yml
 */
class InputsImplementation implements Inputs {
  enableCodeCoverage = false
  platform = ''
  artifactName = 'vstest-results'
  artifactRetentionDays = 0
  runInIsolation = false
  runInParallel = false
  runSettings = ''
  solutionFolder = '.\\'
  testAdapter = '**\\packages\\**\\nanoFramework.TestAdapter.dll'
  testAssemblies = '**\\bin\\**\\NFUnitTest.dll'
  vsTestArguments = ''
}

export const Default = new InputsImplementation()

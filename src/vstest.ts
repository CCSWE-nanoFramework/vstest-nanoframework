import * as core from '@actions/core'
import * as exec from '@actions/exec'
import path from 'path'
import { Input, Inputs } from './inputs'
import { find } from './find'
import * as powershell from './powershell'

export async function downloadTestTools(): Promise<string> {
  core.info(`Downloading test tools...`)
  const outFile = path.join(__dirname, 'microsoft.testplatform.17.10.0.zip')

  await powershell.invokeWebRequest(
    'https://www.nuget.org/api/v2/package/Microsoft.TestPlatform/17.10.0',
    outFile
  )

  core.info(`Unzipping test tools...`)
  const destinationPath = path.join(__dirname, 'microsoft.testplatform')

  await powershell.expandArchive(outFile, destinationPath)

  const vsTestPath = path.join(
    __dirname,
    'microsoft.testplatform\\tools\\net462\\Common7\\IDE\\Extensions\\TestPlatform\\vstest.console.exe'
  )

  return vsTestPath
}

export async function getRunSettings(inputs: Inputs): Promise<string[]> {
  if (!inputs.solutionFolder) {
    throw new Error(`No value supplied for '${Input.SolutionFolder}'`)
  }

  const pattern = path.join(inputs.solutionFolder, '**\\nano.runsettings')

  core.debug(`Pattern to search run settings: ${pattern}`)

  const runSettings = await find(pattern)

  return runSettings.files
}

export async function getTestAdapters(inputs: Inputs): Promise<string[]> {
  if (!inputs.solutionFolder) {
    throw new Error(`No value supplied for '${Input.SolutionFolder}'`)
  }

  if (!inputs.testAdapter) {
    throw new Error(`No value supplied for '${Input.TestAdapter}'`)
  }

  const pattern = path.join(inputs.solutionFolder, inputs.testAdapter)

  core.debug(`Pattern to search test adapter: ${pattern}`)

  const testAdapters = await find(pattern)

  return testAdapters.files
}

export function getTestArguments(inputs: Inputs): string {
  let args = ''
  if (inputs.enableCodeCoverage) {
    args += '/EnableCodeCoverage '
  }
  if (isValidPlatform(inputs.platform)) {
    args += `/Platform:${inputs.platform} `
  }
  if (inputs.runInIsolation) {
    args += '/InIsolation '
  }
  if (inputs.runInParallel) {
    args += '/Parallel '
  }
  if (inputs.runSettings) {
    args += `/Settings:${inputs.runSettings} `
  }
  // This one should come last
  if (inputs.vsTestArguments) {
    args += inputs.vsTestArguments
  }
  return args
}

export async function getTestAssemblies(inputs: Inputs): Promise<string[]> {
  if (!inputs.solutionFolder) {
    throw new Error(`No value supplied for '${Input.SolutionFolder}'`)
  }

  if (!inputs.testAssemblies) {
    throw new Error(`No value supplied for '${Input.TestAssemblies}'`)
  }

  const pattern = path.join(inputs.solutionFolder, inputs.testAssemblies)

  core.debug(`Pattern to search test assemblies: ${pattern}`)

  const testAssemblies = await find(pattern)

  return testAssemblies.files
}

export async function getVsTestPath(): Promise<string> {
  // TODO: Don't hardcode a specific version but glob on that as well and find the highest
  const vsTestFindResult = await find(
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\*\\Common7\\IDE\\CommonExtensions\\Microsoft\\TestWindow\\vstest.console.exe'
  )

  return vsTestFindResult.files.length > 0 ? vsTestFindResult.files[0] : ''
}

// TODO: This should move somewhere else
function isValidPlatform(platform?: string): boolean {
  if (!platform) {
    return false
  }

  return platform === 'x86' || platform === 'x64' || platform === 'ARM'
}

export async function runTests(
  vsTestPath: string,
  testAssemblies: string[],
  testAdapterPath: string,
  args: string
): Promise<void> {
  await exec.exec(
    `${vsTestPath} ${testAssemblies.join(' ')} /TestAdapterPath:${testAdapterPath} ${args} /Logger:TRX /ResultsDirectory:TestResults`
  )
}

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import path from 'path'
import { fileURLToPath } from 'url'
import { Input, Inputs } from './inputs.js'
import { find } from './find.js'
import * as powershell from './powershell.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

const VsTestSubPath =
  'Common7\\IDE\\CommonExtensions\\Microsoft\\TestWindow\\vstest.console.exe'

// vswhere.exe ships with every Visual Studio install since 2017 and reports
// install locations regardless of the folder VS chose (2019, 2022, 18, ...) or
// the drive it was installed to.
async function getVsInstallPaths(): Promise<string[]> {
  const vsWhere = path.join(
    process.env['ProgramFiles(x86)'] ?? '',
    'Microsoft Visual Studio',
    'Installer',
    'vswhere.exe'
  )

  try {
    const result = await exec.getExecOutput(
      vsWhere,
      ['-all', '-products', '*', '-property', 'installationPath'],
      { ignoreReturnCode: true, silent: true }
    )

    if (result.exitCode !== 0) {
      core.debug(`vswhere.exe exited with code ${result.exitCode}`)
      return []
    }

    return result.stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  } catch {
    core.debug(`vswhere.exe not available at ${vsWhere}`)
    return []
  }
}

// Searched in order when vswhere is unavailable. Known versions are listed
// newest first so the preferred install wins; the trailing wildcard still
// matches all of them, but only after the explicit ordering has been applied,
// and catches future releases.
const VsFallbackRoots = [
  'C:\\Program Files\\Microsoft Visual Studio\\18\\*',
  'C:\\Program Files\\Microsoft Visual Studio\\2022\\*',
  'C:\\Program Files\\Microsoft Visual Studio\\2019\\*',
  'C:\\Program Files\\Microsoft Visual Studio\\*\\*'
]

export async function getVsTestPath(): Promise<string> {
  for (const installPath of await getVsInstallPaths()) {
    core.debug(`Searching Visual Studio install at ${installPath}`)

    const vsTestFindResult = await find(path.join(installPath, VsTestSubPath))

    if (vsTestFindResult.files.length > 0) {
      return vsTestFindResult.files[0]
    }
  }

  for (const root of VsFallbackRoots) {
    const vsTestFindResult = await find(`${root}\\${VsTestSubPath}`)

    if (vsTestFindResult.files.length > 0) {
      return vsTestFindResult.files[0]
    }
  }

  return ''
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
    `"${vsTestPath}" ${testAssemblies.join(' ')} /TestAdapterPath:${testAdapterPath} ${args} /Logger:TRX /ResultsDirectory:TestResults`
  )
}

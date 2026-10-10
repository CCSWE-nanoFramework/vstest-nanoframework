import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as tc from '@actions/tool-cache'
import { existsSync } from 'fs'
import * as nodePath from 'path'
import * as path from './path.js'
import type { TestGroup } from './plan.js'

export const TestPlatformVersion = '18.10.1'

const TestPlatformSubPath =
  'tools/net462/Common7/IDE/Extensions/TestPlatform/vstest.console.exe'

const VsTestSubPath =
  'Common7/IDE/CommonExtensions/Microsoft/TestWindow/vstest.console.exe'

export interface GroupResult {
  exitCode: number
  group: TestGroup
  hasResults: boolean
}

/**
 * Downloads Microsoft.TestPlatform into the tool cache (or reuses a cached
 * copy) and returns its vstest.console.exe.
 */
export async function downloadTestTools(): Promise<string> {
  let directory = tc.find('Microsoft.TestPlatform', TestPlatformVersion)

  if (!directory) {
    core.info(`Downloading Microsoft.TestPlatform ${TestPlatformVersion}...`)
    const archive = await tc.downloadTool(
      `https://www.nuget.org/api/v2/package/Microsoft.TestPlatform/${TestPlatformVersion}`
    )
    const extracted = await tc.extractZip(archive)
    directory = await tc.cacheDir(
      extracted,
      'Microsoft.TestPlatform',
      TestPlatformVersion
    )
  }

  const vsTestPath = path.join(directory, TestPlatformSubPath)
  if (!existsSync(vsTestPath)) {
    throw new Error(`vstest.console.exe not found at ${vsTestPath}`)
  }
  return vsTestPath
}

/**
 * Returns vstest.console.exe from the newest Visual Studio install, or an
 * empty string when none is found.
 */
export async function getVsTestPath(): Promise<string> {
  const vsWhere = path.join(
    process.env['ProgramFiles(x86)'] ?? '',
    'Microsoft Visual Studio/Installer/vswhere.exe'
  )

  if (!existsSync(vsWhere)) {
    core.debug(`vswhere.exe not found at ${vsWhere}`)
    return ''
  }

  // exec parses its first argument as a command line; quote paths with spaces.
  const result = await exec.getExecOutput(
    quote(toNative(vsWhere)),
    ['-latest', '-products', '*', '-property', 'installationPath'],
    { ignoreReturnCode: true, silent: true }
  )

  const installPath = result.stdout.trim()
  if (result.exitCode !== 0 || !installPath) {
    core.debug(`vswhere.exe found no Visual Studio install`)
    return ''
  }

  const vsTestPath = path.join(installPath, VsTestSubPath)
  return existsSync(vsTestPath) ? vsTestPath : ''
}

export function getTestArguments(
  group: TestGroup,
  resultsDirectory: string,
  otherConsoleOptions: string[]
): string[] {
  return [
    ...group.assemblies.map(toNative),
    `/TestAdapterPath:${toNative(group.adapterDirectory)}`,
    `/Settings:${toNative(group.runSettings)}`,
    `/Logger:trx;LogFileName=${group.name}.trx`,
    `/ResultsDirectory:${toNative(resultsDirectory)}`,
    ...otherConsoleOptions
  ]
}

/**
 * Runs one group. Never throws for a failing run: the exit code and whether a
 * TRX was written are returned so the caller can tell failures from crashes.
 */
export async function runTestGroup(
  vsTestPath: string,
  group: TestGroup,
  resultsDirectory: string,
  otherConsoleOptions: string[]
): Promise<GroupResult> {
  const groupDirectory = path.join(resultsDirectory, group.name)
  const args = getTestArguments(group, groupDirectory, otherConsoleOptions)

  core.startGroup(`vstest ${group.name}`)
  let exitCode: number
  try {
    exitCode = await exec.exec(quote(toNative(vsTestPath)), args, {
      ignoreReturnCode: true
    })
  } catch (error) {
    core.error(error instanceof Error ? error.message : String(error))
    exitCode = -1
  } finally {
    core.endGroup()
  }

  const trx = await (
    await glob.create(path.join(groupDirectory, '**/*.trx'))
  ).glob()

  return { exitCode, group, hasResults: trx.length > 0 }
}

function quote(value: string): string {
  return `"${value}"`
}

function toNative(value: string): string {
  return nodePath.normalize(value)
}

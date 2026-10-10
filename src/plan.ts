import { existsSync, readdirSync, readFileSync } from 'fs'
import * as nodePath from 'path'
import * as path from './path.js'

const TestFrameworkId = 'nanoFramework.TestFramework'

export interface TestProject {
  assembly: string
  directory: string
  name: string
}

export interface TestGroup {
  adapterDirectory: string
  assemblies: string[]
  name: string
  runSettings: string
}

/**
 * Resolves each test assembly to its project, test adapter and run settings,
 * and groups assemblies that share both. Throws on the first problem so a
 * misconfiguration fails before any tests run.
 */
export function planTestGroups(
  assemblies: string[],
  runSettings: string,
  workingDirectory: string
): TestGroup[] {
  const groups = new Map<string, TestGroup>()

  for (const assembly of assemblies) {
    const project = findProject(assembly)
    const packageDirectory = findTestFrameworkPackage(project)
    const adapterDirectory = path.join(packageDirectory, 'lib', 'net48')
    if (
      !existsSync(path.join(adapterDirectory, 'nanoFramework.TestAdapter.dll'))
    ) {
      throw new Error(
        `Test adapter not found in ${adapterDirectory} (${project.name})`
      )
    }

    const settings = resolveRunSettings(
      runSettings,
      workingDirectory,
      project,
      packageDirectory
    )

    const key = `${settings}|${adapterDirectory}`
    let group = groups.get(key)
    if (!group) {
      group = {
        adapterDirectory,
        assemblies: [],
        name: `${groups.size + 1}-${project.name}`,
        runSettings: settings
      }
      groups.set(key, group)
    }
    group.assemblies.push(assembly)
  }

  return [...groups.values()]
}

/**
 * Walks up from the assembly to the first directory containing an .nfproj.
 */
export function findProject(assembly: string): TestProject {
  let directory = path.normalize(nodePath.dirname(assembly))

  for (;;) {
    const nfproj = readdirSync(directory).find(f => f.endsWith('.nfproj'))
    if (nfproj) {
      return {
        assembly,
        directory,
        name: nfproj.slice(0, -'.nfproj'.length)
      }
    }

    const parent = path.normalize(nodePath.dirname(directory))
    if (parent === directory) {
      throw new Error(`No .nfproj found above ${assembly}`)
    }
    directory = parent
  }
}

/**
 * Returns the restored nanoFramework.TestFramework package directory for the
 * version in the project's packages.config, searching upward for `packages/`.
 */
export function findTestFrameworkPackage(project: TestProject): string {
  const packagesConfig = path.join(project.directory, 'packages.config')
  if (!existsSync(packagesConfig)) {
    throw new Error(`packages.config not found for ${project.name}`)
  }

  const version = getPackageVersion(
    readFileSync(packagesConfig, 'utf8'),
    TestFrameworkId
  )
  if (!version) {
    throw new Error(`${TestFrameworkId} is not referenced in ${packagesConfig}`)
  }

  const packageName = `${TestFrameworkId}.${version}`
  let directory = project.directory

  for (;;) {
    const candidate = path.join(directory, 'packages', packageName)
    if (existsSync(candidate)) {
      return candidate
    }

    const parent = path.normalize(nodePath.dirname(directory))
    if (parent === directory) {
      throw new Error(
        `${packageName} is not restored (no packages/${packageName} above ${project.directory})`
      )
    }
    directory = parent
  }
}

export function getPackageVersion(
  packagesConfig: string,
  id: string
): string | undefined {
  for (const match of packagesConfig.matchAll(/<package\s[^>]*>/g)) {
    const element = match[0]
    const packageId = /\bid="([^"]+)"/.exec(element)?.[1]
    if (packageId?.toLowerCase() === id.toLowerCase()) {
      return /\bversion="([^"]+)"/.exec(element)?.[1]
    }
  }
  return undefined
}

/**
 * `run-settings` if set, else the project's nano.runsettings, else the
 * template shipped in the TestFramework package.
 */
export function resolveRunSettings(
  runSettings: string,
  workingDirectory: string,
  project: TestProject,
  packageDirectory: string
): string {
  if (runSettings) {
    const explicit = path.isAbsolute(runSettings)
      ? path.normalize(runSettings)
      : path.join(workingDirectory, runSettings)
    if (!existsSync(explicit)) {
      throw new Error(`Run settings not found: ${explicit}`)
    }
    return explicit
  }

  const own = path.join(project.directory, 'nano.runsettings')
  if (existsSync(own)) {
    return own
  }

  const template = path.join(packageDirectory, 'content', 'nano.runsettings')
  if (existsSync(template)) {
    return template
  }

  throw new Error(
    `No nano.runsettings for ${project.name} and none in ${packageDirectory}/content`
  )
}

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { dirname, join } from 'path'

/**
 * Creates a temporary directory tree from `files` (relative path → content).
 */
export function createFixture(files: Record<string, string>): {
  root: string
  dispose: () => void
} {
  const root = mkdtempSync(join(tmpdir(), 'vstest-'))
  for (const [file, content] of Object.entries(files)) {
    const target = join(root, file)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  return { root, dispose: () => rmSync(root, { recursive: true, force: true }) }
}

export function packagesConfig(testFrameworkVersion?: string): string {
  const testFramework = testFrameworkVersion
    ? `  <package id="nanoFramework.TestFramework" version="${testFrameworkVersion}" targetFramework="netnano1.0" developmentDependency="true" />\n`
    : ''
  return `<?xml version="1.0" encoding="utf-8"?>\n<packages>\n  <package id="nanoFramework.CoreLibrary" version="1.17.11" targetFramework="netnano1.0" />\n${testFramework}</packages>\n`
}

export function testFrameworkPackage(
  version: string,
  withTemplate = true
): Record<string, string> {
  const files: Record<string, string> = {
    [`packages/nanoFramework.TestFramework.${version}/lib/net48/nanoFramework.TestAdapter.dll`]:
      ''
  }
  if (withTemplate) {
    files[
      `packages/nanoFramework.TestFramework.${version}/content/nano.runsettings`
    ] = '<RunSettings />'
  }
  return files
}

export function testProject(
  name: string,
  testFrameworkVersion: string | undefined,
  withRunSettings: boolean
): Record<string, string> {
  const files: Record<string, string> = {
    [`${name}/${name}.nfproj`]: '<Project />',
    [`${name}/packages.config`]: packagesConfig(testFrameworkVersion),
    [`${name}/bin/Release/NFUnitTest.dll`]: ''
  }
  if (withRunSettings) {
    files[`${name}/nano.runsettings`] = '<RunSettings />'
  }
  return files
}

import * as sut from '../src/find'
import * as path from '../src/path'

import * as posix from 'path/posix'
import * as win32 from 'path/win32'

const solutionFolder = path.join(__dirname, './__solution__')
const packageFolder = path.join(
  solutionFolder,
  'packages/nanoFramework.TestFramework.3.0.68'
)
const testAdapter = path.join(
  packageFolder,
  'lib/net48/nanoFramework.TestAdapter.dll'
)

describe('find()', () => {
  it('finds directory', async () => {
    const results = await sut.find(
      path.join(solutionFolder, '**\\nanoFramework.TestFramework.*\\')
    )

    expect(results.directories.length).toBeGreaterThan(0)
    expect(results.directories[0]).toBe(packageFolder)
    expect(results.files.length).toBeGreaterThan(0)
    expect(results.searchPaths.length).toBe(1)
    expect(results.searchPaths[0]).toBe(solutionFolder)
  })

  it('finds file', async () => {
    const results = await sut.find(
      path.join(
        solutionFolder,
        '**\\packages\\**\\nanoFramework.TestAdapter.dll'
      )
    )

    expect(results.directories.length).toBe(0)
    expect(results.files.length).toBe(1)
    expect(results.files[0]).toBe(testAdapter)
    expect(results.searchPaths.length).toBe(1)
    expect(results.searchPaths[0]).toBe(solutionFolder)
  })
})

describe('getSearchPath()', () => {
  it.each([
    ['/', ['/foo/', '/bar/'], posix],
    ['~', ['~/foo/', '~/bar/'], posix],
    ['~/foo', ['~/foo/bar/*', '~/foo/voo/two/*', '~/foo/mo/'], posix],
    ['D:/temp', ['D:\\temp\\sub1', 'D:\\temp\\sub2'], win32]
  ])(`returns common path '%s'`, (expected, searchPaths) => {
    const result = sut.getSearchPath(searchPaths)

    expect(result).toBe(expected)
  })
})

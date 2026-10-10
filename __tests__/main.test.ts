import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as core from '@actions/core'
import * as artifact from '../src/artifact.js'
import * as find from '../src/find.js'
import * as inputs from '../src/inputs.js'
import * as plan from '../src/plan.js'
import { run } from '../src/main.js'
import * as vstest from '../src/vstest.js'
import type { Inputs } from '../src/inputs.js'
import type { TestGroup } from '../src/plan.js'

vi.mock('@actions/core')
vi.mock('@actions/io')
vi.mock('../src/artifact.js')
vi.mock('../src/find.js')
vi.mock('../src/inputs.js')
vi.mock('../src/plan.js')
vi.mock('../src/vstest.js')

const defaults: Inputs = {
  artifactName: 'vstest-results',
  artifactRetentionDays: 0,
  ifNoTestsFound: 'error',
  otherConsoleOptions: [],
  resultsDirectory: '/results',
  runSettings: '',
  testAssemblies: ['**/bin/Release/NFUnitTest.dll'],
  workingDirectory: '.'
}

const groups: TestGroup[] = [
  { adapterDirectory: 'a', assemblies: ['x'], name: '1-A', runSettings: 's1' },
  { adapterDirectory: 'a', assemblies: ['y'], name: '2-B', runSettings: 's2' }
]

const platform = process.platform

function setPlatform(value: string): void {
  Object.defineProperty(process, 'platform', { value })
}

describe('run()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setPlatform('win32')
    vi.mocked(inputs.getActionInputs).mockReturnValue({ ...defaults })
    vi.mocked(find.findFiles).mockResolvedValue(['x', 'y'])
    vi.mocked(plan.planTestGroups).mockReturnValue(groups)
    vi.mocked(vstest.getVsTestPath).mockResolvedValue('vstest.console.exe')
    vi.mocked(vstest.runTestGroup).mockImplementation(async (_p, group) => ({
      exitCode: 0,
      group,
      hasResults: true
    }))
    vi.mocked(artifact.uploadResults).mockResolvedValue(7)
  })

  afterEach(() => setPlatform(platform))

  it('runs every group and uploads the results', async () => {
    await run()

    expect(vstest.runTestGroup).toHaveBeenCalledTimes(2)
    expect(artifact.uploadResults).toHaveBeenCalledWith(
      'vstest-results',
      '/results',
      0
    )
    expect(core.setOutput).toHaveBeenCalledWith('results-directory', '/results')
    expect(core.setOutput).toHaveBeenCalledWith('artifact-id', 7)
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('fails on non-Windows runners', async () => {
    setPlatform('linux')

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('requires a Windows runner')
    )
    expect(find.findFiles).not.toHaveBeenCalled()
  })

  it('runs remaining groups after a failure and reports each one', async () => {
    vi.mocked(vstest.runTestGroup)
      .mockResolvedValueOnce({
        exitCode: 1,
        group: groups[0],
        hasResults: true
      })
      .mockResolvedValueOnce({
        exitCode: 1,
        group: groups[1],
        hasResults: false
      })

    await run()

    expect(vstest.runTestGroup).toHaveBeenCalledTimes(2)
    expect(artifact.uploadResults).toHaveBeenCalled()
    const message = vi.mocked(core.setFailed).mock.calls[0][0] as string
    expect(message).toContain('2 of 2 test run(s) failed')
    expect(message).toContain('1-A: tests failed')
    expect(message).toContain('2-B: vstest failed without writing results')
  })

  it('fails before running anything when planning fails', async () => {
    vi.mocked(plan.planTestGroups).mockImplementation(() => {
      throw new Error('Test adapter not found')
    })

    await run()

    expect(vstest.runTestGroup).not.toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalledWith('Test adapter not found')
  })

  it('downloads vstest when Visual Studio has none', async () => {
    vi.mocked(vstest.getVsTestPath).mockResolvedValue('')
    vi.mocked(vstest.downloadTestTools).mockResolvedValue('downloaded.exe')

    await run()

    expect(vi.mocked(vstest.runTestGroup).mock.calls[0][0]).toBe(
      'downloaded.exe'
    )
  })

  it('skips the upload when artifact-name is empty', async () => {
    vi.mocked(inputs.getActionInputs).mockReturnValue({
      ...defaults,
      artifactName: ''
    })

    await run()

    expect(artifact.uploadResults).not.toHaveBeenCalled()
  })

  it.each([
    ['error', true],
    ['warn', false],
    ['ignore', false]
  ] as const)(
    'handles no test assemblies with if-no-tests-found %s',
    async (mode, fails) => {
      vi.mocked(inputs.getActionInputs).mockReturnValue({
        ...defaults,
        ifNoTestsFound: mode
      })
      vi.mocked(find.findFiles).mockResolvedValue([])

      await run()

      expect(vi.mocked(core.setFailed).mock.calls.length > 0).toBe(fails)
      expect(vi.mocked(core.warning).mock.calls.length > 0).toBe(
        mode === 'warn'
      )
      expect(vstest.runTestGroup).not.toHaveBeenCalled()
    }
  )
})

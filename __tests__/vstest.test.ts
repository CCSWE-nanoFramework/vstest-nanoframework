import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'
import { join } from 'path'
import * as sut from '../src/vstest.js'
import type { TestGroup } from '../src/plan.js'
import { createFixture } from './helpers/fixture.js'

vi.mock('@actions/core')
vi.mock('@actions/exec')
vi.mock('@actions/tool-cache')

const group: TestGroup = {
  adapterDirectory:
    '/repo/packages/nanoFramework.TestFramework.3.0.80/lib/net48',
  assemblies: ['/repo/A/bin/Release/NFUnitTest.dll'],
  name: '1-A',
  runSettings: '/repo/A/nano.runsettings'
}

let dispose: () => void = () => {}

describe('getTestArguments()', () => {
  it('puts the generated arguments before other options', () => {
    const args = sut.getTestArguments(group, '/results/1-A', ['/Blame'])

    expect(args).toEqual([
      '/repo/A/bin/Release/NFUnitTest.dll',
      '/TestAdapterPath:/repo/packages/nanoFramework.TestFramework.3.0.80/lib/net48',
      '/Settings:/repo/A/nano.runsettings',
      '/Logger:trx;LogFileName=1-A.trx',
      '/ResultsDirectory:/results/1-A',
      '/Blame'
    ])
  })
})

describe('runTestGroup()', () => {
  afterEach(() => dispose())

  it('reports the exit code and a written TRX', async () => {
    const fixture = createFixture({ '1-A/1-A.trx': '<TestRun />' })
    dispose = fixture.dispose
    vi.mocked(exec.exec).mockResolvedValue(1)

    const result = await sut.runTestGroup(
      'vstest.console.exe',
      group,
      fixture.root,
      []
    )

    expect(result).toEqual({ exitCode: 1, group, hasResults: true })
    expect(vi.mocked(exec.exec).mock.calls[0][0]).toBe('"vstest.console.exe"')
    expect(vi.mocked(exec.exec).mock.calls[0][2]).toEqual({
      ignoreReturnCode: true
    })
  })

  it('reports a crash when no TRX is written', async () => {
    const fixture = createFixture({})
    dispose = fixture.dispose
    vi.mocked(exec.exec).mockRejectedValue(new Error('spawn failed'))

    const result = await sut.runTestGroup(
      'vstest.console.exe',
      group,
      fixture.root,
      []
    )

    expect(result).toEqual({ exitCode: -1, group, hasResults: false })
  })
})

describe('getVsTestPath()', () => {
  const programFiles = process.env['ProgramFiles(x86)']

  afterEach(() => {
    process.env['ProgramFiles(x86)'] = programFiles
    dispose()
  })

  function vsFixture(withVsTest: boolean): string {
    const files: Record<string, string> = {
      'Microsoft Visual Studio/Installer/vswhere.exe': ''
    }
    if (withVsTest) {
      files[
        'VS/Common7/IDE/CommonExtensions/Microsoft/TestWindow/vstest.console.exe'
      ] = ''
    }
    const fixture = createFixture(files)
    dispose = fixture.dispose
    process.env['ProgramFiles(x86)'] = fixture.root
    return fixture.root
  }

  it('returns vstest.console.exe from the newest install', async () => {
    const root = vsFixture(true)
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      exitCode: 0,
      stdout: `${join(root, 'VS')}\r\n`,
      stderr: ''
    })

    expect(await sut.getVsTestPath()).toMatch(
      /TestWindow\/vstest\.console\.exe$/
    )
    expect(vi.mocked(exec.getExecOutput).mock.calls[0][1]).toContain('-latest')
  })

  it('returns empty when vswhere finds nothing', async () => {
    vsFixture(false)
    vi.mocked(exec.getExecOutput).mockResolvedValue({
      exitCode: 0,
      stdout: '',
      stderr: ''
    })

    expect(await sut.getVsTestPath()).toBe('')
  })

  it('returns empty without vswhere', async () => {
    process.env['ProgramFiles(x86)'] = '/nonexistent'

    expect(await sut.getVsTestPath()).toBe('')
  })
})

describe('downloadTestTools()', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => dispose())

  function testPlatform(): string {
    const fixture = createFixture({
      'tools/net462/Common7/IDE/Extensions/TestPlatform/vstest.console.exe': ''
    })
    dispose = fixture.dispose
    return fixture.root
  }

  it('reuses the tool cache', async () => {
    vi.mocked(tc.find).mockReturnValue(testPlatform())

    expect(await sut.downloadTestTools()).toMatch(/vstest\.console\.exe$/)
    expect(tc.downloadTool).not.toHaveBeenCalled()
  })

  it('downloads and caches when missing', async () => {
    const root = testPlatform()
    vi.mocked(tc.find).mockReturnValue('')
    vi.mocked(tc.downloadTool).mockResolvedValue('/tmp/tp.zip')
    vi.mocked(tc.extractZip).mockResolvedValue('/tmp/tp')
    vi.mocked(tc.cacheDir).mockResolvedValue(root)

    expect(await sut.downloadTestTools()).toMatch(/vstest\.console\.exe$/)
    expect(vi.mocked(tc.downloadTool).mock.calls[0][0]).toContain(
      sut.TestPlatformVersion
    )
  })

  it('throws when the package layout changed', async () => {
    vi.mocked(tc.find).mockReturnValue('/nonexistent')

    await expect(sut.downloadTestTools()).rejects.toThrow(/not found/)
  })
})

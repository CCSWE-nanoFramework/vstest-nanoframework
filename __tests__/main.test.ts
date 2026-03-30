import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as core from '@actions/core'
import * as artifact from '../src/artifact'
import * as inputs from '../src/inputs'
import * as sut from '../src/main'
import * as vstest from '../src/vstest'
import { Inputs } from '../src/inputs'

vi.mock('@actions/core', () => ({
  debug: vi.fn(),
  info: vi.fn(),
  setFailed: vi.fn(),
  warning: vi.fn()
}))

let downloadTestToolsMock: ReturnType<typeof vi.spyOn>
let getActionInputsMock: ReturnType<typeof vi.spyOn>
let getRunSettingsMock: ReturnType<typeof vi.spyOn>
let getTestAdaptersMock: ReturnType<typeof vi.spyOn>
let getTestArgumentsMock: ReturnType<typeof vi.spyOn>
let getTestAssembliesMock: ReturnType<typeof vi.spyOn>
let getVsTestPathMock: ReturnType<typeof vi.spyOn>
let setFailedMock: ReturnType<typeof vi.spyOn>
let runTestsMock: ReturnType<typeof vi.spyOn>
let uploadArtifactMock: ReturnType<typeof vi.spyOn>
let warningMock: ReturnType<typeof vi.spyOn>

const inputsMock: Inputs = {
  enableCodeCoverage: false,
  platform: 'platform',
  runInIsolation: false,
  runInParallel: false,
  solutionFolder: 'solutionFolder',
  testAdapter: 'testAdapter',
  testAssemblies: 'testAssemblies',
  vsTestArguments: 'vsTestArguments'
}

describe('run()', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    downloadTestToolsMock = vi
      .spyOn(vstest, 'downloadTestTools')
      .mockResolvedValue('vstest.console.exe')
    getActionInputsMock = vi
      .spyOn(inputs, 'getActionInputs')
      .mockReturnValue(inputsMock)
    getRunSettingsMock = vi
      .spyOn(vstest, 'getRunSettings')
      .mockResolvedValue(['runSettings1'])
    getTestAdaptersMock = vi
      .spyOn(vstest, 'getTestAdapters')
      .mockResolvedValue(['testAdapter1'])
    getTestArgumentsMock = vi
      .spyOn(vstest, 'getTestArguments')
      .mockReturnValue('')
    getTestAssembliesMock = vi
      .spyOn(vstest, 'getTestAssemblies')
      .mockResolvedValue(['assembly1'])
    getVsTestPathMock = vi
      .spyOn(vstest, 'getVsTestPath')
      .mockResolvedValue('')
    setFailedMock = vi.spyOn(core, 'setFailed').mockImplementation(() => {})
    runTestsMock = vi.spyOn(vstest, 'runTests').mockResolvedValue(undefined)
    uploadArtifactMock = vi
      .spyOn(artifact, 'uploadArtifact')
      .mockResolvedValue(undefined)
    warningMock = vi.spyOn(core, 'warning').mockImplementation(() => {})
  })

  it('fails if error uploading results', async () => {
    uploadArtifactMock.mockImplementation(() => {
      throw new Error()
    })

    await sut.run()

    expect(uploadArtifactMock).toThrow()
    expect(uploadArtifactMock).toHaveBeenCalled()

    expect(setFailedMock).toHaveBeenCalled()
  })

  it('fails if no no runsettings are found', async () => {
    getRunSettingsMock.mockResolvedValue([])
    inputsMock.runSettings = undefined

    await sut.run()

    expect(getRunSettingsMock).toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenCalled()
  })

  it('fails if no test adapters are found', async () => {
    getTestAdaptersMock.mockResolvedValue([])

    await sut.run()

    expect(getTestAdaptersMock).toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenCalled()
  })

  it('fails if no test assemblies are found', async () => {
    getTestAssembliesMock.mockResolvedValue([])

    await sut.run()

    expect(getTestAssembliesMock).toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenCalled()
  })

  it('runs tests and uploads results', async () => {
    await sut.run()

    expect(setFailedMock).not.toHaveBeenCalled()
  })

  it('warns if multiple runsettings are found', async () => {
    getRunSettingsMock.mockResolvedValue(['runSettings1', 'runSettings2'])
    inputsMock.runSettings = undefined

    await sut.run()

    expect(getRunSettingsMock).toHaveBeenCalled()

    expect(setFailedMock).not.toHaveBeenCalled()
    expect(warningMock).toHaveBeenCalled()
  })

  it('warns if multiple test adapters are found', async () => {
    getTestAdaptersMock.mockResolvedValue(['testAdapter1', 'testAdapter2'])

    await sut.run()

    expect(getTestAdaptersMock).toHaveBeenCalled()

    expect(setFailedMock).not.toHaveBeenCalled()
    expect(warningMock).toHaveBeenCalled()
  })
})

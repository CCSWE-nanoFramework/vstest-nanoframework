import { vi, describe, it, expect, beforeEach, type MockInstance } from 'vitest'
import * as core from '@actions/core'
import * as artifact from '../src/artifact.js'
import * as inputs from '../src/inputs.js'
import * as sut from '../src/main.js'
import * as vstest from '../src/vstest.js'
import { Inputs } from '../src/inputs.js'

vi.mock('@actions/core', () => ({
  debug: vi.fn(),
  info: vi.fn(),
  setFailed: vi.fn(),
  warning: vi.fn()
}))

let getRunSettingsMock: MockInstance<typeof vstest.getRunSettings>
let getTestAdaptersMock: MockInstance<typeof vstest.getTestAdapters>
let getTestAssembliesMock: MockInstance<typeof vstest.getTestAssemblies>
let setFailedMock: MockInstance<typeof core.setFailed>
let uploadArtifactMock: MockInstance<typeof artifact.uploadArtifact>
let warningMock: MockInstance<typeof core.warning>

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

    vi.spyOn(vstest, 'downloadTestTools').mockResolvedValue(
      'vstest.console.exe'
    )
    vi.spyOn(inputs, 'getActionInputs').mockReturnValue(inputsMock)
    getRunSettingsMock = vi
      .spyOn(vstest, 'getRunSettings')
      .mockResolvedValue(['runSettings1'])
    getTestAdaptersMock = vi
      .spyOn(vstest, 'getTestAdapters')
      .mockResolvedValue(['testAdapter1'])
    vi.spyOn(vstest, 'getTestArguments').mockReturnValue('')
    getTestAssembliesMock = vi
      .spyOn(vstest, 'getTestAssemblies')
      .mockResolvedValue(['assembly1'])
    vi.spyOn(vstest, 'getVsTestPath').mockResolvedValue('')
    setFailedMock = vi.spyOn(core, 'setFailed').mockImplementation(() => {})
    vi.spyOn(vstest, 'runTests').mockResolvedValue(undefined)
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

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as core from '@actions/core'
import * as artifact from '../src/artifact'
import * as inputs from '../src/inputs'
import * as sut from '../src/main'
import * as vstest from '../src/vstest'
import { Inputs } from '../src/inputs'

let downloadTestToolsMock: jest.SpiedFunction<typeof vstest.downloadTestTools>
let getActionInputsMock: jest.SpiedFunction<typeof inputs.getActionInputs>
let getRunSettingsMock: jest.SpiedFunction<typeof vstest.getRunSettings>
let getTestAdaptersMock: jest.SpiedFunction<typeof vstest.getTestAdapters>
let getTestArgumentsMock: jest.SpiedFunction<typeof vstest.getTestArguments>
let getTestAssembliesMock: jest.SpiedFunction<typeof vstest.getTestAssemblies>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let runTestsMock: jest.SpiedFunction<typeof vstest.runTests>
let uploadArtifactMock: jest.SpiedFunction<typeof artifact.uploadArtifact>
let warningMock: jest.SpiedFunction<typeof core.warning>

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
    jest.clearAllMocks()

    downloadTestToolsMock = jest
      .spyOn(vstest, 'downloadTestTools')
      .mockImplementation()
    getActionInputsMock = jest
      .spyOn(inputs, 'getActionInputs')
      .mockImplementation()
    getRunSettingsMock = jest
      .spyOn(vstest, 'getRunSettings')
      .mockImplementation()
    getTestAdaptersMock = jest
      .spyOn(vstest, 'getTestAdapters')
      .mockImplementation()
    getTestArgumentsMock = jest
      .spyOn(vstest, 'getTestArguments')
      .mockImplementation()
    getTestAssembliesMock = jest
      .spyOn(vstest, 'getTestAssemblies')
      .mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    runTestsMock = jest.spyOn(vstest, 'runTests').mockImplementation()
    uploadArtifactMock = jest
      .spyOn(artifact, 'uploadArtifact')
      .mockImplementation()
    warningMock = jest.spyOn(core, 'warning').mockImplementation()

    getActionInputsMock.mockReturnValue(inputsMock)
    getRunSettingsMock.mockReturnValue(Promise.resolve(['runSettings1']))
    getTestAdaptersMock.mockReturnValue(Promise.resolve(['testAdapter1']))
    getTestAssembliesMock.mockReturnValue(Promise.resolve(['assembly1']))
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
    getRunSettingsMock.mockReturnValue(Promise.resolve([]))
    inputsMock.runSettings = undefined

    await sut.run()

    expect(getRunSettingsMock).toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenCalled()
  })

  it('fails if no test adapters are found', async () => {
    getTestAdaptersMock.mockReturnValue(Promise.resolve([]))

    await sut.run()

    expect(getTestAdaptersMock).toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenCalled()
  })

  it('fails if no test assemblies are found', async () => {
    getTestAssembliesMock.mockReturnValue(Promise.resolve([]))

    await sut.run()

    expect(getTestAssembliesMock).toHaveBeenCalled()
    expect(setFailedMock).toHaveBeenCalled()
  })

  it('runs tests and uploads results', async () => {
    await sut.run()

    expect(setFailedMock).not.toHaveBeenCalled()
  })

  it('warns if multiple runsettings are found', async () => {
    getRunSettingsMock.mockReturnValue(
      Promise.resolve(['runSettings1', 'runSettings2'])
    )
    inputsMock.runSettings = undefined

    await sut.run()

    expect(getRunSettingsMock).toHaveBeenCalled()

    expect(setFailedMock).not.toHaveBeenCalled()
    expect(warningMock).toHaveBeenCalled()
  })

  it('warns if multiple test adapters are found', async () => {
    getTestAdaptersMock.mockReturnValue(
      Promise.resolve(['testAdapter1', 'testAdapter2'])
    )

    await sut.run()

    expect(getTestAdaptersMock).toHaveBeenCalled()

    expect(setFailedMock).not.toHaveBeenCalled()
    expect(warningMock).toHaveBeenCalled()
  })
})

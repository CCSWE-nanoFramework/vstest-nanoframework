import * as core from '@actions/core'
import * as artifact from '../src/artifact'
import * as sut from '../src/main'
import * as vstest from '../src/vstest'

let downloadTestToolsMock: jest.SpiedFunction<typeof vstest.downloadTestTools>
let getRunSettingsMock: jest.SpiedFunction<typeof vstest.getRunSettings>
let getTestAdaptersMock: jest.SpiedFunction<typeof vstest.getTestAdapters>
let getTestArgumentsMock: jest.SpiedFunction<typeof vstest.getTestArguments>
let getTestAssembliesMock: jest.SpiedFunction<typeof vstest.getTestAssemblies>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let runTestsMock: jest.SpiedFunction<typeof vstest.runTests>
let uploadArtifactMock: jest.SpiedFunction<typeof artifact.uploadArtifact>
let warningMock: jest.SpiedFunction<typeof core.warning>

describe('run()', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    downloadTestToolsMock = jest
      .spyOn(vstest, 'downloadTestTools')
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
  })

  it('fails if error uploading results', async () => {
    getRunSettingsMock.mockReturnValue(Promise.resolve(['runSettings1']))
    getTestAdaptersMock.mockReturnValue(Promise.resolve(['testAdapter1']))
    getTestAssembliesMock.mockReturnValue(Promise.resolve(['assembly1']))
    uploadArtifactMock.mockImplementation(() => {
      throw new Error()
    })

    await sut.run()

    expect(getTestAssembliesMock).toHaveBeenCalled()
    expect(getTestAdaptersMock).toHaveBeenCalled()
    expect(getRunSettingsMock).toHaveBeenCalled()
    expect(downloadTestToolsMock).toHaveBeenCalled()
    expect(getTestArgumentsMock).toHaveBeenCalled()
    expect(runTestsMock).toHaveBeenCalled()
    expect(uploadArtifactMock).toHaveBeenCalled()

    expect(setFailedMock).toHaveBeenCalled()
  })

  it('fails if no no runsettings are found', async () => {
    getRunSettingsMock.mockReturnValue(Promise.resolve([]))
    getTestAdaptersMock.mockReturnValue(Promise.resolve(['testAdapter1']))
    getTestAssembliesMock.mockReturnValue(Promise.resolve(['assembly1']))

    await sut.run()

    expect(getTestAssembliesMock).toHaveBeenCalled()
    expect(getTestAdaptersMock).toHaveBeenCalled()
    expect(getRunSettingsMock).toHaveBeenCalled()
    expect(downloadTestToolsMock).not.toHaveBeenCalled()
    expect(getTestArgumentsMock).not.toHaveBeenCalled()
    expect(runTestsMock).not.toHaveBeenCalled()
    expect(uploadArtifactMock).not.toHaveBeenCalled()

    expect(setFailedMock).toHaveBeenCalled()
  })

  it('fails if no test adapters are found', async () => {
    getTestAdaptersMock.mockReturnValue(Promise.resolve([]))
    getTestAssembliesMock.mockReturnValue(Promise.resolve(['assembly1']))

    await sut.run()

    expect(setFailedMock).toHaveBeenCalled()

    expect(getTestAssembliesMock).toHaveBeenCalled()
    expect(getTestAdaptersMock).toHaveBeenCalled()
    expect(getRunSettingsMock).not.toHaveBeenCalled()
    expect(downloadTestToolsMock).not.toHaveBeenCalled()
    expect(getTestArgumentsMock).not.toHaveBeenCalled()
    expect(runTestsMock).not.toHaveBeenCalled()
    expect(uploadArtifactMock).not.toHaveBeenCalled()
  })

  it('fails if no test assemblies are found', async () => {
    getTestAssembliesMock.mockReturnValue(Promise.resolve([]))

    await sut.run()

    expect(setFailedMock).toHaveBeenCalled()

    expect(getTestAssembliesMock).toHaveBeenCalled()
    expect(getTestAdaptersMock).not.toHaveBeenCalled()
    expect(getRunSettingsMock).not.toHaveBeenCalled()
    expect(downloadTestToolsMock).not.toHaveBeenCalled()
    expect(getTestArgumentsMock).not.toHaveBeenCalled()
    expect(runTestsMock).not.toHaveBeenCalled()
    expect(uploadArtifactMock).not.toHaveBeenCalled()
  })

  it('runs tests and uploads results', async () => {
    getRunSettingsMock.mockReturnValue(Promise.resolve(['runSettings1']))
    getTestAdaptersMock.mockReturnValue(Promise.resolve(['testAdapter1']))
    getTestAssembliesMock.mockReturnValue(Promise.resolve(['assembly1']))

    await sut.run()

    expect(getTestAssembliesMock).toHaveBeenCalled()
    expect(getTestAdaptersMock).toHaveBeenCalled()
    expect(getRunSettingsMock).toHaveBeenCalled()
    expect(downloadTestToolsMock).toHaveBeenCalled()
    expect(getTestArgumentsMock).toHaveBeenCalled()
    expect(runTestsMock).toHaveBeenCalled()
    expect(uploadArtifactMock).toHaveBeenCalled()

    expect(setFailedMock).not.toHaveBeenCalled()
  })

  it('warns if multiple runsettings are found', async () => {
    getRunSettingsMock.mockReturnValue(
      Promise.resolve(['runSettings1', 'runSettings2'])
    )
    getTestAdaptersMock.mockReturnValue(Promise.resolve(['testAdapter1']))
    getTestAssembliesMock.mockReturnValue(Promise.resolve(['assembly1']))

    await sut.run()

    expect(getTestAssembliesMock).toHaveBeenCalled()
    expect(getTestAdaptersMock).toHaveBeenCalled()
    expect(getRunSettingsMock).toHaveBeenCalled()
    expect(downloadTestToolsMock).toHaveBeenCalled()
    expect(getTestArgumentsMock).toHaveBeenCalled()
    expect(runTestsMock).toHaveBeenCalled()
    expect(uploadArtifactMock).toHaveBeenCalled()

    expect(setFailedMock).not.toHaveBeenCalled()
    expect(warningMock).toHaveBeenCalled()
  })

  it('warns if multiple test adapters are found', async () => {
    getRunSettingsMock.mockReturnValue(Promise.resolve(['runSettings1']))
    getTestAdaptersMock.mockReturnValue(
      Promise.resolve(['testAdapter1', 'testAdapter2'])
    )
    getTestAssembliesMock.mockReturnValue(Promise.resolve(['assembly1']))

    await sut.run()

    expect(getTestAssembliesMock).toHaveBeenCalled()
    expect(getTestAdaptersMock).toHaveBeenCalled()
    expect(getRunSettingsMock).toHaveBeenCalled()
    expect(downloadTestToolsMock).toHaveBeenCalled()
    expect(getTestArgumentsMock).toHaveBeenCalled()
    expect(runTestsMock).toHaveBeenCalled()
    expect(uploadArtifactMock).toHaveBeenCalled()

    expect(setFailedMock).not.toHaveBeenCalled()
    expect(warningMock).toHaveBeenCalled()
  })
})

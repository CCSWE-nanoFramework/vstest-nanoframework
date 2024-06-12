import * as exec from '@actions/exec'
import * as sut from '../src/powershell'

let execMock: jest.SpiedFunction<typeof exec.exec>

describe('expandArchive()', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    execMock = jest.spyOn(exec, 'exec').mockImplementation()
  })

  it('executes powershell', async () => {
    const path = 'anArchive.zip'
    const destinationPath = 'aFolder'

    await sut.expandArchive(path, destinationPath)

    expect(execMock).toHaveBeenCalledWith(
      `powershell Expand-Archive -Path ${path} -DestinationPath ${destinationPath}`
    )
  })
})

describe('invokeWebRequest()', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    execMock = jest.spyOn(exec, 'exec').mockImplementation()
  })

  it('executes powershell', async () => {
    const uri = 'http://test.com/file.txt'
    const outFile = 'outFile.txt'

    await sut.invokeWebRequest(uri, outFile)

    expect(execMock).toHaveBeenCalledWith(
      `powershell Invoke-WebRequest -Uri "${uri}" -OutFile ${outFile}`
    )
  })
})

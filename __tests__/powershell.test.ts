import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as exec from '@actions/exec'
import * as sut from '../src/powershell.js'

vi.mock('@actions/exec', () => ({
  exec: vi.fn().mockResolvedValue(undefined)
}))

let execMock: ReturnType<typeof vi.fn>

describe('expandArchive()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    execMock = vi.mocked(exec.exec)
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
    vi.clearAllMocks()
    execMock = vi.mocked(exec.exec)
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

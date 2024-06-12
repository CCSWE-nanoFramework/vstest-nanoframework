import { DefaultArtifactClient } from '@actions/artifact'
import * as sut from '../src/artifact'
import * as find from '../src/find'

let findMock: jest.SpiedFunction<typeof find.find>

jest.mock('@actions/artifact', () => {
  return {
    DefaultArtifactClient: jest.fn().mockImplementation(() => {
      return {
        uploadArtifact: () => {
          return { id: 'id', size: 420 }
        }
      }
    })
  }
})

describe('uploadArtifact()', () => {
  const MockedArtifactClient = jest.mocked(DefaultArtifactClient)

  beforeEach(() => {
    jest.clearAllMocks()

    findMock = jest.spyOn(find, 'find').mockImplementation()

    MockedArtifactClient.mockClear()
  })

  it('throws if files not found', async () => {
    findMock.mockImplementation(async () => {
      return {
        directories: [],
        files: [],
        searchPaths: []
      }
    })

    const name = 'artifact_name'
    const path = 'artifact_path'

    await expect(sut.uploadArtifact(name, path)).rejects.toThrow()
  })

  it('uploads artifact', async () => {
    findMock.mockImplementation(async () => {
      return {
        directories: [],
        files: ['file1', 'file2'],
        searchPaths: ['searchPath1']
      }
    })

    const name = 'artifact_name'
    const path = 'artifact_path'

    await sut.uploadArtifact(name, path, 90)

    expect(MockedArtifactClient).toHaveBeenCalledTimes(1)
  })
})

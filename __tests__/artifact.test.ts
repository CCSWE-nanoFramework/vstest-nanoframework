import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as core from '@actions/core'
import { DefaultArtifactClient } from '@actions/artifact'
import { uploadResults } from '../src/artifact.js'
import { createFixture } from './helpers/fixture.js'

vi.mock('@actions/core')

const uploadArtifact = vi.fn()

vi.mock('@actions/artifact', () => ({
  DefaultArtifactClient: vi.fn().mockImplementation(function () {
    return { uploadArtifact }
  })
}))

let dispose: () => void = () => {}

describe('uploadResults()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    uploadArtifact.mockResolvedValue({ id: 42, size: 10 })
  })

  afterEach(() => dispose())

  it('uploads every file and returns the id', async () => {
    const fixture = createFixture({ '1-A/1-A.trx': 'x', '2-B/2-B.trx': 'y' })
    dispose = fixture.dispose

    expect(await uploadResults('results', fixture.root, 5)).toBe(42)
    expect(uploadArtifact.mock.calls[0][1]).toHaveLength(2)
    expect(uploadArtifact.mock.calls[0][3]).toEqual({ retentionDays: 5 })
    expect(DefaultArtifactClient).toHaveBeenCalled()
  })

  it('warns and skips when there are no results', async () => {
    const fixture = createFixture({})
    dispose = fixture.dispose

    expect(await uploadResults('results', fixture.root, 0)).toBeUndefined()
    expect(uploadArtifact).not.toHaveBeenCalled()
    expect(core.warning).toHaveBeenCalled()
  })

  it('warns instead of failing when the upload fails', async () => {
    const fixture = createFixture({ '1-A/1-A.trx': 'x' })
    dispose = fixture.dispose
    uploadArtifact.mockRejectedValue(new Error('409 Conflict'))

    expect(await uploadResults('results', fixture.root, 0)).toBeUndefined()
    expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('409'))
    expect(core.setFailed).not.toHaveBeenCalled()
  })
})

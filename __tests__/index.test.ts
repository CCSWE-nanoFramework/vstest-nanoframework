/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { vi, describe, it, expect } from 'vitest'

vi.mock('../src/main', () => ({
  run: vi.fn().mockResolvedValue(undefined)
}))

describe('index', () => {
  it('calls run when imported', async () => {
    const { run } = await import('../src/main')
    await import('../src/index')
    expect(run).toHaveBeenCalled()
  })
})

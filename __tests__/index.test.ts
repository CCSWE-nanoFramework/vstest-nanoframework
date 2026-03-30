/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { vi, describe, it, expect } from 'vitest'

vi.mock('../src/main.js', () => ({
  run: vi.fn().mockResolvedValue(undefined)
}))

describe('index', () => {
  it('calls run when imported', async () => {
    const { run } = await import('../src/main.js')
    await import('../src/index.js')
    expect(run).toHaveBeenCalled()
  })
})

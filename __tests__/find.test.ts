import { describe, it, expect, afterEach } from 'vitest'
import { findFiles, resolvePattern } from '../src/find.js'
import { createFixture } from './helpers/fixture.js'

let dispose: () => void = () => {}

describe('findFiles()', () => {
  afterEach(() => dispose())

  it('resolves relative patterns against the working directory', async () => {
    const fixture = createFixture({
      'a/bin/Release/NFUnitTest.dll': '',
      'b/bin/Release/NFUnitTest.dll': '',
      'b/bin/Debug/NFUnitTest.dll': ''
    })
    dispose = fixture.dispose

    const files = await findFiles(
      ['**/bin/Release/NFUnitTest.dll'],
      fixture.root
    )

    expect(files.map(f => f.slice(fixture.root.length))).toEqual([
      '/a/bin/Release/NFUnitTest.dll',
      '/b/bin/Release/NFUnitTest.dll'
    ])
  })

  it('applies negations', async () => {
    const fixture = createFixture({
      'a/bin/Release/NFUnitTest.dll': '',
      'b/bin/Release/NFUnitTest.dll': ''
    })
    dispose = fixture.dispose

    const files = await findFiles(
      ['**/bin/Release/NFUnitTest.dll', '!b/**'],
      fixture.root
    )

    expect(files).toHaveLength(1)
    expect(files[0]).toMatch(/\/a\/bin\/Release\/NFUnitTest\.dll$/)
  })

  it('returns nothing for no patterns', async () => {
    expect(await findFiles(['', '  '], '.')).toEqual([])
  })
})

describe('resolvePattern()', () => {
  it('prefixes relative patterns', () => {
    expect(resolvePattern('**\\bin\\x.dll', 'C:/repo')).toBe(
      'C:/repo/**/bin/x.dll'
    )
  })

  it('keeps absolute patterns', () => {
    expect(resolvePattern('D:\\a\\**\\x.dll', 'C:/repo')).toBe('D:/a/**/x.dll')
    expect(resolvePattern('/opt/**/x.dll', '/repo')).toBe('/opt/**/x.dll')
  })

  it('keeps the negation prefix', () => {
    expect(resolvePattern('!obj/**', '/repo')).toBe('!/repo/obj/**')
  })
})

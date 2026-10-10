import { describe, it, expect, afterEach } from 'vitest'
import { join } from 'path'
import { getPackageVersion, planTestGroups } from '../src/plan.js'
import {
  createFixture,
  testFrameworkPackage,
  testProject
} from './helpers/fixture.js'

let dispose: () => void = () => {}

function assembly(root: string, project: string): string {
  return join(root, project, 'bin', 'Release', 'NFUnitTest.dll')
}

describe('planTestGroups()', () => {
  afterEach(() => dispose())

  it('uses the project nano.runsettings and the packages.config adapter', () => {
    const fixture = createFixture({
      ...testFrameworkPackage('3.0.80'),
      ...testProject('Own', '3.0.80', true)
    })
    dispose = fixture.dispose

    const groups = planTestGroups(
      [assembly(fixture.root, 'Own')],
      '',
      fixture.root
    )

    expect(groups).toHaveLength(1)
    expect(groups[0].name).toBe('1-Own')
    expect(groups[0].runSettings).toMatch(/\/Own\/nano\.runsettings$/)
    expect(groups[0].adapterDirectory).toMatch(
      /\/packages\/nanoFramework\.TestFramework\.3\.0\.80\/lib\/net48$/
    )
  })

  it('falls back to the package template and groups shared settings', () => {
    const fixture = createFixture({
      ...testFrameworkPackage('3.0.80'),
      ...testProject('Own', '3.0.80', true),
      ...testProject('A', '3.0.80', false),
      ...testProject('B', '3.0.80', false)
    })
    dispose = fixture.dispose

    const groups = planTestGroups(
      ['Own', 'A', 'B'].map(p => assembly(fixture.root, p)),
      '',
      fixture.root
    )

    expect(groups.map(g => g.name)).toEqual(['1-Own', '2-A'])
    expect(groups[1].assemblies).toHaveLength(2)
    expect(groups[1].runSettings).toMatch(
      /\/packages\/nanoFramework\.TestFramework\.3\.0\.80\/content\/nano\.runsettings$/
    )
  })

  it('groups by adapter version', () => {
    const fixture = createFixture({
      ...testFrameworkPackage('3.0.80'),
      ...testFrameworkPackage('4.0.0-preview.64'),
      ...testProject('Old', '3.0.80', false),
      ...testProject('New', '4.0.0-preview.64', false)
    })
    dispose = fixture.dispose

    const groups = planTestGroups(
      ['Old', 'New'].map(p => assembly(fixture.root, p)),
      '',
      fixture.root
    )

    expect(groups).toHaveLength(2)
    expect(groups[1].adapterDirectory).toMatch(/4\.0\.0-preview\.64/)
  })

  it('uses run-settings for every project when set', () => {
    const fixture = createFixture({
      ...testFrameworkPackage('3.0.80'),
      ...testProject('Own', '3.0.80', true),
      ...testProject('A', '3.0.80', false),
      'ci.runsettings': '<RunSettings />'
    })
    dispose = fixture.dispose

    const groups = planTestGroups(
      ['Own', 'A'].map(p => assembly(fixture.root, p)),
      'ci.runsettings',
      fixture.root
    )

    expect(groups).toHaveLength(1)
    expect(groups[0].runSettings).toMatch(/\/ci\.runsettings$/)
  })

  it('throws when run-settings does not exist', () => {
    const fixture = createFixture({
      ...testFrameworkPackage('3.0.80'),
      ...testProject('A', '3.0.80', false)
    })
    dispose = fixture.dispose

    expect(() =>
      planTestGroups(
        [assembly(fixture.root, 'A')],
        'missing.runsettings',
        fixture.root
      )
    ).toThrow(/Run settings not found/)
  })

  it('throws when TestFramework is not referenced', () => {
    const fixture = createFixture({ ...testProject('A', undefined, false) })
    dispose = fixture.dispose

    expect(() =>
      planTestGroups([assembly(fixture.root, 'A')], '', fixture.root)
    ).toThrow(/not referenced/)
  })

  it('throws when the package is not restored', () => {
    const fixture = createFixture({ ...testProject('A', '3.0.80', false) })
    dispose = fixture.dispose

    expect(() =>
      planTestGroups([assembly(fixture.root, 'A')], '', fixture.root)
    ).toThrow(/is not restored/)
  })

  it('throws when the adapter is missing', () => {
    const fixture = createFixture({
      'packages/nanoFramework.TestFramework.3.0.80/content/nano.runsettings':
        '',
      ...testProject('A', '3.0.80', false)
    })
    dispose = fixture.dispose

    expect(() =>
      planTestGroups([assembly(fixture.root, 'A')], '', fixture.root)
    ).toThrow(/Test adapter not found/)
  })

  it('throws when no runsettings can be resolved', () => {
    const fixture = createFixture({
      ...testFrameworkPackage('3.0.80', false),
      ...testProject('A', '3.0.80', false)
    })
    dispose = fixture.dispose

    expect(() =>
      planTestGroups([assembly(fixture.root, 'A')], '', fixture.root)
    ).toThrow(/No nano.runsettings/)
  })

  it('throws when no .nfproj is found', () => {
    const fixture = createFixture({ 'bin/Release/NFUnitTest.dll': '' })
    dispose = fixture.dispose

    expect(() =>
      planTestGroups(
        [join(fixture.root, 'bin', 'Release', 'NFUnitTest.dll')],
        '',
        fixture.root
      )
    ).toThrow(/No \.nfproj/)
  })
})

describe('getPackageVersion()', () => {
  it('matches the id case-insensitively, in any attribute order', () => {
    const config =
      '<packages><package version="1.2.3" id="NanoFramework.TestFramework" /></packages>'

    expect(getPackageVersion(config, 'nanoFramework.TestFramework')).toBe(
      '1.2.3'
    )
  })

  it('returns undefined when absent', () => {
    expect(getPackageVersion('<packages />', 'x')).toBeUndefined()
  })
})

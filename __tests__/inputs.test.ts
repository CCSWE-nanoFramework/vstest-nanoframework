import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getActionInputs } from '../src/inputs.js'

const Defaults: Record<string, string> = {
  'test-assemblies': '**/bin/Release/NFUnitTest.dll',
  'working-directory': '.',
  'if-no-tests-found': 'error',
  'artifact-name': 'vstest-results'
}

function setInput(name: string, value: string): void {
  process.env[`INPUT_${name.toUpperCase()}`] = value
}

describe('getActionInputs()', () => {
  beforeEach(() => {
    for (const [name, value] of Object.entries(Defaults)) {
      setInput(name, value)
    }
  })

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('INPUT_')) {
        delete process.env[key]
      }
    }
  })

  it('reads the action.yml defaults', () => {
    const inputs = getActionInputs()

    expect(inputs.testAssemblies).toEqual(['**/bin/Release/NFUnitTest.dll'])
    expect(inputs.workingDirectory).toBe('.')
    expect(inputs.ifNoTestsFound).toBe('error')
    expect(inputs.artifactName).toBe('vstest-results')
    expect(inputs.artifactRetentionDays).toBe(0)
    expect(inputs.runSettings).toBe('')
    expect(inputs.resultsDirectory).toBe('')
    expect(inputs.otherConsoleOptions).toEqual([])
  })

  it('reads multiline inputs one entry per line', () => {
    setInput('test-assemblies', 'a/NFUnitTest.dll\n!b/**\n')
    setInput('other-console-options', '/Blame\n/Diag:log.txt')

    const inputs = getActionInputs()

    expect(inputs.testAssemblies).toEqual(['a/NFUnitTest.dll', '!b/**'])
    expect(inputs.otherConsoleOptions).toEqual(['/Blame', '/Diag:log.txt'])
  })

  it('accepts retention days from 0 to 90', () => {
    setInput('artifact-retention-days', '90')

    expect(getActionInputs().artifactRetentionDays).toBe(90)
  })

  it.each(['-1', '91', '7days', '1.5', 'x'])(
    'throws for invalid retention days %s',
    value => {
      setInput('artifact-retention-days', value)

      expect(() => getActionInputs()).toThrow(/artifact-retention-days/)
    }
  )

  it.each(['warn', 'ignore'])('accepts if-no-tests-found %s', value => {
    setInput('if-no-tests-found', value)

    expect(getActionInputs().ifNoTestsFound).toBe(value)
  })

  it('throws for an invalid if-no-tests-found', () => {
    setInput('if-no-tests-found', 'fail')

    expect(() => getActionInputs()).toThrow(/if-no-tests-found/)
  })

  it('throws when test-assemblies is empty', () => {
    setInput('test-assemblies', '')

    expect(() => getActionInputs()).toThrow(/test-assemblies/)
  })
})

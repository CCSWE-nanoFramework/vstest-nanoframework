import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as core from '@actions/core'
import * as sut from '../src/inputs'
import { Default, Input } from '../src/inputs'

vi.mock('@actions/core')

let getBooleanInputMock: ReturnType<typeof vi.spyOn>
let getInputMock: ReturnType<typeof vi.spyOn>

describe('getActionInputs()', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getBooleanInputMock = vi
      .spyOn(core, 'getBooleanInput')
      .mockImplementation()
    getInputMock = vi.spyOn(core, 'getInput').mockImplementation()
  })

  it('sets correct defaults', () => {
    const inputs = sut.getActionInputs()

    expect(inputs.enableCodeCoverage).toBe(Default.enableCodeCoverage)
    expect(inputs.platform).toBe(Default.platform)
    expect(inputs.runInIsolation).toBe(Default.runInIsolation)
    expect(inputs.runInParallel).toBe(Default.runInParallel)
    expect(inputs.runSettings).toBe(Default.runSettings)
    expect(inputs.solutionFolder).toBe(Default.solutionFolder)
    expect(inputs.testAdapter).toBe(Default.testAdapter)
    expect(inputs.testAssemblies).toBe(Default.testAssemblies)
    expect(inputs.vsTestArguments).toBe(Default.vsTestArguments)
  })

  it('parses inputs', () => {
    getBooleanInputMock.mockImplementation((_name, defaultValue) => {
      return !defaultValue
    })

    getInputMock.mockImplementation(name => {
      return name
    })

    const inputs = sut.getActionInputs()

    expect(inputs.enableCodeCoverage).toBe(!Default.enableCodeCoverage)
    expect(inputs.platform).toBe(Input.Platform)
    expect(inputs.runInIsolation).toBe(!Default.runInIsolation)
    expect(inputs.runInParallel).toBe(!Default.runInParallel)
    expect(inputs.runSettings).toBe(Input.RunSettings)
    expect(inputs.solutionFolder).toBe(Input.SolutionFolder)
    expect(inputs.testAdapter).toBe(Input.TestAdapter)
    expect(inputs.testAssemblies).toBe(Input.TestAssemblies)
    expect(inputs.vsTestArguments).toBe(Input.VsTestArguments)
  })
})

describe('getBooleanInput()', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getBooleanInputMock = vi
      .spyOn(core, 'getBooleanInput')
      .mockImplementation()
  })

  it('returns correct value', () => {
    getBooleanInputMock.mockImplementation(() => true)

    const result = sut.getBooleanInput('name', false)

    expect(getBooleanInputMock).toHaveBeenCalledTimes(1)
    expect(result).toBe(true)
  })

  it('returns default value on error', () => {
    getBooleanInputMock.mockImplementation(() => {
      throw new Error()
    })

    const result = sut.getBooleanInput('name', true)

    expect(getBooleanInputMock).toHaveBeenCalledTimes(1)
    expect(result).toBe(true)
  })
})

describe('getNumberInput()', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getInputMock = vi.spyOn(core, 'getInput').mockImplementation()
  })

  it('returns correct value', () => {
    getInputMock.mockImplementation(() => '69')

    const result = sut.getNumberInput('name', 420)

    expect(getInputMock).toHaveBeenCalledTimes(1)
    expect(result).toBe(69)
  })

  it('returns default value on empty string', () => {
    getInputMock.mockImplementation(() => '')

    const result = sut.getNumberInput('name', 420)

    expect(getInputMock).toHaveBeenCalledTimes(1)
    expect(result).toBe(420)
  })

  it('returns default value on error', () => {
    getInputMock.mockImplementation(() => {
      throw new Error()
    })

    const result = sut.getNumberInput('name', 420)

    expect(getInputMock).toHaveBeenCalledTimes(1)
    expect(result).toBe(420)
  })

  it('returns default value on NaN', () => {
    getInputMock.mockImplementation(() => 'This is not a number')

    const result = sut.getNumberInput('name', 420)

    expect(getInputMock).toHaveBeenCalledTimes(1)
    expect(result).toBe(420)
  })
})

describe('getStringInput()', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getInputMock = vi.spyOn(core, 'getInput').mockImplementation()
  })

  it('returns correct value', () => {
    getInputMock.mockImplementation(() => 'inputValue')

    const result = sut.getStringInput('name', 'defaultValue')

    expect(getInputMock).toHaveBeenCalledTimes(1)
    expect(result).toBe('inputValue')
  })

  it('returns default value on empty string', () => {
    getInputMock.mockImplementation(() => '')

    const result = sut.getStringInput('name', 'defaultValue')

    expect(getInputMock).toHaveBeenCalledTimes(1)
    expect(result).toBe('defaultValue')
  })

  it('returns default value on error', () => {
    getInputMock.mockImplementation(() => {
      throw new Error()
    })

    const result = sut.getStringInput('name', 'defaultValue')

    expect(getInputMock).toHaveBeenCalledTimes(1)
    expect(result).toBe('defaultValue')
  })
})

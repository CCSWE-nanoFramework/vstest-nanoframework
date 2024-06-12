import * as core from '@actions/core'
import * as sut from '../src/inputs'
import { Default, Input } from '../src/inputs'

let getBooleanInputMock: jest.SpiedFunction<typeof core.getBooleanInput>
let getInputMock: jest.SpiedFunction<typeof core.getInput>

describe('getActionInputs()', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    getBooleanInputMock = jest
      .spyOn(core, 'getBooleanInput')
      .mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
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
    jest.clearAllMocks()

    getBooleanInputMock = jest
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
    jest.clearAllMocks()

    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
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
    jest.clearAllMocks()

    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
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

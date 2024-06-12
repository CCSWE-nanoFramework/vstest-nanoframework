import * as exec from '@actions/exec'
import { Default, Inputs } from '../src/inputs'
import * as path from '../src/path'
import * as powershell from '../src/powershell'
import * as sut from '../src/vstest'

const SolutionFolder = path.join(__dirname, './__solution__')

let execMock: jest.SpiedFunction<typeof exec.exec>
let expandArchiveMock: jest.SpiedFunction<typeof powershell.expandArchive>
let invokeWebRequestMock: jest.SpiedFunction<typeof powershell.invokeWebRequest>

describe('downloadTestTools()', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    expandArchiveMock = jest
      .spyOn(powershell, 'expandArchive')
      .mockImplementation()
    invokeWebRequestMock = jest
      .spyOn(powershell, 'invokeWebRequest')
      .mockImplementation()
  })

  it('returns path to vstest.console.exe', async () => {
    const vsTestPath = await sut.downloadTestTools()

    expect(vsTestPath).toBeTruthy()
    expect(invokeWebRequestMock).toHaveBeenCalledTimes(1)
    expect(expandArchiveMock).toHaveBeenCalledTimes(1)
  })
})

describe('getRunSettings()', () => {
  it('finds test settings', async () => {
    const inputs: Inputs = {
      solutionFolder: SolutionFolder
    }

    const results = await sut.getRunSettings(inputs)

    expect(results.length).toBe(1)
  })

  it('throws if `solutionFolder` is not supplied', async () => {
    const inputs: Inputs = {
      testAssemblies: Default.testAssemblies
    }

    await expect(sut.getRunSettings(inputs)).rejects.toThrow()
  })
})

describe('getTestAdapters()', () => {
  it('finds test adapters', async () => {
    const inputs: Inputs = {
      solutionFolder: SolutionFolder,
      testAdapter: Default.testAdapter
    }

    const results = await sut.getTestAdapters(inputs)

    expect(results.length).toBe(1)
  })

  it('throws if `solutionFolder` is not supplied', async () => {
    const inputs: Inputs = {
      testAdapter: Default.testAdapter
    }

    await expect(sut.getTestAdapters(inputs)).rejects.toThrow()
  })

  it('throws if `testAdapter` is not supplied', async () => {
    const inputs: Inputs = {
      solutionFolder: SolutionFolder
    }

    await expect(sut.getTestAdapters(inputs)).rejects.toThrow()
  })
})

describe('getTestArguments()', () => {
  it('handles default values', () => {
    expect(sut.getTestArguments({})).toBe('')
  })

  it.each([
    [true, '/EnableCodeCoverage '],
    [false, ''],
    [undefined, '']
  ])(`handles 'enableCodeCoverage' %s`, (test, expected) => {
    expect(sut.getTestArguments({ enableCodeCoverage: test })).toBe(expected)
  })

  it.each([
    ['x86', '/Platform:x86 '],
    ['x64', '/Platform:x64 '],
    ['ARM', '/Platform:ARM '],
    [undefined, ''],
    ['', '']
  ])(`handles 'platform' %s`, (test, expected) => {
    expect(sut.getTestArguments({ platform: test })).toBe(expected)
  })

  it.each([
    [true, '/InIsolation '],
    [false, ''],
    [undefined, '']
  ])(`handles 'runInIsolation' %s`, (test, expected) => {
    expect(sut.getTestArguments({ runInIsolation: test })).toBe(expected)
  })

  it.each([
    [true, '/Parallel '],
    [false, ''],
    [undefined, '']
  ])(`handles 'runInParallel' %s`, (test, expected) => {
    expect(sut.getTestArguments({ runInParallel: test })).toBe(expected)
  })

  it.each([
    ['runsettings', '/Settings:runsettings '],
    ['', ''],
    [undefined, '']
  ])(`handles 'runSettings' %s`, (test, expected) => {
    expect(sut.getTestArguments({ runSettings: test })).toBe(expected)
  })

  it.each([
    ['arg1', 'arg1'],
    ['arg1 arg2', 'arg1 arg2'],
    ['', ''],
    [undefined, '']
  ])(`handles 'vsTestArguments' %s`, (test, expected) => {
    expect(sut.getTestArguments({ vsTestArguments: test })).toBe(expected)
  })
})

describe('getTestAssemblies()', () => {
  it('finds test assemblies', async () => {
    const inputs: Inputs = {
      solutionFolder: SolutionFolder,
      testAssemblies: Default.testAssemblies
    }

    const results = await sut.getTestAssemblies(inputs)

    expect(results.length).toBe(2)
  })

  it('throws if `solutionFolder` is not supplied', async () => {
    const inputs: Inputs = {
      testAssemblies: Default.testAssemblies
    }

    await expect(sut.getTestAssemblies(inputs)).rejects.toThrow()
  })

  it('throws if `testAssemblies` is not supplied', async () => {
    const inputs: Inputs = {
      solutionFolder: SolutionFolder
    }

    await expect(sut.getTestAssemblies(inputs)).rejects.toThrow()
  })
})

describe('runTests()', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    execMock = jest.spyOn(exec, 'exec').mockImplementation()
  })

  it('executes vstest.console.exe', async () => {
    const args = 'args'
    const testAdapterPath = 'testAdapter'
    const testAssemblies = ['testAssembly1', 'testAssembly2']
    const vsTestPath = 'vsTestPath'

    await sut.runTests(vsTestPath, testAssemblies, testAdapterPath, args)

    expect(execMock).toHaveBeenCalledTimes(1)
  })
})

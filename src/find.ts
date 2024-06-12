import * as core from '@actions/core'
import * as glob from '@actions/glob'
import { stat } from 'fs'
import { promisify } from 'util'
import * as path from './path'

const statAsync = promisify(stat)

const defaultGlobOptions: glob.GlobOptions = {
  followSymbolicLinks: true,
  implicitDescendants: true,
  omitBrokenSymbolicLinks: true
}

export interface FindResult {
  directories: string[]
  files: string[]
  searchPaths: string[]
}

export async function find(pattern: string): Promise<FindResult> {
  const result: FindResult = {
    directories: [],
    files: [],
    searchPaths: []
  }

  pattern = path.normalize(pattern)

  const globber = await glob.create(pattern, defaultGlobOptions)
  const globResults: string[] = await globber.glob()

  for (const globResult of globResults) {
    const stats = await statAsync(globResult)
    if (stats.isDirectory()) {
      result.directories.push(globResult)
    } else {
      result.files.push(globResult)
    }
  }

  result.searchPaths = globber.getSearchPaths()

  return result
}

/**
 * If multiple search paths are specified, the least common ancestor (LCA) of the search paths is used as
 * the delimiter to control the directory structure. This function returns the LCA when given an array of
 * search paths
 *
 * Example 1: The patterns `/foo/` and `/bar/` returns `/`
 *
 * Example 2: The patterns `~/foo/bar/*` and `~/foo/voo/two/*` and `~/foo/mo/` returns `~/foo`
 */
export function getSearchPath(searchPaths: string[]): string {
  const commonPaths = new Array<string>()
  const splitPaths = new Array<string[]>()
  let smallestPathLength = Number.MAX_SAFE_INTEGER

  // split each of the search paths using the platform specific separator
  for (const searchPath of searchPaths) {
    core.debug(`Using search path ${searchPath}`)

    const splitSearchPath = path.normalize(searchPath).split(path.sep)

    // keep track of the smallest path length so that we don't accidentally later go out of bounds
    smallestPathLength = Math.min(smallestPathLength, splitSearchPath.length)
    splitPaths.push(splitSearchPath)
  }

  // on Unix-like file systems, the file separator exists at the beginning of the file path, make sure to preserve it
  if (searchPaths.some(searchPath => searchPath.startsWith(path.sep))) {
    commonPaths.push(path.sep)
  }

  let splitIndex = 0
  // function to check if the paths are the same at a specific index
  function isPathTheSame(): boolean {
    const compare = splitPaths[0][splitIndex]
    for (let i = 1; i < splitPaths.length; i++) {
      if (compare !== splitPaths[i][splitIndex]) {
        // a non-common index has been reached
        return false
      }
    }
    return true
  }

  // loop over all the search paths until there is a non-common ancestor or we go out of bounds
  while (splitIndex < smallestPathLength) {
    if (!isPathTheSame()) {
      break
    }
    // if all are the same, add to the end result & increment the index
    commonPaths.push(splitPaths[0][splitIndex])
    splitIndex++
  }
  return path.join(...commonPaths)
}

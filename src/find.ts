import * as glob from '@actions/glob'
import * as path from './path.js'

const globOptions: glob.GlobOptions = {
  followSymbolicLinks: true,
  implicitDescendants: false,
  matchDirectories: false,
  omitBrokenSymbolicLinks: true
}

/**
 * Returns the files matching the patterns. Relative patterns are resolved
 * against `workingDirectory`; absolute patterns and `!` negations are kept.
 */
export async function findFiles(
  patterns: string[],
  workingDirectory: string
): Promise<string[]> {
  const resolved = patterns
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => resolvePattern(p, workingDirectory))

  if (resolved.length === 0) {
    return []
  }

  const globber = await glob.create(resolved.join('\n'), globOptions)
  const files = await globber.glob()
  return files.sort((a, b) => a.localeCompare(b))
}

export function resolvePattern(
  pattern: string,
  workingDirectory: string
): string {
  const negate = pattern.startsWith('!')
  const value = negate ? pattern.slice(1) : pattern
  const resolved = path.isAbsolute(value)
    ? path.normalize(value)
    : path.join(workingDirectory, value)
  return negate ? `!${resolved}` : resolved
}

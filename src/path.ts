import * as path from 'path'

// Inputs may use either separator; normalize to `/` before handing paths to
// @actions/glob or joining them.

export function isAbsolute(value: string): boolean {
  return path.win32.isAbsolute(value) || path.posix.isAbsolute(value)
}

export function join(...paths: string[]): string {
  return normalize(path.join(...paths.map(toForwardSlashes)))
}

export function normalize(value: string): string {
  return toForwardSlashes(path.normalize(toForwardSlashes(value)))
}

function toForwardSlashes(value: string): string {
  return value.replace(/\\/g, '/')
}

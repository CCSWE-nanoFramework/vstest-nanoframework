import * as path from 'path'

export const sep = '/'

export function join(...paths: string[]): string {
  return path.join(...paths)
}

export function normalize(value: string): string {
  return path.normalize(value.replace(/\\/g, '/'))
}

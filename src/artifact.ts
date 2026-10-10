import * as core from '@actions/core'
import { DefaultArtifactClient } from '@actions/artifact'
import type { UploadArtifactOptions } from '@actions/artifact'
import * as glob from '@actions/glob'
import * as path from './path.js'

/**
 * Uploads everything under `directory`. Best effort: missing files and upload
 * errors are warnings, since the test results already decide the outcome.
 * Returns the artifact id, if one was uploaded.
 */
export async function uploadResults(
  name: string,
  directory: string,
  retentionDays: number
): Promise<number | undefined> {
  const globber = await glob.create(path.join(directory, '**'), {
    matchDirectories: false
  })
  const files = await globber.glob()

  if (files.length === 0) {
    core.warning(`No test results in ${directory}; nothing to upload`)
    return undefined
  }

  const options: UploadArtifactOptions = {}
  if (retentionDays > 0) {
    options.retentionDays = retentionDays
  }

  try {
    const { id } = await new DefaultArtifactClient().uploadArtifact(
      name,
      files,
      directory,
      options
    )
    core.info(`Uploaded ${files.length} file(s) as artifact ${name}`)
    return id
  } catch (error) {
    core.warning(
      `Failed to upload artifact ${name}: ${error instanceof Error ? error.message : String(error)}`
    )
    return undefined
  }
}

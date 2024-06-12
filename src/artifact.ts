import * as core from '@actions/core'
import { DefaultArtifactClient, UploadArtifactOptions } from '@actions/artifact'
import { find } from './find'

export async function uploadArtifact(
  name: string,
  path: string,
  retentionDays?: number
): Promise<void> {
  const findResult = await find(path)
  if (findResult.files.length === 0) {
    throw new Error(
      `No files were found with the provided path: ${path}. No artifact will be uploaded.`
    )
  }

  const s = findResult.files.length === 1 ? '' : 's'
  core.info(
    `With the provided path, there will be ${findResult.files.length} file${s} uploaded`
  )

  const artifact = new DefaultArtifactClient()

  const options: UploadArtifactOptions = {}

  if (retentionDays && retentionDays > 0) {
    options.retentionDays = retentionDays
  }

  const { id, size } = await artifact.uploadArtifact(
    name,
    findResult.files,
    findResult.searchPaths[0], // TODO: Error if multiple search paths?
    options
  )

  if (id === undefined || size === undefined || size <= 0) {
    throw new Error(`An error was encountered while uploading ${name}.`)
  } else {
    core.info(`Artifact ${name} has been successfully uploaded!`)
  }
}

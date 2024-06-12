import * as exec from '@actions/exec'

export async function expandArchive(
  path: string,
  destinationPath: string
): Promise<void> {
  await exec.exec(
    `powershell Expand-Archive -Path ${path} -DestinationPath ${destinationPath}`
  )
}

export async function invokeWebRequest(
  uri: string,
  outFile: string
): Promise<void> {
  await exec.exec(
    `powershell Invoke-WebRequest -Uri "${uri}" -OutFile ${outFile}`
  )
}

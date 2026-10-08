# Workflow to rebuild dist/

Refreshing `dist/` currently needs a local pull, `npm run bundle` and push.
Dependabot npm PRs (production and transitive bumps) and small source edits fail
`Check Transpiled JavaScript` until someone does that by hand.

1. Add a workflow (`workflow_dispatch` plus `pull_request` from
   `dependabot[bot]`) that runs `npm ci && npm run bundle` and commits `dist/`
   back to the branch when it changed.
2. Push with the automation GitHub App token (`actions/create-github-app-token`,
   `AUTOMATION_APP_ID` / `AUTOMATION_APP_KEY`); pushes made with `GITHUB_TOKEN`
   don't trigger the follow-up checks, and Dependabot-triggered runs only see
   Dependabot secrets.
3. Validate with `actionlint`, then exercise it on a Dependabot npm PR.

Delete this file when done.

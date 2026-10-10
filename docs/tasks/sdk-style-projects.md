# Support SDK-style / PackageReference projects

`nanoFramework.NET.Sdk` projects build to `bin/Release/netnano1.0/` and restore
to the global packages folder, so v2's defaults and adapter lookup miss them.

1. Add `**/bin/Release/netnano1.0/NFUnitTest.dll` to the `test-assemblies`
   default.
2. In `src/plan.ts`, when the project has no `packages.config`, resolve
   `nanoFramework.TestFramework` from `obj/project.assets.json`
   (`packageFolders` + the library `path`) for both the adapter (`lib/net48`)
   and the `content/nano.runsettings` fallback.
3. Add fixtures and an e2e project; release as a v2 minor.

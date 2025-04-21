
Remove-Item -Path ".\solution\packages\*" -Recurse -Force

& nuget update .\solution\VsTestAction.sln
& nuget restore .\solution\VsTestAction.sln

& 'C:\Program Files\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\amd64\msbuild.exe' .\solution\VsTestAction.sln -t:Rebuild -p:Configuration=Debug
& 'C:\Program Files\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\amd64\msbuild.exe' .\solution\VsTestAction.sln -t:Rebuild -p:Configuration=Release

Remove-Item -Path ".\__tests__\__solution__\packages\*" -Recurse -Force
Copy-Item -Path ".\solution\packages\*.TestFramework.*" -Destination ".\__tests__\__solution__\packages\" -Recurse -Force

Remove-Item -Path ".\__tests__\__solution__\project1\bin\Debug\*" -Recurse -Force
Copy-Item -Path ".\solution\NFUnitTest1\bin\Debug" -Destination ".\__tests__\__solution__\project1\bin\Debug" -Recurse -Force

Remove-Item -Path ".\__tests__\__solution__\project2\bin\Release\*" -Recurse -Force
Copy-Item -Path ".\solution\NFUnitTest1\bin\Release\NFUnitTest.dll" -Destination ".\__tests__\__solution__\project2\bin\Release\" -Force
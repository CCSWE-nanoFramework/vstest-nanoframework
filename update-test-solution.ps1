
Remove-Item -Path ".\solution\packages\*" -Recurse -Force

nuget update .\solution\VsTestAction.sln
#TODO: MSBuild the Debug solution
#TODO: MSBuild the Release solution

#Remove-Item -Path ".\__tests__\__solution__\packages\*" -Recurse -Force
#TODO: Copy the packages from the solution folder to the test solution folder

#TODO: Update tests for correct TestFramework version

Remove-Item -Path ".\__tests__\__solution__\project1\bin\Debug\*" -Recurse -Force
Copy-Item -Path ".\solution\NFUnitTest1\bin\Debug" -Destination ".\__tests__\__solution__\project1\bin\Debug" -Recurse -Force

Remove-Item -Path ".\__tests__\__solution__\project2\bin\Release\*" -Recurse -Force
Copy-Item -Path ".\solution\NFUnitTest1\bin\Release\NFUnitTest.dll" -Destination ".\__tests__\__solution__\project2\bin\Release\" -Force
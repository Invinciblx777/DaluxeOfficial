$url = 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip'
$zip = 'C:\Users\Invinciblx777\AppData\Local\Temp\node.zip'
$dest = 'C:\Users\Invinciblx777\AppData\Local\Temp\node_extracted'
$bin = 'C:\Users\Invinciblx777\.gemini\antigravity\bin'

Write-Host "Downloading Node.js v20.11.1..."
Invoke-WebRequest -Uri $url -OutFile $zip

Write-Host "Extracting Node.js..."
if (Test-Path $dest) { Remove-Item -Path $dest -Recurse -Force }
Expand-Archive -Path $zip -DestinationPath $dest -Force

Write-Host "Copying Node.js to bin folder..."
Copy-Item -Path "$dest\node-v20.11.1-win-x64\*" -Destination $bin -Recurse -Force

Write-Host "Cleaning up temp files..."
if (Test-Path $zip) { Remove-Item -Path $zip -Force }
if (Test-Path $dest) { Remove-Item -Path $dest -Recurse -Force }

Write-Host "Node.js successfully installed!"

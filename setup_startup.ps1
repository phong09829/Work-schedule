$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPy = Join-Path $scriptDir "server.py"
$startupDir = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$shortcutPath = Join-Path $startupDir "FocusFlow_Server.lnk"

# Tim duong dan toi pythonw.exe
$pythonwCmd = Get-Command pythonw.exe -ErrorAction SilentlyContinue
$pythonwPath = if ($pythonwCmd) { $pythonwCmd.Source } else { "pythonw.exe" }

# Tao Shortcut khoi dong truc tiep cung Windows bang pythonw.exe
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $pythonwPath
$shortcut.Arguments = "`"$serverPy`" --no-browser"
$shortcut.WorkingDirectory = $scriptDir
$shortcut.WindowStyle = 7
$shortcut.Description = "FocusFlow Background Server"
$shortcut.Save()

Write-Host "[OK] Da tao shortcut Windows Startup tai: $shortcutPath" -ForegroundColor Green

# Kiem tra xem port 5000 co dang chay khong
$conn = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if (-not $conn) {
    Start-Process -FilePath $pythonwPath -ArgumentList "`"$serverPy`" --no-browser" -WorkingDirectory $scriptDir
    Start-Sleep -Seconds 1
    Write-Host "[OK] Da khoi dong may chu ngam tai cong 5000 thanh cong!" -ForegroundColor Cyan
} else {
    Write-Host "[*] May chu da dang hoat dong san sang tai cong 5000." -ForegroundColor Yellow
}

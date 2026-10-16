$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# 1. Kiem tra va khoi dong Python server neu chua chay
$conn = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if (-not $conn) {
    Write-Host "[*] Dang khoi dong backend Python tren cong 5000..." -ForegroundColor Cyan
    Start-Process "pythonw.exe" -ArgumentList "server.py --no-browser" -WorkingDirectory $scriptDir
    Start-Sleep -Seconds 2
}

# 2. Khoi dong Cloudflare Tunnel tao Public HTTPS URL
Write-Host "=======================================================================" -ForegroundColor Green
Write-Host " 🌐 FOCUSFLOW - TAO DUONG TRUY CAP TOAN CAU QUA CLOUDFLARE HTTPS" -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Green
Write-Host "[*] Dang ket noi mang luoi Cloudflare de tao link HTTPS toan cau..." -ForegroundColor Yellow

$logFile = Join-Path $scriptDir "tunnel_output.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force }

$process = Start-Process -FilePath ".\cloudflared.exe" -ArgumentList "tunnel --url http://localhost:5000" -RedirectStandardError $logFile -PassThru -NoNewWindow

$publicUrl = ""
$timeout = 20
$elapsed = 0

while ($elapsed -lt $timeout -and [string]::IsNullOrEmpty($publicUrl)) {
    Start-Sleep -Seconds 1
    $elapsed++
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
        if ($content -match "https://[a-zA-Z0-9\-]+\.trycloudflare\.com") {
            $publicUrl = $Matches[0]
            break
        }
    }
}

if ($publicUrl) {
    # Luu duong dan ra tep de tien su dung
    Set-Content -Path (Join-Path $scriptDir "public_url.txt") -Value $publicUrl
    Write-Host ""
    Write-Host "=======================================================================" -ForegroundColor Cyan
    Write-Host "🎉 DUONG LINK HOAT DONG TOAN CAU CUA BAN (BAT KY MANG WIFI NAO):" -ForegroundColor Green
    Write-Host "👉 $publicUrl" -ForegroundColor White -BackgroundColor DarkGreen
    Write-Host "=======================================================================" -ForegroundColor Cyan
    Write-Host "📱 Ban co the mo link nay tren dien thoai, may tinh khac, bat ky wifi nao!" -ForegroundColor Yellow
    Write-Host "📧 Gui ma OTP that 100% toi bat ky hom thu Gmail nao." -ForegroundColor Yellow
    Write-Host "Giữ cửa sổ này mở để duy trì kết nối trực tuyến toàn cầu." -ForegroundColor Gray
    
    # Tu dong mo trinh duyet
    Start-Process $publicUrl
    $process.WaitForExit()
} else {
    Write-Host "[!] Khong the lay public URL tu dong. Dang chay truc tiep..." -ForegroundColor Red
    .\cloudflared.exe tunnel --url http://localhost:5000
}

# True Cycle One-Click Launcher
$ErrorActionPreference = 'SilentlyContinue'
$rootDir = $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }

function Test-PortActive([int]$port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect('127.0.0.1', $port, $null, $null)
        $wait = $async.AsyncWaitHandle.WaitOne(300, $false)
        if (-not $wait) {
            $client.Close()
            return $false
        }
        $client.EndConnect($async)
        $client.Close()
        return $true
    } catch {
        return $false
    }
}

# 1. Ensure EcoLens Python API (port 8000) is running
$isApiUp = Test-PortActive -port 8000
if (-not $isApiUp) {
    Write-Host "[*] Launching EcoLens AI Backend on http://localhost:8000..." -ForegroundColor Cyan
    Start-Process -FilePath "python" -ArgumentList "module/run.py" -WorkingDirectory $rootDir -WindowStyle Minimized
} else {
    Write-Host "[v] EcoLens AI Backend is already active on port 8000." -ForegroundColor Green
}

# 2. Ensure True Cycle Vite UI (port 3000) is running
$isViteUp = Test-PortActive -port 3000
if (-not $isViteUp) {
    Write-Host "[*] Launching True Cycle Web App on http://localhost:3000..." -ForegroundColor Cyan
    Start-Process -FilePath "node" -ArgumentList "node_modules/vite/bin/vite.js --port 3000 --host" -WorkingDirectory $rootDir -WindowStyle Minimized
} else {
    Write-Host "[v] True Cycle Web App is already active on port 3000." -ForegroundColor Green
}

# 3. Wait until port 3000 responds (up to 20 seconds)
$timeoutSec = 20
$elapsed = 0
while (-not (Test-PortActive -port 3000) -and ($elapsed -lt $timeoutSec)) {
    Start-Sleep -Milliseconds 600
    $elapsed += 1
}

# 4. Open in default browser
Write-Host "[v] True Cycle is ready! Opening http://localhost:3000..." -ForegroundColor Green
Start-Process "http://localhost:3000"

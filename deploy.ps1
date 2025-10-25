param(
    [switch]$RefreshDeps = $false,
    [switch]$UseCI = $false,
    [string]$Pm2Name = 'major-match',
    [switch]$OnlyBuild = $false
)

$ErrorActionPreference = 'Stop'

function Assert-LastExit {
    param([string]$Step)
    if ($LASTEXITCODE -ne 0) {
        throw "Step failed: $Step (exit code $LASTEXITCODE)"
    }
}

# Move to project root (script directory)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

Write-Host "==> Deploy starting in: $scriptDir" -ForegroundColor Cyan

if ($RefreshDeps) {
    if ($UseCI) {
        Write-Host "==> Installing deps (npm ci, prod)" -ForegroundColor Cyan
        npm ci --omit=dev --no-audit --no-fund --no-optional
        Assert-LastExit 'npm ci'
    } else {
        Write-Host "==> Installing deps (npm run install-prod)" -ForegroundColor Cyan
        npm run install-prod
        Assert-LastExit 'install-prod'
    }
}

Write-Host "==> Building frontend (npm run build)" -ForegroundColor Cyan
npm run build
Assert-LastExit 'build'

if ($OnlyBuild) {
    Write-Host "==> Build completed (OnlyBuild)" -ForegroundColor Green
    exit 0
}

# Try pm2 if available
$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2) {
    Write-Host "==> pm2 detected. Reloading/starting '$Pm2Name'" -ForegroundColor Cyan
    & pm2 describe $Pm2Name *> $null
    if ($LASTEXITCODE -eq 0) {
        & pm2 reload $Pm2Name
        Assert-LastExit 'pm2 reload'
    } else {
        & pm2 start server.js --name $Pm2Name --update-env
        Assert-LastExit 'pm2 start'
    }
    try { & pm2 save *> $null } catch {}
    Write-Host "==> Deployment complete via pm2" -ForegroundColor Green
    exit 0
}

Write-Host "==> pm2 not found. Frontend updated. Please restart the Node server manually." -ForegroundColor Yellow
Write-Host "    Hint: Install pm2 for easy restarts: npm i -g pm2" -ForegroundColor DarkYellow
Write-Host "    Then run: pm2 start server.js --name $Pm2Name" -ForegroundColor DarkYellow

exit 0



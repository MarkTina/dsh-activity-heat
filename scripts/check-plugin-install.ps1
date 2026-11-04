param([string]$Name = '@local/activity-heat')
$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$profileDir = $env:DSH_PROFILE_DIR
if ([string]::IsNullOrWhiteSpace($profileDir)) {
  $profileDir = Join-Path $env:USERPROFILE '.dsh\profiles\desktop'
}
$pkgDir = Join-Path $profileDir (Join-Path 'node_modules' $Name)
$ok = $true

Write-Host "workspace : $workspace"
Write-Host "profile   : $profileDir"
Write-Host "entry     : $pkgDir"

if (-not (Test-Path $pkgDir)) {
  Write-Host "FAIL: package is not installed in the profile" -ForegroundColor Red
  exit 1
}

$item = Get-Item $pkgDir
$isLink = $item.LinkType -in @('Junction', 'SymbolicLink')
$targets = @($item.Target)
Write-Host ("link      : {0} -> {1}" -f $item.LinkType, ($targets -join ', '))
if (-not $isLink) {
  Write-Host "FAIL: profile entry is a plain directory (stale copy), not a link" -ForegroundColor Red
  $ok = $false
} elseif (-not ($targets | Where-Object { $_.TrimEnd('\') -eq $workspace.TrimEnd('\') })) {
  Write-Host "FAIL: link target is not this workspace" -ForegroundColor Red
  $ok = $false
}

$wsVer = (Select-String -Path (Join-Path $workspace 'package.json') -Pattern '"version"' | Select-Object -First 1).Line
$pfVer = (Select-String -Path (Join-Path $pkgDir 'package.json') -Pattern '"version"' | Select-Object -First 1).Line
Write-Host "workspace $wsVer"
Write-Host "profile   $pfVer"
if ($wsVer.Trim() -ne $pfVer.Trim()) {
  Write-Host "FAIL: version mismatch (workspace changes are not in the profile)" -ForegroundColor Red
  $ok = $false
}

$lock = Join-Path $profileDir 'pnpm-lock.yaml'
if (Test-Path $lock) {
  $ln = Select-String -Path $lock -Pattern "specifier: link:" | Select-Object -First 1
  if ($ln) {
    Write-Host "lock      : link (ok)"
  } else {
    Write-Host "FAIL: pnpm-lock is not link (GitHub tarball may override it)" -ForegroundColor Red
    $ok = $false
  }
}

if ($ok) {
  Write-Host "PASS: profile points at the workspace and versions match." -ForegroundColor Green
  exit 0
}
Write-Host "Fix: dsh plugin --profile desktop add link:$workspace" -ForegroundColor Yellow
exit 1

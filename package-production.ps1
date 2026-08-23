<#
.SYNOPSIS
    Packages the entire ClientHub project into a clean, production-ready ZIP file for web hosting upload.
#>

$sourceDir = $PSScriptRoot
$zipPath = Join-Path $sourceDir "ClientHub-Ready-Upload.zip"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Packaging ClientHub for Web Hosting...  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Remove old zip if exists
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
    Write-Host "Removed existing zip file." -ForegroundColor Yellow
}

# Temporary staging folder
$stagingDir = Join-Path $env:TEMP ("clienthub_deploy_" + (Get-Date -Format "yyyyMMddHHmmss"))
New-Item -ItemType Directory -Path $stagingDir | Out-Null

Write-Host "Copying production files to staging area..." -ForegroundColor White

# List of folders and files to include
$includeItems = @(
    "api",
    "assets",
    "config",
    "data",
    "js",
    "middleware",
    "setup",
    "uploads",
    "utils",
    "index.html",
    "index.php",
    "portal.html",
    "public-contact-form.html",
    ".htaccess",
    "router.php",
    "README.md",
    "PANDUAN-UPLOAD-HOSTING.md"
)

foreach ($item in $includeItems) {
    $src = Join-Path $sourceDir $item
    if (Test-Path $src) {
        $dest = Join-Path $stagingDir $item
        Copy-Item -Path $src -Destination $dest -Recurse -Force
        Write-Host "  [+] Included: $item" -ForegroundColor Green
    }
}

# Ensure .htaccess files inside subdirectories are included
$subHtaccess = @("data\.htaccess", "uploads\.htaccess")
foreach ($h in $subHtaccess) {
    $srcH = Join-Path $sourceDir $h
    $destH = Join-Path $stagingDir $h
    if (Test-Path $srcH) {
        $destDir = Split-Path $destH -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
        Copy-Item -Path $srcH -Destination $destH -Force
    }
}

# Create zip file
Write-Host "`nCompressing into $zipPath..." -ForegroundColor White
Compress-Archive -Path "$stagingDir\*" -DestinationPath $zipPath -Force

# Clean up staging
Remove-Item -Path $stagingDir -Recurse -Force

$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " SUCCESS! Production Package Created:    " -ForegroundColor Green
Write-Host " File: ClientHub-Ready-Upload.zip        " -ForegroundColor Cyan
Write-Host " Size: $([math]::Round($zipSize, 2)) MB  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Upload this ZIP file directly to your cPanel / hosting public_html folder and extract it!" -ForegroundColor White

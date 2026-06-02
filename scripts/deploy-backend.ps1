<#
.SYNOPSIS
  Deploy UrbanShield backend to AWS Lambda via Serverless Framework.
.DESCRIPTION
  Deploys the Express API as a Lambda function behind API Gateway.
  Outputs the API Gateway URL for use by the frontend deploy script.
#>
param(
  [string]$Stage = "dev",
  [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  UrbanShield Backend Deploy" -ForegroundColor Cyan
Write-Host "  Stage: $Stage | Region: $Region" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Verify Node.js
Write-Host "[1/4] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "  Node.js $nodeVersion" -ForegroundColor Green

# 2. Install dependencies
Write-Host "[2/4] Installing dependencies..." -ForegroundColor Yellow
npm ci --omit=dev 2>&1 | Out-Null
Write-Host "  Dependencies installed" -ForegroundColor Green

# 3. Check Serverless Framework
Write-Host "[3/4] Checking Serverless Framework..." -ForegroundColor Yellow
$slsInstalled = $null
try { $slsInstalled = npx serverless --version 2>$null } catch {}
if (-not $slsInstalled) {
  Write-Host "  Installing Serverless Framework..." -ForegroundColor Yellow
  npm install -g serverless 2>&1 | Out-Null
}
Write-Host "  Serverless Framework ready" -ForegroundColor Green

# 4. Deploy
Write-Host "[4/4] Deploying to AWS Lambda..." -ForegroundColor Yellow
Write-Host "  This may take 3-5 minutes on first deploy...`n" -ForegroundColor DarkGray

$deployOutput = npx serverless deploy --stage $Stage --region $Region --verbose 2>&1 | Tee-Object -Variable deployLog

# Extract API URL from output
$apiUrl = ($deployLog | Select-String -Pattern "https://.*\.execute-api\..*\.amazonaws\.com" | Select-Object -First 1).Matches[0].Value

if ($apiUrl) {
  Write-Host "`n========================================" -ForegroundColor Green
  Write-Host "  DEPLOY SUCCESSFUL!" -ForegroundColor Green
  Write-Host "========================================" -ForegroundColor Green
  Write-Host "  API Gateway URL: $apiUrl" -ForegroundColor White
  Write-Host "  Health Check:    $apiUrl/api/health" -ForegroundColor White
  Write-Host "========================================`n" -ForegroundColor Green

  # Save URL for frontend deploy script
  $apiUrl | Out-File -FilePath "$PSScriptRoot\.api-url" -Encoding UTF8 -NoNewline
  Write-Host "  URL saved to scripts/.api-url" -ForegroundColor DarkGray
} else {
  Write-Host "`n  Deploy completed but could not extract API URL." -ForegroundColor Yellow
  Write-Host "  Check the output above for the endpoint URL." -ForegroundColor Yellow
  Write-Host "  You can also run: npx serverless info --stage $Stage" -ForegroundColor Yellow
}

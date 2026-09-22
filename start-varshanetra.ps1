# VARSHANETRA Complete Startup Script
# This script starts Frontend + ML Server + MongoDB together

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "    VARSHANETRA - Complete System Startup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running in correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js not found! Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Python
Write-Host "🐍 Checking Python..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version
    Write-Host "   ✓ $pythonVersion installed" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Python not found! Please install Python from https://www.python.org/" -ForegroundColor Red
    exit 1
}

# Check MongoDB
Write-Host "🍃 Checking MongoDB..." -ForegroundColor Cyan
try {
    $mongoVersion = mongod --version 2>&1 | Select-String -Pattern "db version" | Select-Object -First 1
    if ($mongoVersion) {
        Write-Host "   ✓ MongoDB installed" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  MongoDB not found - will try to connect to MongoDB Atlas" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting all services..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if ML server exists
if (Test-Path "ml_server/app.py") {
    Write-Host "✓ ML Server found" -ForegroundColor Green
} else {
    Write-Host "⚠️  ML Server not found at ml_server/app.py" -ForegroundColor Yellow
}

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✓ Environment variables configured (.env.local)" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local not found - using default configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting services in parallel..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📺 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🤖 ML Server: http://localhost:5000" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Run npm dev (which now runs everything via concurrently)
npm run dev

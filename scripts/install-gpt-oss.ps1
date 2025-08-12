# GPT-OSS-120B Installation Script for Windows/PowerShell
# This script downloads and sets up the GPT-OSS-120B model

Write-Host "🚀 Installing GPT-OSS-120B for Synapse AI..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python 3 is required but not installed. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

# Check if pip is installed
try {
    $pipVersion = pip --version 2>&1
    Write-Host "✅ pip found: $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pip is required but not installed. Please install pip first." -ForegroundColor Red
    exit 1
}

# Create model directory
Write-Host "📁 Creating model directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "gpt-oss-120b" | Out-Null

# Install Hugging Face CLI
Write-Host "📦 Installing Hugging Face CLI..." -ForegroundColor Yellow
pip install --upgrade huggingface_hub

# Download GPT-OSS-120B model
Write-Host "⬇️  Downloading GPT-OSS-120B model (this may take a while)..." -ForegroundColor Yellow
Write-Host "📊 Model size: ~240GB - ensure you have sufficient disk space" -ForegroundColor Cyan

# Try huggingface-cli first
try {
    huggingface-cli download openai/gpt-oss-120b --include "original/*" --local-dir gpt-oss-120b/
    Write-Host "✅ Model downloaded using huggingface-cli" -ForegroundColor Green
} catch {
    Write-Host "⚠️  huggingface-cli failed, trying Python fallback..." -ForegroundColor Yellow
    
    # Fallback to Python script
    $pythonScript = @"
from huggingface_hub import snapshot_download
import os

print('Downloading GPT-OSS-120B model...')
try:
    snapshot_download(
        repo_id='openai/gpt-oss-120b',
        allow_patterns=['original/*'],
        local_dir='gpt-oss-120b/',
        local_dir_use_symlinks=False
    )
    print('✅ Model download completed!')
except Exception as e:
    print(f'❌ Download failed: {e}')
    exit(1)
"@
    
    $pythonScript | python
}

# Install GPT-OSS Python package
Write-Host "📦 Installing GPT-OSS Python package..." -ForegroundColor Yellow
pip install gpt-oss

# Verify installation
Write-Host "🔍 Verifying installation..." -ForegroundColor Yellow
if (Test-Path "gpt-oss-120b/original") {
    Write-Host "✅ Model files downloaded successfully" -ForegroundColor Green
    Get-ChildItem "gpt-oss-120b/original" | Format-Table Name, Length, LastWriteTime
} else {
    Write-Host "❌ Model download may have failed - directory not found" -ForegroundColor Red
    exit 1
}

# Test GPT-OSS installation
Write-Host "🧪 Testing GPT-OSS installation..." -ForegroundColor Yellow
$testScript = @"
try:
    import gpt_oss
    print('✅ GPT-OSS Python package installed successfully')
except ImportError as e:
    print(f'❌ GPT-OSS import failed: {e}')
    exit(1)
"@

$testScript | python

# Create environment file template
Write-Host "📝 Creating environment configuration..." -ForegroundColor Yellow
$envContent = @"
# GPT-OSS-120B Configuration
GPT_OSS_MODEL_PATH=./gpt-oss-120b/original
GPT_OSS_GPU_LAYERS=50
GPT_OSS_THREADS=8
GPT_OSS_CONTEXT_LENGTH=8192
GPT_OSS_MAX_TOKENS=2048
GPT_OSS_TEMPERATURE=0.1
"@

$envContent | Out-File -FilePath ".env.gpt-oss" -Encoding UTF8

Write-Host "✅ GPT-OSS-120B installation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Add the following to your .env file:" -ForegroundColor White
Write-Host "   GPT_OSS_MODEL_PATH=./gpt-oss-120b/original" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Adjust GPU layers based on your hardware:" -ForegroundColor White
Write-Host "   - RTX 4090: GPT_OSS_GPU_LAYERS=50-60" -ForegroundColor Gray
Write-Host "   - RTX 3090: GPT_OSS_GPU_LAYERS=40-50" -ForegroundColor Gray
Write-Host "   - RTX 3080: GPT_OSS_GPU_LAYERS=30-40" -ForegroundColor Gray
Write-Host "   - CPU only: GPT_OSS_GPU_LAYERS=0" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the installation:" -ForegroundColor White
Write-Host "   npm run test:gpt-oss" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Use GPT-OSS in your Synapse AI flows!" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Note: This model requires significant computational resources." -ForegroundColor Yellow
Write-Host "   Recommended: 24GB+ VRAM for optimal performance" -ForegroundColor Yellow
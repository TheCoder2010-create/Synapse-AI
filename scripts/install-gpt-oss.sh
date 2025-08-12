#!/bin/bash

# GPT-OSS-120B Installation Script for Synapse AI
# This script downloads and sets up the GPT-OSS-120B model

set -e

echo "🚀 Installing GPT-OSS-120B for Synapse AI..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed. Please install pip3 first."
    exit 1
fi

# Create model directory
echo "📁 Creating model directory..."
mkdir -p gpt-oss-120b

# Install Hugging Face CLI if not already installed
echo "📦 Installing Hugging Face CLI..."
pip3 install --upgrade huggingface_hub

# Check if huggingface-cli is available
if ! command -v huggingface-cli &> /dev/null; then
    echo "⚠️  huggingface-cli not found in PATH. Trying alternative installation..."
    python3 -m pip install --upgrade huggingface_hub[cli]
fi

# Download GPT-OSS-120B model
echo "⬇️  Downloading GPT-OSS-120B model (this may take a while)..."
echo "📊 Model size: ~240GB - ensure you have sufficient disk space"

# Use huggingface-cli to download
if command -v huggingface-cli &> /dev/null; then
    huggingface-cli download openai/gpt-oss-120b --include "original/*" --local-dir gpt-oss-120b/
else
    # Fallback to Python script
    python3 -c "
from huggingface_hub import snapshot_download
import os

print('Downloading GPT-OSS-120B model...')
snapshot_download(
    repo_id='openai/gpt-oss-120b',
    allow_patterns=['original/*'],
    local_dir='gpt-oss-120b/',
    local_dir_use_symlinks=False
)
print('✅ Model download completed!')
"
fi

# Install GPT-OSS Python package
echo "📦 Installing GPT-OSS Python package..."
pip3 install gpt-oss

# Verify installation
echo "🔍 Verifying installation..."
if [ -d "gpt-oss-120b/original" ]; then
    echo "✅ Model files downloaded successfully"
    ls -la gpt-oss-120b/original/
else
    echo "❌ Model download may have failed - directory not found"
    exit 1
fi

# Test GPT-OSS installation
echo "🧪 Testing GPT-OSS installation..."
python3 -c "
try:
    import gpt_oss
    print('✅ GPT-OSS Python package installed successfully')
except ImportError as e:
    print(f'❌ GPT-OSS import failed: {e}')
    exit(1)
"

# Create environment file template
echo "📝 Creating environment configuration..."
cat > .env.gpt-oss << EOF
# GPT-OSS-120B Configuration
GPT_OSS_MODEL_PATH=./gpt-oss-120b/original
GPT_OSS_GPU_LAYERS=50
GPT_OSS_THREADS=8
GPT_OSS_CONTEXT_LENGTH=8192
GPT_OSS_MAX_TOKENS=2048
GPT_OSS_TEMPERATURE=0.1
EOF

echo "✅ GPT-OSS-120B installation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Add the following to your .env file:"
echo "   GPT_OSS_MODEL_PATH=./gpt-oss-120b/original"
echo ""
echo "2. Adjust GPU layers based on your hardware:"
echo "   - RTX 4090: GPT_OSS_GPU_LAYERS=50-60"
echo "   - RTX 3090: GPT_OSS_GPU_LAYERS=40-50"
echo "   - RTX 3080: GPT_OSS_GPU_LAYERS=30-40"
echo "   - CPU only: GPT_OSS_GPU_LAYERS=0"
echo ""
echo "3. Test the installation:"
echo "   npm run test:gpt-oss"
echo ""
echo "4. Use GPT-OSS in your Synapse AI flows!"
echo ""
echo "⚠️  Note: This model requires significant computational resources."
echo "   Recommended: 24GB+ VRAM for optimal performance"
#!/bin/bash

echo "🚀 AmiBuddy - Installation & Setup"
echo "=================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Voice features may not work without API keys."
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Installation failed!"
    exit 1
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎯 What's been fixed:"
echo "   ✅ Camera access (use Upload button on simulator)"
echo "   ✅ Voice features (with your API keys)"
echo "   ✅ Full Mac file system access"
echo "   ✅ Child-friendly colorful design"
echo ""
echo "📱 To start the app:"
echo "   npm start"
echo ""
echo "   Then press 'i' for iOS simulator"
echo "   or run: npm run ios"
echo ""
echo "💡 Tips:"
echo "   - On simulator, use the green Upload button to access Mac files"
echo "   - Camera won't work on simulator (this is normal)"
echo "   - Voice needs valid ElevenLabs API keys in .env"
echo ""
echo "📖 Read QUICK_START.md for detailed instructions"
echo ""

#!/bin/bash

echo "🔄 Restarting AmiBuddy with clean cache..."
echo ""

# Kill any running Metro bundler
echo "Stopping Metro bundler..."
pkill -f "react-native" || true
pkill -f "metro" || true

# Clear Metro cache
echo "Clearing Metro cache..."
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*

# Clear watchman
if command -v watchman &> /dev/null; then
    echo "Clearing watchman..."
    watchman watch-del-all
fi

echo ""
echo "✅ Cache cleared!"
echo ""
echo "Starting app..."
npm start -- --reset-cache

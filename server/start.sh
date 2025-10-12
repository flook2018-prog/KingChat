#!/bin/bash
echo "🚀 Starting KingChat Server..."
echo "📂 Current directory: $(pwd)"
echo "📋 Files in directory:"
ls -la

echo "🔧 Starting Node.js server..."
node server-simple.js
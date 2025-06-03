#!/bin/zsh

echo "🧼 Removing node_modules, build artifacts, and lockfile..."
rm -rf node_modules package-lock.json .next .netlify

echo "🧽 Cleaning npm cache..."
npm cache clean --force

echo "📦 Reinstalling clean, native macOS dependencies..."
npm install

echo "✅ Node reset complete. You can now run ./start-dev.zsh"
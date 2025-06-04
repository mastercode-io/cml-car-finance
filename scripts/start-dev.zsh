#!/bin/zsh

echo "🛑 Killing stale dev processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "netlify dev" 2>/dev/null || true
rm -rf .next
echo "🚀 Starting Netlify dev server..."
netlify dev
#!/bin/zsh

echo "🔨 Building Netlify functions..."
netlify functions:build

echo "🚀 Starting Netlify proxy server..."
netlify dev
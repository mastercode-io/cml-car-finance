#!/bin/zsh

echo "🔧 Staging all changes..."
git add .

echo "💬 Enter your commit message:"
read msg

if [[ -z "$msg" ]]; then
  echo "❌ Commit message cannot be empty. Aborting."
  exit 1
fi

echo "✅ Committing..."
git commit -m "$msg"

echo "🚀 Pushing to origin..."
git push

echo "✅ Done."
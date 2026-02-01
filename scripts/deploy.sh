#!/bin/bash

# Evidence Property Manager Deploy Script

echo "Evidence Property Manager - Deploy to Vercel"
echo "==========================================="

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them first."
    git status -s
    exit 1
fi

# Check if we're on master branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "master" ]; then
    echo "⚠️  Warning: You're on branch '$BRANCH', not 'master'."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Determine version bump type
BUMP_TYPE="${1:-patch}"
if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo "❌ Error: Invalid bump type. Use: major, minor, or patch"
    exit 1
fi

# Bump version
echo "📦 Bumping version ($BUMP_TYPE)..."
node scripts/bump-version.js $BUMP_TYPE

# Get the new version
NEW_VERSION=$(node -p "require('./package.json').version")

# Commit version bump
git add package.json
git commit -m "Bump version to $NEW_VERSION"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin $BRANCH

echo "✅ Successfully pushed version $NEW_VERSION to GitHub!"
echo ""
echo "🌐 Vercel should automatically deploy from the GitHub push."
echo "   Check deployment status at: https://vercel.com/dashboard"
echo ""
echo "📝 Version History:"
git log --oneline -5
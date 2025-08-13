#!/bin/bash

# Deploy Synapse AI to GitHub Repository
# Usage: ./scripts/deploy-to-github.sh <username> [repo-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Check if username is provided
if [ $# -eq 0 ]; then
    print_color $RED "❌ Error: GitHub username is required"
    echo "Usage: $0 <username> [repo-name]"
    echo "Example: $0 yourusername synapse-ai"
    exit 1
fi

USERNAME=$1
REPO_NAME=${2:-synapse-ai}

print_color $GREEN "🚀 Deploying Synapse AI to GitHub..."
echo

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_color $RED "❌ Git repository not initialized. Please run 'git init' first."
    exit 1
fi

# Check if there are any commits
if ! git log --oneline -1 >/dev/null 2>&1; then
    print_color $RED "❌ No commits found. Please commit your changes first."
    exit 1
fi

# Construct GitHub URL
GITHUB_URL="https://github.com/$USERNAME/$REPO_NAME.git"

print_color $CYAN "📋 Repository Details:"
print_color $WHITE "   Username: $USERNAME"
print_color $WHITE "   Repository: $REPO_NAME"
print_color $WHITE "   URL: $GITHUB_URL"
echo

# Check if remote already exists
if EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null); then
    print_color $YELLOW "⚠️  Remote 'origin' already exists: $EXISTING_REMOTE"
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_color $YELLOW "🔄 Updating remote origin..."
        git remote set-url origin "$GITHUB_URL"
    else
        print_color $RED "❌ Deployment cancelled."
        exit 1
    fi
else
    print_color $YELLOW "🔗 Adding remote origin..."
    git remote add origin "$GITHUB_URL"
fi

# Verify remote
print_color $GREEN "✅ Remote configured:"
git remote -v

echo
print_color $YELLOW "📤 Pushing to GitHub..."

# Push to GitHub
if git push -u origin master; then
    echo
    print_color $GREEN "🎉 Successfully deployed to GitHub!"
    echo
    print_color $CYAN "🔗 Your repository is now available at:"
    print_color $WHITE "   https://github.com/$USERNAME/$REPO_NAME"
    echo
    print_color $CYAN "📋 Next steps:"
    print_color $WHITE "   1. Visit your repository on GitHub"
    print_color $WHITE "   2. Add repository description and topics"
    print_color $WHITE "   3. Enable GitHub Pages for documentation"
    print_color $WHITE "   4. Set up branch protection rules"
    print_color $WHITE "   5. Create your first release"
else
    echo
    print_color $RED "❌ Failed to push to GitHub."
    print_color $YELLOW "   This might be because:"
    print_color $WHITE "   1. The repository doesn't exist on GitHub yet"
    print_color $WHITE "   2. You don't have push permissions"
    print_color $WHITE "   3. Authentication failed"
    echo
    print_color $CYAN "💡 Please:"
    print_color $WHITE "   1. Create the repository on GitHub first"
    print_color $WHITE "   2. Make sure you're authenticated (git config user.name/user.email)"
    print_color $WHITE "   3. Try running: git push -u origin master"
    
    exit 1
fi

echo
print_color $GREEN "🚀 Deployment completed successfully!"
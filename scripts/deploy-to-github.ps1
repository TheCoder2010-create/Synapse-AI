#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Deploy Synapse AI to GitHub Repository

.DESCRIPTION
    This script helps you deploy your Synapse AI codebase to GitHub.
    It will guide you through the process of creating a remote and pushing your code.

.PARAMETER Username
    Your GitHub username

.PARAMETER RepoName
    Repository name (default: synapse-ai)

.EXAMPLE
    .\scripts\deploy-to-github.ps1 -Username "yourusername"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$false)]
    [string]$RepoName = "synapse-ai"
)

Write-Host "🚀 Deploying Synapse AI to GitHub..." -ForegroundColor Green
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git repository not initialized. Please run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check if there are any commits
try {
    git log --oneline -1 | Out-Null
} catch {
    Write-Host "❌ No commits found. Please commit your changes first." -ForegroundColor Red
    exit 1
}

# Construct GitHub URL
$githubUrl = "https://github.com/$Username/$RepoName.git"

Write-Host "📋 Repository Details:" -ForegroundColor Cyan
Write-Host "   Username: $Username" -ForegroundColor White
Write-Host "   Repository: $RepoName" -ForegroundColor White
Write-Host "   URL: $githubUrl" -ForegroundColor White
Write-Host ""

# Check if remote already exists
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "⚠️  Remote 'origin' already exists: $existingRemote" -ForegroundColor Yellow
    $response = Read-Host "Do you want to update it? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "🔄 Updating remote origin..." -ForegroundColor Yellow
        git remote set-url origin $githubUrl
    } else {
        Write-Host "❌ Deployment cancelled." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "🔗 Adding remote origin..." -ForegroundColor Yellow
    git remote add origin $githubUrl
}

# Verify remote
Write-Host "✅ Remote configured:" -ForegroundColor Green
git remote -v

Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow

# Push to GitHub
try {
    git push -u origin master
    Write-Host ""
    Write-Host "🎉 Successfully deployed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Your repository is now available at:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$Username/$RepoName" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Visit your repository on GitHub" -ForegroundColor White
    Write-Host "   2. Add repository description and topics" -ForegroundColor White
    Write-Host "   3. Enable GitHub Pages for documentation" -ForegroundColor White
    Write-Host "   4. Set up branch protection rules" -ForegroundColor White
    Write-Host "   5. Create your first release" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Failed to push to GitHub." -ForegroundColor Red
    Write-Host "   This might be because:" -ForegroundColor Yellow
    Write-Host "   1. The repository doesn't exist on GitHub yet" -ForegroundColor White
    Write-Host "   2. You don't have push permissions" -ForegroundColor White
    Write-Host "   3. Authentication failed" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Please:" -ForegroundColor Cyan
    Write-Host "   1. Create the repository on GitHub first" -ForegroundColor White
    Write-Host "   2. Make sure you're authenticated (git config user.name/user.email)" -ForegroundColor White
    Write-Host "   3. Try running: git push -u origin master" -ForegroundColor White
    
    exit 1
}

Write-Host ""
Write-Host "🚀 Deployment completed successfully!" -ForegroundColor Green
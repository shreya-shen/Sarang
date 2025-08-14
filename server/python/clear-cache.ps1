#!/usr/bin/env powershell
# AI Model Cache Cleaner Script
# Clears all cached AI models to free up disk space

Write-Host "🧹 AI Model Cache Cleaner" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Function to get directory size
function Get-DirectorySize($path) {
    if (Test-Path $path) {
        $size = (Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        return [math]::Round($size / 1GB, 2)
    }
    return 0
}

# Check current cache sizes
Write-Host "`n📊 Current Cache Sizes:" -ForegroundColor Yellow

$huggingfaceSize = Get-DirectorySize "$env:USERPROFILE\.cache\huggingface"
$torchSize = Get-DirectorySize "$env:USERPROFILE\.cache\torch"
$spacySize = Get-DirectorySize "$env:USERPROFILE\.cache\spacy"
$pipSize = Get-DirectorySize "$env:USERPROFILE\.cache\pip"

Write-Host "   🤖 Hugging Face: $huggingfaceSize GB" -ForegroundColor White
Write-Host "   🔥 PyTorch: $torchSize GB" -ForegroundColor White
Write-Host "   🧠 spaCy: $spacySize GB" -ForegroundColor White
Write-Host "   📦 pip: $pipSize GB" -ForegroundColor White

$totalSize = $huggingfaceSize + $torchSize + $spacySize + $pipSize
Write-Host "   📈 Total: $totalSize GB" -ForegroundColor Green

# Ask for confirmation
Write-Host "`n⚠️  Warning: This will delete all cached AI models!" -ForegroundColor Red
Write-Host "You'll need to re-download models on next use (slow startup)" -ForegroundColor Yellow
$confirm = Read-Host "`nProceed? (y/N)"

if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    Write-Host "`n🧹 Clearing caches..." -ForegroundColor Cyan
    
    # Clear Hugging Face cache
    if (Test-Path "$env:USERPROFILE\.cache\huggingface") {
        Remove-Item -Path "$env:USERPROFILE\.cache\huggingface" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Cleared Hugging Face cache ($huggingfaceSize GB freed)" -ForegroundColor Green
    }
    
    # Clear PyTorch cache
    if (Test-Path "$env:USERPROFILE\.cache\torch") {
        Remove-Item -Path "$env:USERPROFILE\.cache\torch" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Cleared PyTorch cache ($torchSize GB freed)" -ForegroundColor Green
    }
    
    # Clear spaCy cache
    if (Test-Path "$env:USERPROFILE\.cache\spacy") {
        Remove-Item -Path "$env:USERPROFILE\.cache\spacy" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Cleared spaCy cache ($spacySize GB freed)" -ForegroundColor Green
    }
    
    # Clear pip cache
    if (Test-Path "$env:USERPROFILE\.cache\pip") {
        Remove-Item -Path "$env:USERPROFILE\.cache\pip" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Cleared pip cache ($pipSize GB freed)" -ForegroundColor Green
    }
    
    Write-Host "`n🎉 Cache clearing complete!" -ForegroundColor Green
    Write-Host "💾 Approximately $totalSize GB of disk space freed" -ForegroundColor Green
    Write-Host "`n💡 Note: First startup after clearing will be slower" -ForegroundColor Yellow
    Write-Host "   Models will be re-downloaded automatically" -ForegroundColor Yellow
    
} else {
    Write-Host "`n❌ Cache clearing cancelled" -ForegroundColor Red
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

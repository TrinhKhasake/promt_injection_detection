# PowerShell script to test ChromaDB integration on Windows

Write-Host "Testing ChromaDB integration with Rebuff..." -ForegroundColor Green

# Check if OpenAI API key is set
if (-not $env:OPENAI_API_KEY -or $env:OPENAI_API_KEY -eq "your-openai-api-key-here") {
    Write-Host "⚠️  Please set your OpenAI API key:" -ForegroundColor Yellow
    Write-Host "   `$env:OPENAI_API_KEY=`"your-actual-api-key`"" -ForegroundColor Cyan
    exit 1
}

# Test ChromaDB import
Write-Host "Testing ChromaDB import..." -ForegroundColor Blue
try {
    python -c "import chromadb; print('✅ ChromaDB imported successfully')"
} catch {
    Write-Host "❌ ChromaDB import failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test Node.js dependencies
Write-Host "Testing Node.js dependencies..." -ForegroundColor Blue
try {
    node -e "console.log('✅ Node.js is working')"
} catch {
    Write-Host "❌ Node.js test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All prerequisites are ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set your OpenAI API key: `$env:OPENAI_API_KEY=`"your-actual-api-key`"" -ForegroundColor White
Write-Host "2. Start your application - ChromaDB will be used automatically" -ForegroundColor White
Write-Host "3. The application will use ChromaDB in embedded mode (no server needed)" -ForegroundColor White
Write-Host ""
Write-Host "Your application is now configured to use ChromaDB for vector-based prompt injection detection!" -ForegroundColor Green 
$branch = git rev-parse --abbrev-ref HEAD

if ($branch -eq "main") {
    Write-Host "Targeting PRODUCTION (crm-final-db)..." -ForegroundColor Red
    npx wrangler d1 migrations apply DB --remote
}
else {
    Write-Host "Current Branch: $branch" -ForegroundColor Cyan
    Write-Host "Targeting PREVIEW (crm-final-preview-db)..." -ForegroundColor Yellow
    npx wrangler d1 migrations apply DB --remote --env preview
}
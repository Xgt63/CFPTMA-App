# Script de verification de l'utilisation de 'eval' comme variable

Write-Host ""
Write-Host "VERIFICATION DE L'UTILISATION DE 'eval'" -ForegroundColor Cyan
$separator = "=" * 60
Write-Host $separator -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceFiles = Get-ChildItem -Path $projectRoot -Include "*.js","*.jsx","*.ts","*.tsx" -Recurse -File | Where-Object { 
    $_.FullName -notlike "*node_modules*" -and 
    $_.FullName -notlike "*dist\*" -and 
    $_.FullName -notlike "*dist-electron*" 
}

Write-Host ""
Write-Host "Analyse de $($sourceFiles.Count) fichiers..." -ForegroundColor Yellow

# Rechercher les patterns problematiques
$patterns = @(
    @{ Pattern = "\beval\s*=>"; Description = "Arrow function avec eval comme parametre" },
    @{ Pattern = "function\s*\([^)]*\beval\b[^)]*\)"; Description = "Fonction avec eval comme parametre" },
    @{ Pattern = "\bconst\s+eval\b|\blet\s+eval\b|\bvar\s+eval\b"; Description = "Declaration de variable eval" }
)

$errors = @()

foreach ($pattern in $patterns) {
    Write-Host ""
    Write-Host "Recherche : $($pattern.Description)" -ForegroundColor Gray
    
    $matches = $sourceFiles | Select-String -Pattern $pattern.Pattern -CaseSensitive
    
    if ($matches) {
        Write-Host "  ERREUR: Trouve $($matches.Count) occurrence(s)" -ForegroundColor Red
        
        foreach ($match in $matches) {
            $relativePath = $match.Path.Replace($projectRoot, "").TrimStart('\\')
            $error = [PSCustomObject]@{
                File = $relativePath
                Line = $match.LineNumber
                Content = $match.Line.Trim()
                Pattern = $pattern.Description
            }
            $errors += $error
            
            $line = "    $relativePath ligne $($match.LineNumber)"
            Write-Host $line -ForegroundColor Yellow
            Write-Host "       $($match.Line.Trim())" -ForegroundColor Gray
        }
    } else {
        Write-Host "  OK: Aucune occurrence" -ForegroundColor Green
    }
}

# Resume
Write-Host ""
Write-Host $separator -ForegroundColor Cyan
Write-Host "RESUME" -ForegroundColor Cyan
Write-Host $separator -ForegroundColor Cyan

if ($errors.Count -eq 0) {
    Write-Host ""
    Write-Host "SUCCES : Aucune utilisation problematique de 'eval' detectee" -ForegroundColor Green
    Write-Host "Le code est conforme aux bonnes pratiques JavaScript" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host ""
    Write-Host "ERREUR : $($errors.Count) occurrence(s) problematique(s) detectee(s)" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "Liste des fichiers a corriger :" -ForegroundColor Yellow
    $errors | Group-Object File | ForEach-Object {
        Write-Host "  - $($_.Name) ($($_.Count) occurrence(s))" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Recommandations :" -ForegroundColor Cyan
    Write-Host "  1. Remplacez 'eval' par 'evaluation', 'item', ou 'entry'" -ForegroundColor White
    Write-Host "  2. Consultez CORRECTIONS_EVAL.md pour des exemples" -ForegroundColor White
    Write-Host "  3. Relancez ce script apres correction" -ForegroundColor White
    Write-Host ""
    
    exit 1
}

Write-Host ""

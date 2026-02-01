#!/usr/bin/env powershell

# 🚀 SCRIPT RAPIDE - BUILD & TEST ECRAN BLANC FIX

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 CFPT Manager - Build & Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: package.json non trouvé!" -ForegroundColor Red
    Write-Host "   Assurez-vous de lancer ce script depuis c:\Users\mada-\Documents\app" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Options disponibles:" -ForegroundColor Yellow
Write-Host "  1. Vérifier la structure (dist/index.html)" -ForegroundColor Cyan
Write-Host "  2. Build Vite (frontend)" -ForegroundColor Cyan
Write-Host "  3. Test production (npm run electron)" -ForegroundColor Cyan
Write-Host "  4. Build complet pour exe" -ForegroundColor Cyan
Write-Host "  5. Nettoyer et rebuild complet" -ForegroundColor Cyan
Write-Host "  6. Lancer tous les tests (2→3→4)" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Choisissez une option (1-6)"

function Check-DistStructure {
    Write-Host ""
    Write-Host "📁 Vérification de la structure dist/..." -ForegroundColor Yellow
    
    if (Test-Path "dist/index.html") {
        Write-Host "✅ dist/index.html existe" -ForegroundColor Green
        
        if (Test-Path "dist/assets") {
            Write-Host "✅ dist/assets existe" -ForegroundColor Green
            $assetCount = (Get-ChildItem -Path "dist/assets" -Recurse | Measure-Object).Count
            Write-Host "   └─ $assetCount fichiers" -ForegroundColor Green
        } else {
            Write-Host "⚠️  dist/assets NOT FOUND" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ dist/index.html NOT FOUND" -ForegroundColor Red
        Write-Host "   Exécutez: npm run build" -ForegroundColor Yellow
    }
}

function Build-Vite {
    Write-Host ""
    Write-Host "🔨 Build Vite (frontend)..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build réussi!" -ForegroundColor Green
        Check-DistStructure
    } else {
        Write-Host "❌ Build échoué!" -ForegroundColor Red
    }
}

function Test-Production {
    Write-Host ""
    Write-Host "🧪 Test production (mode Electron sans Vite dev server)..." -ForegroundColor Yellow
    Write-Host "   Instructions:" -ForegroundColor Cyan
    Write-Host "   - La fenêtre doit s'ouvrir" -ForegroundColor Cyan
    Write-Host "   - L'interface doit s'afficher (pas d'écran blanc)" -ForegroundColor Cyan
    Write-Host "   - Appuyez F12 pour voir les logs" -ForegroundColor Cyan
    Write-Host "   - Appuyez Ctrl+Q pour quitter" -ForegroundColor Cyan
    Write-Host ""
    npm run electron
}

function Build-Exe {
    Write-Host ""
    Write-Host "📦 Build complet pour .exe..." -ForegroundColor Yellow
    Write-Host "   (Build Vite + Electron Builder)" -ForegroundColor Cyan
    Write-Host ""
    npm run dist-win
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Exe généré!" -ForegroundColor Green
        Write-Host "   📁 Dossier: dist-electron/" -ForegroundColor Green
        $exeFile = Get-ChildItem -Path "dist-electron" -Filter "*.exe" | Select-Object -First 1
        if ($exeFile) {
            Write-Host "   📦 Fichier: $($exeFile.Name)" -ForegroundColor Green
            Write-Host "   📊 Taille: $([math]::Round($exeFile.Length / 1MB, 2)) MB" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Build échoué!" -ForegroundColor Red
    }
}

function Clean-Rebuild {
    Write-Host ""
    Write-Host "🧹 Nettoyage complet..." -ForegroundColor Yellow
    
    if (Test-Path "dist") {
        Remove-Item -Path "dist" -Recurse -Force
        Write-Host "✅ dist/ supprimé" -ForegroundColor Green
    }
    
    if (Test-Path "dist-electron") {
        Remove-Item -Path "dist-electron" -Recurse -Force
        Write-Host "✅ dist-electron/ supprimé" -ForegroundColor Green
    }
    
    if (Test-Path "node_modules") {
        Write-Host "⏳ Suppression de node_modules... (peut prendre du temps)" -ForegroundColor Yellow
        Remove-Item -Path "node_modules" -Recurse -Force
        Write-Host "✅ node_modules/ supprimé" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📥 npm install..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Installation complète!" -ForegroundColor Green
        Write-Host ""
        Build-Vite
        Write-Host ""
        Build-Exe
    } else {
        Write-Host "❌ Installation échouée!" -ForegroundColor Red
    }
}

function Run-All-Tests {
    Build-Vite
    Write-Host ""
    Write-Host "---" -ForegroundColor Gray
    Write-Host ""
    Test-Production
}

# Exécuter selon le choix
switch ($choice) {
    "1" { Check-DistStructure }
    "2" { Build-Vite }
    "3" { Test-Production }
    "4" { Build-Exe }
    "5" { Clean-Rebuild }
    "6" { Run-All-Tests }
    default { Write-Host "❌ Option invalide" -ForegroundColor Red }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Terminé" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

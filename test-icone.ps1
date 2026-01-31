# 🎨 Script de test de l'icône CFPT
# Ce script vérifie et lance l'application pour tester l'icône

Write-Host "`n🎨 TEST DE L'ICÔNE CFPT" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# 1. Vérifier les fichiers d'icône
Write-Host "`n📁 Vérification des fichiers d'icône..." -ForegroundColor Yellow

$icones = @(
    "assets\icon.ico",
    "build\icon.ico"
)

foreach ($icone in $icones) {
    if (Test-Path $icone) {
        $size = (Get-Item $icone).Length
        Write-Host "  ✅ $icone ($size octets)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $icone (non trouvé)" -ForegroundColor Red
    }
}

# 2. Vérifier l'exécutable compilé
Write-Host "`n📦 Vérification de l'exécutable compilé..." -ForegroundColor Yellow

$exePath = "dist-electron-final-02\win-unpacked\CFTP - Système de gestion des évaluations.exe"

if (Test-Path $exePath) {
    $exe = Get-Item $exePath
    Write-Host "  ✅ Exécutable trouvé" -ForegroundColor Green
    Write-Host "     Taille: $($exe.Length) octets" -ForegroundColor Gray
    Write-Host "     Date: $($exe.LastWriteTime)" -ForegroundColor Gray
    
    # Proposer de lancer l'application
    Write-Host "`n🚀 Options:" -ForegroundColor Cyan
    Write-Host "  1. Lancer l'application compilée (avec icône CFPT)" -ForegroundColor White
    Write-Host "  2. Recompiler l'application" -ForegroundColor White
    Write-Host "  3. Lancer en mode développement (icône par défaut)" -ForegroundColor White
    Write-Host "  4. Quitter" -ForegroundColor White
    
    $choix = Read-Host "`nVotre choix"
    
    switch ($choix) {
        "1" {
            Write-Host "`n🚀 Lancement de l'application compilée..." -ForegroundColor Green
            Write-Host "   → L'icône CFPT devrait être visible dans la barre des tâches" -ForegroundColor Yellow
            Start-Process $exePath
        }
        "2" {
            Write-Host "`n🔨 Recompilation de l'application..." -ForegroundColor Green
            Write-Host "   Cette opération peut prendre 2-3 minutes..." -ForegroundColor Yellow
            npm run dist-win
            Write-Host "`n✅ Compilation terminée!" -ForegroundColor Green
            Write-Host "   Relancez ce script pour tester l'icône" -ForegroundColor Yellow
        }
        "3" {
            Write-Host "`n🔧 Lancement en mode développement..." -ForegroundColor Green
            Write-Host "   ⚠️  L'icône par défaut d'Electron sera affichée (comportement normal)" -ForegroundColor Yellow
            npm run electron-dev
        }
        "4" {
            Write-Host "`n👋 Au revoir!" -ForegroundColor Cyan
            exit
        }
        default {
            Write-Host "`n❌ Choix invalide" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ❌ Exécutable non trouvé" -ForegroundColor Red
    Write-Host "     Chemin: $exePath" -ForegroundColor Gray
    Write-Host "`n💡 Solution:" -ForegroundColor Yellow
    Write-Host "   Compilez l'application avec: npm run dist-win" -ForegroundColor White
    
    $compile = Read-Host "`nVoulez-vous compiler maintenant? (o/n)"
    if ($compile -eq "o" -or $compile -eq "O") {
        Write-Host "`n🔨 Compilation en cours..." -ForegroundColor Green
        npm run dist-win
    }
}

Write-Host "`n" -NoNewline

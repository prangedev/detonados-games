@echo off
setlocal
title Detonados Games
cd /d "%~dp0"

echo ============================================================
echo   DETONADOS GAMES - Inicializador local
echo ============================================================
echo.
echo Este script vai verificar Node.js, dependencias e o banco de
echo dados automaticamente, instalando/atualizando o que faltar,
echo e depois iniciar o Backend + Banco de Dados + Frontend.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\windows\bootstrap.ps1"

echo.
echo ============================================================
echo   Encerrado.
echo ============================================================
pause
endlocal

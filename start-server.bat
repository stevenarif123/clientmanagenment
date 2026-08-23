@echo off
title ClientHub - Local Server
cd /d "%~dp0"
echo ==================================================
echo   Starting ClientHub Unified Server on http://localhost:8000
echo ==================================================
php -S localhost:8000 router.php
pause

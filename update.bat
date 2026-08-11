@echo off
title Git Update

git fetch origin

if errorlevel 1 (
    echo Fetch gagal!
    pause
    exit /b 1
)

git checkout main

if errorlevel 1 (
    echo Checkout main gagal!
    pause
    exit /b 1
)

git pull origin main

if errorlevel 1 (
    echo Pull gagal! Cek local changes atau conflict.
    pause
    exit /b 1
)

echo.
echo Update main berhasil!
pause
@echo off
setlocal

title Git Push

echo ========================================
echo              GIT PUSH
echo ========================================
echo.

for /f "delims=" %%b in ('git branch --show-current') do set "BRANCH=%%b"

echo Branch aktif: %BRANCH%
echo.

if "%BRANCH%"=="main" (
    echo ========================================
    echo [REJECTED]
    echo Tidak boleh push langsung ke main!
    echo ========================================
    pause
    exit /b 1
)

echo [1/3] Adding changes...
git add .

echo.
echo ========================================
echo File yang akan di-commit:
echo ========================================
git status --short
echo.

set /p "COMMIT_MSG=Commit message: "

if "%COMMIT_MSG%"=="" (
    echo.
    echo [ERROR] Commit message tidak boleh kosong!
    pause
    exit /b 1
)

echo.
echo [2/3] Committing...
git commit -m "%COMMIT_MSG%"

if errorlevel 1 (
    echo.
    echo [ERROR] Commit gagal!
    pause
    exit /b 1
)

echo.
echo [3/3] Pushing origin/%BRANCH%...
git push origin %BRANCH%

if errorlevel 1 (
    echo.
    echo [ERROR] Push gagal!
    pause
    exit /b 1
)

echo.
echo ========================================
echo          PUSH BERHASIL!
echo.
echo Branch : %BRANCH%
echo Commit : %COMMIT_MSG%
echo ========================================
pause
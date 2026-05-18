@echo off
setlocal

set JAVA_HOME=F:\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%
set MAVEN=C:\Users\54347\Documents\apache-maven-3.8.4\bin\mvn
set ROOT=%~dp0

echo.
echo ============================================================
echo  SAE - Build de produccion
echo ============================================================

:: 1. Build del frontend
echo.
echo [1/3] Compilando frontend...
cd /d "%ROOT%frontend"
call npm run build
if errorlevel 1 (
    echo.
    echo ERROR: Fallo el build del frontend.
    pause
    exit /b 1
)

:: 2. Copiar dist/ al backend (via PowerShell para evitar problemas con xcopy)
echo.
echo [2/3] Copiando frontend al backend...
powershell -NoProfile -Command ^
  "$src='%ROOT%frontend\dist'; $dst='%ROOT%backend\src\main\resources\static'; " ^
  "Get-ChildItem $dst -Exclude '.gitignore' | Remove-Item -Recurse -Force; " ^
  "Copy-Item $src\* $dst -Recurse -Force; " ^
  "Write-Host '    OK - copiado a backend\src\main\resources\static\'"

:: 3. Build del backend
echo.
echo [3/3] Compilando backend...
cd /d "%ROOT%backend"
call "%MAVEN%" clean package -s settings-local.xml -DskipTests
if errorlevel 1 (
    echo.
    echo ERROR: Fallo el build del backend.
    pause
    exit /b 1
)

:: 4. Armar paquete de instalacion para el cliente
echo.
echo [4/4] Armando paquete para el cliente...
set DIST=%ROOT%dist-cliente
if exist "%DIST%" rmdir /s /q "%DIST%"
mkdir "%DIST%"
copy /y "%ROOT%backend\target\sae-0.0.1-SNAPSHOT.jar" "%DIST%\sae.jar" >nul
copy /y "%ROOT%deploy\start-sae.vbs"   "%DIST%\start-sae.vbs"   >nul
copy /y "%ROOT%deploy\abrir-sae.vbs"   "%DIST%\abrir-sae.vbs"   >nul
copy /y "%ROOT%deploy\install.cmd"     "%DIST%\install.cmd"     >nul
copy /y "%ROOT%deploy\desinstalar.cmd" "%DIST%\desinstalar.cmd" >nul
echo     OK - carpeta dist-cliente\ lista

echo.
echo ============================================================
echo  Build completado con exito!
echo.
echo  Paquete para el cliente: dist-cliente\
echo    - Copiar esa carpeta a la PC del cliente
echo    - Ejecutar install.cmd como Administrador (una sola vez)
echo    - Listo: SAE arranca solo al encender la PC
echo ============================================================
echo.
pause

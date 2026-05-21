@echo off
:: Instalador de SAE - ejecutar UNA SOLA VEZ como Administrador

net session >nul 2>&1
if errorlevel 1 (
    echo ERROR: Ejecuta este script como Administrador.
    echo Click derecho sobre install.cmd -> "Ejecutar como administrador"
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  SAE - Instalacion
echo ============================================================

:: 1. Crear carpeta de instalacion
echo.
echo [1/4] Creando carpeta C:\SAE...
if not exist "C:\SAE" mkdir "C:\SAE"

:: 2. Copiar archivos
echo [2/4] Copiando archivos...
copy /y "%~dp0sae.jar" "C:\SAE\sae.jar"
if errorlevel 1 (
    echo ERROR: No se pudo copiar sae.jar. Verifica que el archivo existe en la misma carpeta que install.cmd.
    pause
    exit /b 1
)
copy /y "%~dp0start-sae.vbs" "C:\SAE\start-sae.vbs"
if errorlevel 1 (
    echo ERROR: No se pudo copiar start-sae.vbs.
    pause
    exit /b 1
)
copy /y "%~dp0abrir-sae.vbs" "C:\SAE\abrir-sae.vbs"
if errorlevel 1 (
    echo ERROR: No se pudo copiar abrir-sae.vbs.
    pause
    exit /b 1
)
echo     Copiando JRE (puede tardar unos segundos)...
xcopy /e /i /q "%~dp0jre" "C:\SAE\jre"
if errorlevel 1 (
    echo ERROR: No se pudo copiar el JRE.
    pause
    exit /b 1
)
echo     OK

:: 3. Registrar tarea en Task Scheduler (arranca el JAR al encender la PC)
echo [3/4] Registrando tarea de inicio automatico...
schtasks /delete /tn "SAE Taller" /f >nul 2>&1
schtasks /create /tn "SAE Taller" /tr "wscript.exe \"C:\SAE\start-sae.vbs\"" /sc onstart /ru "SYSTEM" /rl HIGHEST /f >nul
if errorlevel 1 (
    echo ERROR: No se pudo registrar la tarea. Verifica que ejecutaste como Administrador.
    pause
    exit /b 1
)
echo     OK

:: 4. Copiar el abre-browser a la carpeta Inicio de todos los usuarios
echo [4/4] Configurando apertura del browser al iniciar sesion...
set STARTUP=%ProgramData%\Microsoft\Windows\Start Menu\Programs\StartUp
copy /y "C:\SAE\abrir-sae.vbs" "%STARTUP%\abrir-sae.vbs" >nul
echo     OK

echo.
echo ============================================================
echo  Instalacion completada!
echo.
echo  - SAE arranca automaticamente cuando se enciende la PC
echo  - El browser se abre solo cuando el usuario inicia sesion
echo  - La aplicacion queda en: http://localhost:8080
echo.
echo  Para desinstalar: ejecuta desinstalar.cmd como Administrador
echo ============================================================
echo.
pause

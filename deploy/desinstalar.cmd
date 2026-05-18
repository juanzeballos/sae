@echo off
net session >nul 2>&1
if errorlevel 1 (
    echo ERROR: Ejecuta como Administrador.
    pause
    exit /b 1
)

echo Desinstalando SAE...

:: Detener el proceso si está corriendo
taskkill /f /im java.exe >nul 2>&1

:: Eliminar tarea del scheduler
schtasks /delete /tn "SAE Taller" /f >nul 2>&1

:: Eliminar el script de inicio del browser
del /q "%ProgramData%\Microsoft\Windows\Start Menu\Programs\StartUp\abrir-sae.vbs" >nul 2>&1

:: Eliminar archivos de instalacion
rmdir /s /q "C:\SAE" >nul 2>&1

echo Listo. SAE fue desinstalado.
pause

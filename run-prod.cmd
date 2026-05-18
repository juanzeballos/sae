@echo off
setlocal

set JAVA_HOME=F:\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%
set JAR=%~dp0backend\target\sae-0.0.1-SNAPSHOT.jar

if not exist "%JAR%" (
    echo ERROR: No se encontro el JAR. Ejecuta build.cmd primero.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  SAE - Sistema de Gestion para Taller
echo  Abriendo en: http://localhost:8080
echo  Para cerrar: Ctrl+C
echo ============================================================
echo.

start "" "http://localhost:8080"
java -jar "%JAR%"

' Inicia el JAR de SAE en segundo plano sin ventana visible.
' Este script lo ejecuta el Task Scheduler al arrancar Windows.
Set oShell = CreateObject("WScript.Shell")
' Fijamos el directorio de trabajo en C:\SAE para que la base SQLite
' (configurada como ruta relativa ./data/taller.db) quede en C:\SAE\data\
oShell.CurrentDirectory = "C:\SAE"
oShell.Run "C:\SAE\jre\bin\java.exe -jar C:\SAE\sae.jar", 0, False

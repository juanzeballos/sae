' Inicia el JAR de SAE en segundo plano sin ventana visible.
' Este script lo ejecuta el Task Scheduler al arrancar Windows.
Set oShell = CreateObject("WScript.Shell")
oShell.Run "java -jar C:\SAE\sae.jar", 0, False

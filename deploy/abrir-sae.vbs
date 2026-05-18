' Espera a que Spring Boot este listo y abre el browser.
' Este script va en la carpeta Inicio de Windows (se ejecuta al iniciar sesion).

Dim oHttp
Dim ready
Dim attempts

Set oHttp = CreateObject("WinHttp.WinHttpRequest.5.1")
ready = False
attempts = 0

' Polling: intenta conectarse cada 2 segundos, hasta 60 segundos
Do While Not ready And attempts < 30
    WScript.Sleep 2000
    attempts = attempts + 1
    On Error Resume Next
    oHttp.Open "GET", "http://localhost:8080", False
    oHttp.Send
    If Err.Number = 0 Then
        If oHttp.Status >= 200 And oHttp.Status < 500 Then
            ready = True
        End If
    End If
    Err.Clear
    On Error GoTo 0
Loop

If ready Then
    Dim oShell
    Set oShell = CreateObject("WScript.Shell")
    oShell.Run "http://localhost:8080", 1, False
End If

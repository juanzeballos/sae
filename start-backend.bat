@echo off
set JAVA_HOME=F:\jdk-17
cd /d F:\Proyectos\sae\backend
echo Starting backend...
C:\Users\54347\Documents\apache-maven-3.8.4\bin\mvn.cmd spring-boot:run -s settings-local.xml
pause

@echo off
set JAVA_HOME=F:\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%
call mvn spring-boot:run -s settings-local.xml

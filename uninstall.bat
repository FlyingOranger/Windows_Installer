@echo off
set baseDir=%localappdata%\FlyingOranger
set nodePath=%baseDir%\node
set startPath=%baseDir%\start.js


start /MIN /WAIT "" "%nodePath%" "%startPath%" uninstall

if exist "%appdata%\Microsoft\Windows\Start Menu\Programs\Flying Oranger" (

rmdir /S /Q "%appdata%\Microsoft\Windows\Start Menu\Programs\Flying Oranger"

)

cd ..
rmdir /S /Q %baseDir%
pause
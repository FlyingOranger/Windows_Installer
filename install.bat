@echo off

color 4F
echo.
echo REDDIT CAN FLY!
echo _______________
echo.

set baseDir=%localappdata%\RedditCanFly

if not exist %baseDir% (
MKDIR %baseDir%
)

echo Copying Files...
echo ________________
echo.
set fileName=dljava.js
echo f | xcopy /y %fileName% %baseDir%\%fileName%

set fileName=dlapp.js
echo f | xcopy /y %fileName% %baseDir%\%fileName%

set fileName=w_start.bat
echo f | xcopy /y %fileName% %baseDir%\%fileName%

set fileName=w_unzip.vbs
echo f | xcopy /y %fileName% %baseDir%\%fileName%

set fileName=license.txt
echo f | xcopy /y %fileName% %baseDir%\%fileName%

reg Query "HKLM\Hardware\Description\System\CentralProcessor\0" | find /i "x86" > NUL && set OS=x86 || set OS=x64

set nodeDownloadURL="https://nodejs.org/dist/v4.4.3/win-%OS%/node.exe"
set nodeFilePath=%baseDir%\node.exe

if not exist %nodeFilePath% (
echo.
echo _____________________________________
echo.
echo Downloading local version of Node.js
echo Please wait...
echo _____________________________________
echo.
start /WAIT /MIN dlnode.bat %nodeDownloadURL% "%nodeFilePath%"
)

cd "%baseDir%"

where java >nul 2>nul
if %errorlevel%==1 (
echo.
echo ______________________
echo.
echo Java is not installed. 
echo Downloading Java
echo.
echo _______________________
start /WAIT /MIN "" node dljava.js javainstaller.exe %OS%
start /WAIT javainstaller
)

where java >nul 2>nul
if %errorlevel%==1 (
echo.
echo _______________________________________________
echo.
echo ERROR! Still could not find Java.
echo Please re-run this installation of RedditCanFly 
echo and fully install Java.
echo _______________________________________________
exit 1
)

echo ______________________________________
echo.
echo Downloading Reddit Can Fly
echo ______________________________________
echo.

start /WAIT /MIN "" node dlapp.js install
start node RedditCanFly/start_scripts/windows_start.js

PAUSE

set baseDir=%localappdata%\RedditCanFly
set nodePath=%baseDir%\node
set dlPath=%baseDir%\dlapp.js
set startPath=%baseDir%\RedditCanFly\start_scripts\windows_start.js
"%nodePath%" "%dlPath%"
"%nodePath%" "%startPath%"
exit
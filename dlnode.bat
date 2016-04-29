@echo off
bitsadmin /create /DOWNLOAD redditcanfly
bitsadmin /transfer redditcanfly %1 %2
bitsadmin /complete redditcanfly
exit
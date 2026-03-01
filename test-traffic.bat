@echo off
echo Sending 200 requests to test Google Analytics...
for /L %%i in (1,1,200) do (
    curl -s -o nul "https://cafe-pibatie.onrender.com"
    if %%i %% 20 == 0 echo %%i requests sent...
)
echo Done! 200 requests sent.
pause

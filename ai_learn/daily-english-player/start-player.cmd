@echo off
cd /d "%~dp0"
echo AI English player is available on this computer at:
echo http://127.0.0.1:8765/
echo.
echo Other devices on the same LAN should use:
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /c:"IPv4"') do echo http://%%A:8765/
echo.
echo Keep this window open while using the player.
start "" "http://127.0.0.1:8765/"
python -m http.server 8765 --bind 0.0.0.0 --directory dist

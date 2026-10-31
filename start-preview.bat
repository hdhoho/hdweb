@echo off
cd /d "%~dp0dist"
start "內容卡片預覽" http://127.0.0.1:4173/
python -m http.server 4173

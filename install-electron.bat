@echo off
echo Instalando Electron...
set NODE_TLS_REJECT_UNAUTHORIZED=0
npm config set strict-ssl false
npm install --save-dev electron@32.0.0 --force
echo Electron instalado correctamente
pause
@echo off
echo Instalando dependencias...
npm install --save-dev electron-builder@24.13.3 --force

echo Construyendo para Steam...
npm run build-steam

echo Empaquetado completado en carpeta dist/
echo Sube el archivo .exe a Steam
pause
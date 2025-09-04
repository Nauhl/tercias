@echo off
echo Creando ejecutable...

REM Instalar dependencias si no existen
if not exist "node_modules\electron-builder" (
    echo Instalando electron-builder...
    set NODE_TLS_REJECT_UNAUTHORIZED=0
    npm install --save-dev electron-builder --force
)

REM Crear ejecutable
echo Generando .exe...
npx electron-builder --win --publish=never

echo.
echo Ejecutable creado en carpeta dist/
echo Coloca tu icono icon.ico en la carpeta assets/
pause
# 🃏 Juego de Cartas Online

Juego de cartas multijugador para 4 jugadores con sistema de puntuación y ranking.

## 🚀 Despliegue en Vercel

### Pasos para subir a Vercel:

1. **Crear cuenta en Vercel** (si no tienes)
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión con GitHub/Google

2. **Configurar Firebase** (necesario para multijugador):
   - Ve a [Firebase Console](https://console.firebase.google.com)
   - Crea un nuevo proyecto llamado "cartablas-game"
   - Habilita "Realtime Database"
   - En reglas de seguridad, pon:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   - Copia la configuración de Firebase

3. **Actualizar configuración**:
   - En `online.html`, reemplaza la configuración de Firebase con la tuya
   - Busca la línea: `const firebaseConfig = {`

4. **Subir a Vercel**:
   - Arrastra la carpeta completa a vercel.com
   - O conecta tu repositorio de GitHub
   - Vercel detectará automáticamente la configuración

## 🎮 Archivos importantes:

- `online.html` - Versión multijugador online
- `index.html` - Versión local (4 jugadores en una PC)
- `vercel.json` - Configuración de Vercel
- `styles.css` - Estilos del juego
- `script.js` - Lógica del juego local

## 🏆 Reglas del juego:

- 4 jugadores exactos
- 5 cartas iniciales por jugador
- Victoria por: 100 puntos, quedarse sin cartas, o más puntos al final
- Cartas rojas dan +2 puntos bonus

## 🔧 Configuración Firebase necesaria:

```javascript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com", 
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
  projectId: "tu-proyecto"
};
```
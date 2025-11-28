# Guía de Diagnóstico - Problemas de Conexión Frontend-Backend

## 🔍 **Diagnóstico del Problema**

Si no ves logs en el backend cuando haces requests desde el frontend, sigue estos pasos:

## 1️⃣ **Verificar que el Backend esté Corriendo**

### Comando para verificar el servidor:
```bash
# En la carpeta del backend
npm run dev
```

### Deberías ver estos logs:
```
✅ Firebase initialized successfully
✅ Socket.IO initialized successfully  
✅ Server running on port 4000
📡 Environment: development
📡 Health check: http://localhost:4000/health
📡 Socket.IO ready for connections
```

## 2️⃣ **Probar Endpoints Directamente**

### Desde tu navegador:
```
http://localhost:4000/health
```

### Desde Postman:
```
GET http://localhost:4000/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "service": "chat-server", 
  "timestamp": "2024-11-27T...",
  "environment": "development"
}
```

## 3️⃣ **Verificar URLs en tu Frontend**

### Revisa estas configuraciones en tu frontend:

#### Variables de entorno (.env):
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

#### En tu código JavaScript/React:
```javascript
// ❌ URLs INCORRECTAS
const API_URL = 'http://localhost:3000'; // Puerto incorrecto
const API_URL = 'https://localhost:4000'; // HTTPS en local
const API_URL = 'localhost:4000'; // Sin protocolo

// ✅ URL CORRECTA
const API_URL = 'http://localhost:4000';
```

## 4️⃣ **Verificar Configuración de Axios/Fetch**

### Configuración correcta de Axios:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos timeout
});

// Interceptor para logs de debug
api.interceptors.request.use(request => {
  console.log('🔄 Enviando request a:', request.url);
  console.log('📦 Data:', request.data);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('✅ Respuesta recibida:', response.data);
    return response;
  },
  error => {
    console.error('❌ Error en request:', error.message);
    console.error('📍 URL:', error.config?.url);
    return Promise.reject(error);
  }
);
```

### Con fetch nativo:
```javascript
const createMeeting = async (meetingData) => {
  try {
    console.log('🔄 Enviando request a: http://localhost:4000/api/meetings');
    console.log('📦 Data:', meetingData);
    
    const response = await fetch('http://localhost:4000/api/meetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Respuesta recibida:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error en request:', error.message);
    throw error;
  }
};
```

## 5️⃣ **Verificar CORS**

Si ves errores de CORS en la consola del navegador:

### Error típico de CORS:
```
Access to fetch at 'http://localhost:4000/api/meetings' from origin 'http://localhost:5173' has been blocked by CORS policy
```

### Verifica la configuración en el backend (.env):
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

### Si tu frontend corre en un puerto diferente, agrégalo:
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:8080
```

## 6️⃣ **Códigos de Request de Prueba**

### Crear Reunión:
```javascript
const testCreateMeeting = async () => {
  const meetingData = {
    userId: "test-user-001",
    title: "Reunión de Prueba",
    description: "Test desde frontend",
    date: "2024-12-01",
    time: "14:30",
    estimatedDuration: 60,
    maxParticipants: 10
  };
  
  try {
    const response = await fetch('http://localhost:4000/api/meetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingData),
    });
    
    const data = await response.json();
    console.log('Reunión creada:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Llamar la función de prueba
testCreateMeeting();
```

### Unirse a Reunión:
```javascript
const testJoinMeeting = async (meetingId) => {
  const joinData = {
    userId: "test-user-002"
  };
  
  try {
    const response = await fetch(`http://localhost:4000/api/meetings/${meetingId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(joinData),
    });
    
    const data = await response.json();
    console.log('Unido a reunión:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 7️⃣ **Debug del Network Tab**

### En las DevTools del navegador:
1. Abre **F12** → **Network**
2. Haz tu request desde el frontend
3. Busca la petición en la lista
4. Revisa:
   - **Status Code** (200, 404, 500, etc.)
   - **Request Headers**
   - **Response** (si hay alguna)

### Estados comunes:
- **404 Not Found**: URL incorrecta
- **500 Internal Server Error**: Error en el backend
- **0 (failed)**: Backend no corriendo o CORS
- **ERR_CONNECTION_REFUSED**: Puerto incorrecto

## 8️⃣ **Verificar Puertos**

### Comando para ver qué está usando el puerto 4000:
```bash
# Windows
netstat -ano | findstr :4000

# El resultado debería mostrar algo como:
# TCP    0.0.0.0:4000    0.0.0.0:0    LISTENING    1234
```

## 9️⃣ **Socket.io Debug (si usas WebSockets)**

### Habilitar logs de Socket.io en el frontend:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('✅ Socket conectado:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Socket desconectado');
});

socket.on('connect_error', (error) => {
  console.error('❌ Error de conexión Socket:', error.message);
});
```

## 🚨 **Problemas Comunes y Soluciones**

| Problema | Causa | Solución |
|----------|-------|----------|
| No hay logs en backend | Frontend apunta a URL incorrecta | Verificar URLs y puertos |
| CORS Error | Origin no permitido | Agregar origin a CORS_ORIGIN |
| Connection Refused | Backend no corriendo | Ejecutar `npm run dev` |
| 404 Not Found | Endpoint incorrecto | Verificar rutas en POSTMAN_GUIDE |
| 500 Internal Error | Error en código backend | Revisar logs del servidor |

## ✅ **Checklist Final**

- [ ] Backend corriendo en puerto 4000
- [ ] Health check responde: `http://localhost:4000/health`  
- [ ] CORS configurado para tu puerto del frontend
- [ ] URLs correctas en el frontend (http, no https)
- [ ] Content-Type headers correctos
- [ ] Data en formato JSON válido
- [ ] Network tab muestra requests salientes
- [ ] Console logs configurados para debug

**Si sigues estos pasos deberías ver los logs en el backend cuando hagas requests desde el frontend.**
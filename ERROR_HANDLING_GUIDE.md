# Guía de Manejo de Errores - Chat Backend

Este documento lista todos los errores que puede retornar el backend y cómo el frontend debe manejarlos.

## 📋 Estructura de Respuestas

### Respuesta de Éxito (HTTP)
```json
{
  "success": true,
  "message": "Mensaje opcional",
  "data": { /* datos */ }
}
```

### Respuesta de Error (HTTP)
```json
{
  "success": false,
  "message": "Mensaje de error",
  "stack": "Stack trace (solo en desarrollo)"
}
```

### Respuesta de Error (Socket.io)
```json
{
  "message": "Mensaje de error"
}
```

---

## 🔴 Errores HTTP (REST API)

### 400 Bad Request - Errores de Validación

#### 1. `POST /api/meetings` - Crear Reunión

**Error:** `"User ID is required"`
- **Causa:** Falta el campo `userId` en el body
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 400 && error.response?.data?.message === "User ID is required") {
    // Mostrar: "Debes estar autenticado para crear una reunión"
    // Redirigir al login si es necesario
  }
  ```

**Error:** `"Title, date, and time are required"`
- **Causa:** Faltan campos obligatorios
- **Manejo Frontend:**
  ```javascript
  // Validar antes de enviar
  if (!title || !date || !time) {
    setError("Por favor completa todos los campos obligatorios");
    return;
  }
  ```

**Error:** `"Date must be in YYYY-MM-DD format"`
- **Causa:** Formato de fecha incorrecto
- **Manejo Frontend:**
  ```javascript
  // Validar formato antes de enviar
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    setError("La fecha debe estar en formato YYYY-MM-DD (ej: 2024-12-25)");
    return;
  }
  ```

**Error:** `"Time must be in HH:mm format"`
- **Causa:** Formato de hora incorrecto
- **Manejo Frontend:**
  ```javascript
  // Validar formato antes de enviar
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(time)) {
    setError("La hora debe estar en formato HH:mm (ej: 14:30)");
    return;
  }
  ```

#### 2. `GET /api/meetings/user/:userId` - Obtener Reuniones del Usuario

**Error:** `"User ID is required"`
- **Causa:** El parámetro `userId` está vacío o no se proporcionó
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 400) {
    // Mostrar: "Error al cargar las reuniones. Por favor recarga la página."
    // Intentar recargar después de 2 segundos
  }
  ```

#### 3. `GET /api/meetings/today/:userId` - Obtener Reuniones de Hoy

**Error:** `"User ID is required"`
- **Causa:** El parámetro `userId` está vacío
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 400) {
    // Mostrar: "Error al cargar las reuniones de hoy"
    // Mostrar lista vacía como fallback
  }
  ```

#### 4. `GET /api/meetings/:meetingId` - Obtener Reunión por ID

**Error:** `"Meeting ID is required"`
- **Causa:** El parámetro `meetingId` está vacío
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 400) {
    // Mostrar: "ID de reunión inválido"
    // Redirigir a la lista de reuniones
    router.push('/meetings');
  }
  ```

#### 5. `POST /api/meetings/:meetingId/join` - Unirse a Reunión

**Error:** `"Meeting ID and User ID are required"`
- **Causa:** Faltan parámetros requeridos
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 400) {
    // Mostrar: "Error al unirse a la reunión. Por favor intenta de nuevo."
    // Verificar que el usuario esté autenticado
  }
  ```

#### 6. `POST /api/meetings/:meetingId/leave` - Salir de Reunión

**Error:** `"Meeting ID and User ID are required"`
- **Causa:** Faltan parámetros requeridos
- **Manejo Frontend:**
  ```javascript
  // Este error es raro, pero si ocurre:
  if (error.response?.status === 400) {
    // Simplemente cerrar la conexión del socket
    socket.emit('leave:meeting', meetingId);
  }
  ```

#### 7. `PUT /api/meetings/:meetingId` - Actualizar Reunión

**Error:** `"Meeting ID and User ID are required"`
- **Causa:** Faltan parámetros requeridos
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 400) {
    setError("Faltan datos requeridos para actualizar la reunión");
  }
  ```

**Error:** `"Date must be in YYYY-MM-DD format"` (si se proporciona date)
- **Causa:** Formato de fecha incorrecto
- **Manejo Frontend:** Igual que en crear reunión

**Error:** `"Time must be in HH:mm format"` (si se proporciona time)
- **Causa:** Formato de hora incorrecto
- **Manejo Frontend:** Igual que en crear reunión

#### 8. `DELETE /api/meetings/:meetingId` - Eliminar Reunión

**Error:** `"Meeting ID and User ID are required"`
- **Causa:** Faltan parámetros requeridos
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 400) {
    setError("Error al eliminar la reunión. Por favor intenta de nuevo.");
  }
  ```

#### 9. `GET /api/chat/meeting/:meetingId` - Obtener Info de Reunión

**Error:** `"Meeting ID is required"`
- **Causa:** El parámetro `meetingId` está vacío
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 400) {
    // Redirigir a lista de reuniones
    router.push('/meetings');
  }
  ```

---

### 403 Forbidden - Errores de Permisos

#### 1. `PUT /api/meetings/:meetingId` - Actualizar Reunión

**Error:** `"Only the host can update the meeting"`
- **Causa:** El usuario no es el host de la reunión
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 403) {
    // Ocultar botón de editar
    // Mostrar mensaje: "Solo el anfitrión puede editar esta reunión"
    setError("No tienes permisos para editar esta reunión");
  }
  ```

#### 2. `DELETE /api/meetings/:meetingId` - Eliminar Reunión

**Error:** `"Only the host can delete the meeting"`
- **Causa:** El usuario no es el host de la reunión
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 403) {
    // Ocultar botón de eliminar
    // Mostrar mensaje: "Solo el anfitrión puede eliminar esta reunión"
    setError("No tienes permisos para eliminar esta reunión");
  }
  ```

---

### 404 Not Found - Recurso No Encontrado

#### 1. `GET /api/meetings/:meetingId` - Obtener Reunión por ID

**Error:** `"Meeting not found"`
- **Causa:** La reunión no existe en la base de datos
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 404) {
    // Mostrar: "Esta reunión no existe o ha sido eliminada"
    // Redirigir a la lista de reuniones después de 3 segundos
    setTimeout(() => router.push('/meetings'), 3000);
  }
  ```

#### 2. `POST /api/meetings/:meetingId/join` - Unirse a Reunión

**Error:** `"Meeting not found"`
- **Causa:** La reunión no existe
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 404) {
    setError("Esta reunión no existe o ha sido eliminada");
    // Redirigir a la lista de reuniones
    router.push('/meetings');
  }
  ```

#### 3. `PUT /api/meetings/:meetingId` - Actualizar Reunión

**Error:** `"Meeting not found"`
- **Causa:** La reunión no existe
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 404) {
    setError("Esta reunión no existe o ha sido eliminada");
    router.push('/meetings');
  }
  ```

#### 4. `GET /api/chat/meeting/:meetingId` - Obtener Info de Reunión

**Error:** `"Meeting not found"`
- **Causa:** La reunión no existe
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 404) {
    // Mostrar página 404 personalizada
    // O redirigir a lista de reuniones
    router.push('/meetings');
  }
  ```

#### 5. Ruta No Encontrada

**Error:** `"Route {ruta} not found"`
- **Causa:** La ruta HTTP no existe
- **Manejo Frontend:**
  ```javascript
  if (error.response?.status === 404) {
    // Esto generalmente no debería pasar si las rutas están bien configuradas
    // Pero si pasa, mostrar página 404
    console.error("Ruta no encontrada:", error.response?.data?.message);
  }
  ```

---

### 500 Internal Server Error - Errores del Servidor

Estos errores pueden ocurrir en cualquier endpoint:

**Errores Genéricos:**
- `"Error creating meeting"`
- `"Error fetching meetings"`
- `"Error fetching meeting"`
- `"Error joining meeting"`
- `"Error leaving meeting"`
- `"Error deleting meeting"`
- `"Error updating meeting"`
- `"Error fetching meeting information"`
- `"Error fetching server statistics"`
- `"Error fetching today meetings: {mensaje}"`

**Manejo Frontend:**
```javascript
if (error.response?.status === 500) {
  // Mostrar mensaje genérico
  setError("Ocurrió un error en el servidor. Por favor intenta más tarde.");
  
  // Opcional: Enviar error a servicio de monitoreo (Sentry, etc.)
  // logErrorToService(error);
  
  // Opcional: Reintentar después de un tiempo
  // setTimeout(() => retryRequest(), 5000);
}
```

---

## 🔌 Errores de Socket.io

Todos los errores de Socket.io se emiten a través del evento `error`.

### Estructura del Error
```javascript
socket.on('error', (error) => {
  // error = { message: "Mensaje de error" }
});
```

### Errores Específicos

#### 1. `join:meeting` - Unirse a Reunión

**Error:** `"Meeting ID and User ID are required"`
- **Causa:** Faltan campos requeridos en el payload
- **Manejo Frontend:**
  ```javascript
  socket.on('error', (error) => {
    if (error.message === "Meeting ID and User ID are required") {
      setError("Error al conectarse. Por favor recarga la página.");
      // Intentar reconectar
      setTimeout(() => {
        socket.connect();
        socket.emit('join:meeting', { meetingId, userId, username });
      }, 2000);
    }
  });
  ```

**Error:** `"Meeting not found"`
- **Causa:** La reunión no existe en Firestore
- **Manejo Frontend:**
  ```javascript
  socket.on('error', (error) => {
    if (error.message === "Meeting not found") {
      setError("Esta reunión no existe o ha sido eliminada");
      // Redirigir a lista de reuniones
      router.push('/meetings');
    }
  });
  ```

**Error:** `"Meeting is full (maximum {n} participants)"`
- **Causa:** La reunión alcanzó el máximo de participantes
- **Manejo Frontend:**
  ```javascript
  socket.on('error', (error) => {
    if (error.message.includes("Meeting is full")) {
      const maxParticipants = error.message.match(/\d+/)?.[0] || "10";
      setError(`Esta reunión está llena (máximo ${maxParticipants} participantes)`);
      // Mostrar botón para volver
      // O mostrar lista de espera si está implementada
    }
  });
  ```

**Error:** `"Failed to join meeting"`
- **Causa:** Error genérico al unirse (puede ser error de Firestore, etc.)
- **Manejo Frontend:**
  ```javascript
  socket.on('error', (error) => {
    if (error.message === "Failed to join meeting") {
      setError("No se pudo conectar a la reunión. Por favor intenta de nuevo.");
      // Mostrar botón de reintentar
      setShowRetryButton(true);
    }
  });
  ```

#### 2. `chat:message` - Enviar Mensaje

**Error:** `"Meeting ID, User ID, and message are required"`
- **Causa:** Faltan campos requeridos
- **Manejo Frontend:**
  ```javascript
  // Validar antes de enviar
  const sendMessage = (message) => {
    if (!meetingId || !userId || !message.trim()) {
      setError("Por favor completa todos los campos");
      return;
    }
    socket.emit('chat:message', { meetingId, userId, username, message });
  };
  
  socket.on('error', (error) => {
    if (error.message.includes("are required")) {
      setError("Error al enviar el mensaje. Por favor intenta de nuevo.");
    }
  });
  ```

**Error:** `"Failed to send message"`
- **Causa:** Error genérico al enviar mensaje
- **Manejo Frontend:**
  ```javascript
  socket.on('error', (error) => {
    if (error.message === "Failed to send message") {
      // Guardar mensaje en cola local para reenviar después
      addMessageToQueue(message);
      setError("No se pudo enviar el mensaje. Se reintentará automáticamente.");
      
      // Reintentar después de 2 segundos
      setTimeout(() => {
        retryFailedMessages();
      }, 2000);
    }
  });
  ```

---

## 🛠️ Implementación Recomendada en el Frontend

### Interceptor de Errores HTTP (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// Interceptor de respuesta para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data } = error.response || {};
    
    // Manejo centralizado de errores
    switch (status) {
      case 400:
        // Errores de validación
        showNotification(data.message || 'Datos inválidos', 'error');
        break;
        
      case 403:
        // Sin permisos
        showNotification(data.message || 'No tienes permisos para esta acción', 'warning');
        break;
        
      case 404:
        // No encontrado
        showNotification(data.message || 'Recurso no encontrado', 'error');
        break;
        
      case 500:
        // Error del servidor
        showNotification('Error del servidor. Por favor intenta más tarde.', 'error');
        logError(error);
        break;
        
      default:
        showNotification('Ocurrió un error inesperado', 'error');
    }
    
    return Promise.reject(error);
  }
);
```

### Manejo de Errores de Socket.io

```javascript
import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  
  connect(meetingId: string, userId: string, username: string) {
    this.socket = io('http://localhost:4000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    
    // Manejo de errores
    this.socket.on('error', (error) => {
      this.handleSocketError(error);
    });
    
    // Manejo de desconexión
    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // El servidor desconectó, reconectar manualmente
        this.socket?.connect();
      }
      // Otras razones: 'io client disconnect', 'ping timeout', etc.
    });
    
    // Intentar unirse a la reunión
    this.socket.on('connect', () => {
      this.socket?.emit('join:meeting', { meetingId, userId, username });
    });
  }
  
  private handleSocketError(error: { message: string }) {
    const { message } = error;
    
    // Errores específicos
    if (message.includes('Meeting not found')) {
      showNotification('Esta reunión no existe', 'error');
      router.push('/meetings');
      return;
    }
    
    if (message.includes('Meeting is full')) {
      const maxParticipants = message.match(/\d+/)?.[0] || '10';
      showNotification(`La reunión está llena (máximo ${maxParticipants} participantes)`, 'warning');
      return;
    }
    
    if (message.includes('are required')) {
      showNotification('Faltan datos requeridos. Por favor recarga la página.', 'error');
      return;
    }
    
    if (message.includes('Failed to')) {
      showNotification('Error de conexión. Reintentando...', 'warning');
      // El socket.io ya tiene reconexión automática
      return;
    }
    
    // Error genérico
    showNotification('Error de conexión', 'error');
  }
}
```

### Componente de Manejo de Errores Global

```javascript
// ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado:', error, errorInfo);
    // Enviar a servicio de monitoreo
    // logErrorToService(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Algo salió mal</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 📊 Resumen de Códigos de Estado HTTP

| Código | Significado | Acción Recomendada |
|--------|-------------|-------------------|
| 200 | OK | Continuar normalmente |
| 201 | Created | Mostrar mensaje de éxito |
| 400 | Bad Request | Validar datos antes de enviar |
| 403 | Forbidden | Ocultar acciones no permitidas |
| 404 | Not Found | Redirigir o mostrar 404 |
| 500 | Internal Server Error | Mostrar mensaje genérico, reintentar |

---

## 🔍 Errores Comunes y Soluciones

### 1. Error de Conexión (Network Error)
```javascript
// Detectar cuando no hay respuesta del servidor
if (!error.response) {
  showNotification('No se pudo conectar al servidor. Verifica tu conexión.', 'error');
  // Mostrar estado offline
  setOfflineMode(true);
}
```

### 2. Timeout
```javascript
// Configurar timeout en axios
api.defaults.timeout = 10000; // 10 segundos

// Manejar timeout
if (error.code === 'ECONNABORTED') {
  showNotification('La solicitud tardó demasiado. Por favor intenta de nuevo.', 'warning');
}
```

### 3. CORS Error
```javascript
// Este error generalmente ocurre en desarrollo
// Verificar que CORS_ORIGIN en .env incluya la URL del frontend
// Error típico: "Access to XMLHttpRequest has been blocked by CORS policy"
```

---

## ✅ Checklist de Implementación

- [ ] Interceptor de errores HTTP configurado
- [ ] Manejo de errores de Socket.io implementado
- [ ] Validación de datos antes de enviar requests
- [ ] Mensajes de error amigables para el usuario
- [ ] Logging de errores para debugging
- [ ] Reintentos automáticos para errores temporales
- [ ] Manejo de estados offline/online
- [ ] Error Boundary para errores de React
- [ ] Notificaciones visuales para errores
- [ ] Redirecciones apropiadas en errores 404/403

---

**Nota:** Este backend es un microservicio interno. Todos los errores de autenticación deben ser manejados por el User Backend (API Gateway). Este backend solo valida que los datos sean correctos, no la autenticación del usuario.




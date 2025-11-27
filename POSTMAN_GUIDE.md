# Guía de Endpoints para Postman - PI-3 Chat Server

## Configuración Inicial

**Base URL:** `http://localhost:4000`
**Content-Type:** `application/json` (para requests POST/PUT)

## 📍 Endpoints Disponibles

### 1. Health Check & Info

#### GET - Health Check
```
GET /health
```
**Descripción:** Verifica el estado del servidor
**Respuesta:**
```json
{
  "status": "ok",
  "service": "chat-server",
  "timestamp": "2024-11-27T...",
  "environment": "development"
}
```

#### GET - Server Info
```
GET /
```
**Descripción:** Información general del servidor y endpoints disponibles
**Respuesta:** Objeto con información completa del servicio y endpoints

### 2. Chat Endpoints (`/api/chat`)

#### GET - Meeting Info
```
GET /api/chat/meeting/:meetingId
```
**Parámetros:**
- `meetingId` (string): ID de la reunión

**Ejemplo:**
```
GET /api/chat/meeting/abc123def456
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "meetingId": "abc123def456",
    "hostId": "user123",
    "title": "Reunión de Proyecto",
    "description": "Discusión del progreso",
    "participants": ["user123", "user456"],
    "activeParticipants": 2,
    "createdAt": "2024-11-27T...",
    "updatedAt": "2024-11-27T...",
    "status": "active"
  }
}
```

#### GET - Server Stats
```
GET /api/chat/stats
```
**Descripción:** Estadísticas del servidor en tiempo real

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "activeMeetings": 3,
    "totalUsers": 8,
    "maxParticipantsPerMeeting": 10,
    "minParticipantsPerMeeting": 2
  }
}
```

### 3. Meeting Endpoints (`/api/meetings`)

#### POST - Create Meeting
```
POST /api/meetings
```
**Body (JSON):**
```json
{
  "userId": "user123",
  "title": "Mi Reunión",
  "description": "Descripción de la reunión",
  "date": "2024-12-01",
  "time": "14:30",
  "estimatedDuration": 60,
  "maxParticipants": 8
}
```

**Campos requeridos:**
- `userId` (string): ID del usuario host
- `title` (string): Título de la reunión
- `date` (string): Fecha en formato YYYY-MM-DD
- `time` (string): Hora en formato HH:mm

**Campos opcionales:**
- `description` (string): Descripción de la reunión
- `estimatedDuration` (number): Duración estimada en minutos (default: 60)
- `maxParticipants` (number): Máximo de participantes (default: 10)

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Meeting created successfully",
  "data": {
    "meetingId": "generated-id-123",
    "hostId": "user123",
    "title": "Mi Reunión",
    "description": "Descripción de la reunión",
    "date": "2024-12-01",
    "time": "14:30",
    "estimatedDuration": 60,
    "maxParticipants": 8,
    "participants": ["user123"],
    "activeParticipants": 0,
    "createdAt": "2024-11-27T...",
    "updatedAt": "2024-11-27T...",
    "status": "active"
  }
}
```

#### GET - User Meetings
```
GET /api/meetings/user/:userId
```
**Parámetros:**
- `userId` (string): ID del usuario

**Ejemplo:**
```
GET /api/meetings/user/user123
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "meetingId": "meeting1",
      "hostId": "user123",
      "title": "Reunión 1",
      "participants": ["user123", "user456"],
      "status": "active",
      ...
    }
  ]
}
```

#### GET - Meeting by ID
```
GET /api/meetings/:meetingId
```
**Parámetros:**
- `meetingId` (string): ID de la reunión

**Ejemplo:**
```
GET /api/meetings/abc123def456
```

#### POST - Join Meeting
```
POST /api/meetings/:meetingId/join
```
**Parámetros:**
- `meetingId` (string): ID de la reunión

**Body (JSON):**
```json
{
  "userId": "user456"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Joined meeting successfully",
  "data": {
    // Meeting data actualizada con el nuevo participante
  }
}
```

#### POST - Leave Meeting
```
POST /api/meetings/:meetingId/leave
```
**Parámetros:**
- `meetingId` (string): ID de la reunión

**Body (JSON):**
```json
{
  "userId": "user456"
}
```

#### PUT - Update Meeting
```
PUT /api/meetings/:meetingId
```
**Parámetros:**
- `meetingId` (string): ID de la reunión

**Body (JSON):**
```json
{
  "userId": "user123",
  "title": "Nuevo título",
  "description": "Nueva descripción",
  "date": "2024-12-02",
  "time": "15:00",
  "estimatedDuration": 90,
  "maxParticipants": 12,
  "status": "active"
}
```

**Campos requeridos:**
- `userId` (string): ID del usuario (debe ser el host)

**Campos opcionales para actualizar:**
- `title` (string): Nuevo título
- `description` (string): Nueva descripción
- `date` (string): Nueva fecha (YYYY-MM-DD)
- `time` (string): Nueva hora (HH:mm)
- `estimatedDuration` (number): Nueva duración estimada
- `maxParticipants` (number): Nuevo máximo de participantes
- `status` (string): Nuevo estado (active, completed, cancelled)

**Nota:** Solo el host puede actualizar la reunión

#### DELETE - Delete Meeting
```
DELETE /api/meetings/:meetingId
```
**Parámetros:**
- `meetingId` (string): ID de la reunión

**Body (JSON):**
```json
{
  "userId": "user123"
}
```

**Nota:** Solo el host puede eliminar la reunión

## 🔧 Configuración de Colección en Postman

### Variables de Entorno
Crear una colección con estas variables:

| Variable | Valor |
|----------|-------|
| `baseUrl` | `http://localhost:4000` |
| `testUserId` | `user123` |
| `testMeetingId` | `abc123def456` |

### Headers por Defecto
```
Content-Type: application/json
Accept: application/json
```

## ⚠️ Códigos de Error Comunes

- **400 Bad Request:** Parámetros faltantes o inválidos
- **403 Forbidden:** Sin permisos (ej: solo el host puede eliminar)
- **404 Not Found:** Recurso no encontrado
- **500 Internal Server Error:** Error del servidor

## 📝 Ejemplos de Flujo de Prueba

### Flujo Completo:
1. **Health Check** - Verificar que el servidor funciona
2. **Create Meeting** - Crear una nueva reunión
3. **Get Meeting** - Obtener información de la reunión
4. **Join Meeting** - Unir otro usuario
5. **Get Stats** - Ver estadísticas del servidor
6. **Update Meeting** - Actualizar la reunión
7. **Leave Meeting** - Salir de la reunión
8. **Delete Meeting** - Eliminar la reunión

### Test Data Samples:
```json
// Usuario de prueba
{
  "userId": "test-user-001",
  "username": "TestUser"
}

// Reunión de prueba completa
{
  "userId": "test-user-001",
  "title": "Reunión de Prueba",
  "description": "Testing endpoints con todos los campos",
  "date": "2024-12-01",
  "time": "10:30",
  "estimatedDuration": 45,
  "maxParticipants": 6
}

// Reunión mínima (solo campos requeridos)
{
  "userId": "test-user-001", 
  "title": "Reunión Rápida",
  "date": "2024-12-01",
  "time": "16:00"
}
```

## 🚀 Próximos Pasos
Una vez que los endpoints funcionen correctamente en Postman, estarás listo para conectar el frontend usando estas mismas rutas y estructura de datos.
# Guía de Integración Frontend - PI-3 Chat Server

## 🏗️ Arquitectura del Sistema

Este backend proporciona dos tipos de comunicación:
- **REST API**: Para operaciones CRUD de reuniones
- **WebSocket (Socket.io)**: Para chat en tiempo real

## 📡 Configuración Inicial Frontend

### Variables de Entorno
```javascript
// .env (Frontend)
VITE_CHAT_SERVER_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

### Dependencias Necesarias
```bash
npm install socket.io-client axios
# o
yarn add socket.io-client axios
```

### Tipos TypeScript (Opcional)
```typescript
// types/meeting.ts
export interface Meeting {
  meetingId: string;
  hostId: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  estimatedDuration: number; // minutes
  maxParticipants: number;
  participants: string[];
  activeParticipants: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface CreateMeetingData {
  userId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  estimatedDuration?: number;
  maxParticipants?: number;
}

export interface UpdateMeetingData {
  userId: string;
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  estimatedDuration?: number;
  maxParticipants?: number;
  status?: 'active' | 'completed' | 'cancelled';
}
```

## 🔌 Configuración de Socket.io Client

### Inicialización
```javascript
// services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

// Conectar cuando sea necesario
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

// Desconectar
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
```

## 📡 Eventos de Socket.io Disponibles

### Eventos que puedes EMITIR (Frontend → Backend)

#### 1. Unirse a Reunión
```javascript
socket.emit('join:meeting', {
  meetingId: 'abc123',
  userId: 'user123',
  username: 'Juan Pérez'
});
```

#### 2. Enviar Mensaje de Chat
```javascript
socket.emit('chat:message', {
  meetingId: 'abc123',
  userId: 'user123',
  username: 'Juan Pérez',
  message: 'Hola a todos!'
});
```

#### 3. Indicadores de Escritura
```javascript
// Empezar a escribir
socket.emit('typing:start', {
  meetingId: 'abc123',
  userId: 'user123',
  username: 'Juan Pérez'
});

// Dejar de escribir
socket.emit('typing:stop', {
  meetingId: 'abc123',
  userId: 'user123',
  username: 'Juan Pérez'
});
```

#### 4. Salir de Reunión
```javascript
socket.emit('leave:meeting', 'abc123');
```

### Eventos que puedes ESCUCHAR (Backend → Frontend)

#### 1. Usuarios Online
```javascript
socket.on('users:online', (data) => {
  console.log('Usuarios online:', data);
  // data = {
  //   meetingId: 'abc123',
  //   participants: [
  //     { userId: 'user1', username: 'Juan', joinedAt: '...' },
  //     { userId: 'user2', username: 'María', joinedAt: '...' }
  //   ],
  //   count: 2
  // }
});
```

#### 2. Usuario se Unió
```javascript
socket.on('user:joined', (data) => {
  console.log('Usuario se unió:', data);
  // data = {
  //   userId: 'user123',
  //   username: 'Juan',
  //   timestamp: '2024-11-27T...'
  // }
});
```

#### 3. Usuario se Fue
```javascript
socket.on('user:left', (data) => {
  console.log('Usuario se fue:', data);
  // Misma estructura que user:joined
});
```

#### 4. Mensajes de Chat
```javascript
socket.on('chat:message', (message) => {
  console.log('Nuevo mensaje:', message);
  // message = {
  //   messageId: 'unique-id',
  //   meetingId: 'abc123',
  //   userId: 'user123',
  //   username: 'Juan',
  //   message: 'Hola!',
  //   timestamp: '2024-11-27T...'
  // }
});
```

#### 5. Indicadores de Escritura
```javascript
socket.on('typing:start', (data) => {
  console.log('Alguien está escribiendo:', data);
  // data = { userId: 'user123', username: 'Juan' }
});

socket.on('typing:stop', (data) => {
  console.log('Dejó de escribir:', data);
});
```

#### 6. Errores
```javascript
socket.on('error', (error) => {
  console.error('Error del socket:', error);
  // error = { message: 'Meeting not found' }
});
```

## 🌐 API REST - Funciones Helper

### Configuración de Axios
```javascript
// services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_CHAT_SERVER_URL || 'http://localhost:4000';

export const chatAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Funciones para Reuniones
```javascript
// services/meetingService.js
import { chatAPI } from './api';

export const meetingService = {
  // Crear reunión
  async createMeeting(meetingData) {
    const response = await chatAPI.post('/api/meetings', meetingData);
    return response.data;
  },

  // Crear reunión (método alternativo con parámetros individuales)
  async createMeetingSimple(userId, title, date, time, description = '', estimatedDuration = 60, maxParticipants = 10) {
    const response = await chatAPI.post('/api/meetings', {
      userId,
      title,
      description,
      date, // YYYY-MM-DD
      time, // HH:mm
      estimatedDuration,
      maxParticipants
    });
    return response.data;
  },

  // Obtener reuniones del usuario
  async getUserMeetings(userId) {
    const response = await chatAPI.get(`/api/meetings/user/${userId}`);
    return response.data;
  },

  // Obtener reunión por ID
  async getMeetingById(meetingId) {
    const response = await chatAPI.get(`/api/meetings/${meetingId}`);
    return response.data;
  },

  // Unirse a reunión
  async joinMeeting(meetingId, userId) {
    const response = await chatAPI.post(`/api/meetings/${meetingId}/join`, {
      userId
    });
    return response.data;
  },

  // Salir de reunión
  async leaveMeeting(meetingId, userId) {
    const response = await chatAPI.post(`/api/meetings/${meetingId}/leave`, {
      userId
    });
    return response.data;
  },

  // Actualizar reunión
  async updateMeeting(meetingId, userId, updates) {
    const response = await chatAPI.put(`/api/meetings/${meetingId}`, {
      userId,
      ...updates
    });
    return response.data;
  },

  // Eliminar reunión
  async deleteMeeting(meetingId, userId) {
    const response = await chatAPI.delete(`/api/meetings/${meetingId}`, {
      data: { userId }
    });
    return response.data;
  },

  // Obtener estadísticas del servidor
  async getServerStats() {
    const response = await chatAPI.get('/api/chat/stats');
    return response.data;
  },

  // Verificar salud del servidor
  async healthCheck() {
    const response = await chatAPI.get('/health');
    return response.data;
  }
};
```

## 🎯 Ejemplos de Uso en Componentes

### Hook personalizado para Socket
```javascript
// hooks/useSocket.js
import { useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

export const useSocket = (meetingId, userId, username) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    connectSocket();

    // Event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      // Unirse automáticamente a la reunión
      if (meetingId && userId && username) {
        socket.emit('join:meeting', { meetingId, userId, username });
      }
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('users:online', (data) => {
      setOnlineUsers(data.participants);
    });

    socket.on('chat:message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user:joined', (data) => {
      // Mostrar notificación
      console.log(`${data.username} se unió`);
    });

    socket.on('user:left', (data) => {
      // Mostrar notificación
      console.log(`${data.username} se fue`);
    });

    return () => {
      if (meetingId) {
        socket.emit('leave:meeting', meetingId);
      }
      disconnectSocket();
    };
  }, [meetingId, userId, username]);

  const sendMessage = (message) => {
    socket.emit('chat:message', {
      meetingId,
      userId,
      username,
      message
    });
  };

  return {
    isConnected,
    onlineUsers,
    messages,
    sendMessage
  };
};
```

### Componente de Chat
```jsx
// components/ChatRoom.jsx
import React, { useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const ChatRoom = ({ meetingId, userId, username }) => {
  const [message, setMessage] = useState('');
  const { isConnected, onlineUsers, messages, sendMessage } = useSocket(
    meetingId, 
    userId, 
    username
  );

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="chat-room">
      <div className="connection-status">
        {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
      </div>
      
      <div className="online-users">
        <h3>Usuarios Online ({onlineUsers.length})</h3>
        {onlineUsers.map(user => (
          <div key={user.userId}>{user.username}</div>
        ))}
      </div>

      <div className="messages">
        {messages.map(msg => (
          <div key={msg.messageId} className="message">
            <strong>{msg.username}:</strong> {msg.message}
            <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button type="submit" disabled={!isConnected}>
          Enviar
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
```

### Componente de Formulario de Reunión
```jsx
// components/MeetingForm.jsx
import React, { useState } from 'react';
import { meetingService } from '../services/meetingService';

const MeetingForm = ({ userId, onMeetingCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    estimatedDuration: 60,
    maxParticipants: 10
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Generar ID de reunión automáticamente
  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedDuration' || name === 'maxParticipants' 
        ? parseInt(value) || 0 
        : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    
    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }
    
    if (!formData.time) {
      newErrors.time = 'La hora es requerida';
    }
    
    if (formData.estimatedDuration < 5) {
      newErrors.estimatedDuration = 'La duración mínima es 5 minutos';
    }
    
    if (formData.maxParticipants < 2) {
      newErrors.maxParticipants = 'Mínimo 2 participantes';
    }
    
    if (formData.maxParticipants > 50) {
      newErrors.maxParticipants = 'Máximo 50 participantes';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const meetingData = {
        userId,
        ...formData
      };
      
      const response = await meetingService.createMeeting(meetingData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        estimatedDuration: 60,
        maxParticipants: 10
      });
      
      // Callback to parent component
      if (onMeetingCreated) {
        onMeetingCreated(response.data);
      }
      
      alert('Reunión creada exitosamente!');
      
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert(error.response?.data?.message || 'Error al crear la reunión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meeting-form">
      <form onSubmit={handleSubmit}>
        {/* Título de la reunión */}
        <div className="form-group">
          <label htmlFor="title">Título de la reunión</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="ej. Reunión de equipo"
            className={errors.title ? 'error' : ''}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Agrega una descripción para tu reunión"
            rows={4}
          />
        </div>

        {/* Fecha y Hora */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Fecha</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? 'error' : ''}
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="time">Hora</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={errors.time ? 'error' : ''}
            />
            {errors.time && <span className="error-message">{errors.time}</span>}
          </div>
        </div>

        {/* Duración y Participantes */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="estimatedDuration">Duración estimada</label>
            <input
              type="number"
              id="estimatedDuration"
              name="estimatedDuration"
              value={formData.estimatedDuration}
              onChange={handleChange}
              placeholder="45 minutos"
              min="5"
              max="480"
              className={errors.estimatedDuration ? 'error' : ''}
            />
            <span className="unit">minutos</span>
            {errors.estimatedDuration && <span className="error-message">{errors.estimatedDuration}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="maxParticipants">Máximo de participantes</label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              placeholder="10 participantes"
              min="2"
              max="50"
              className={errors.maxParticipants ? 'error' : ''}
            />
            <span className="unit">participantes</span>
            {errors.maxParticipants && <span className="error-message">{errors.maxParticipants}</span>}
          </div>
        </div>

        {/* ID de la reunión (solo lectura, generado automáticamente) */}
        <div className="form-group">
          <label htmlFor="meetingId">ID de la reunión</label>
          <input
            type="text"
            id="meetingId"
            value={generateMeetingId()}
            readOnly
            placeholder="Se genera automáticamente"
            className="readonly"
          />
          <small>Este ID se generará automáticamente al crear la reunión</small>
        </div>

        {/* Botón de envío */}
        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Creando reunión...' : 'Crear reunión'}
        </button>
      </form>
    </div>
  );
};

export default MeetingForm;
```

### Componente de Lista de Reuniones
```jsx
// components/MeetingList.jsx
import React, { useState, useEffect } from 'react';
import { meetingService } from '../services/meetingService';

const MeetingList = ({ userId }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, [userId]);

  const loadMeetings = async () => {
    try {
      const response = await meetingService.getUserMeetings(userId);
      setMeetings(response.data);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (title, description) => {
    try {
      const response = await meetingService.createMeeting(userId, title, description);
      setMeetings(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  if (loading) return <div>Cargando reuniones...</div>;

  return (
    <div className="meeting-list">
      <h2>Mis Reuniones</h2>
      {meetings.map(meeting => (
        <div key={meeting.meetingId} className="meeting-card">
          <h3>{meeting.title}</h3>
          <p>{meeting.description}</p>
          <p>Participantes activos: {meeting.activeParticipants}</p>
          <button onClick={() => joinMeeting(meeting.meetingId)}>
            Unirse
          </button>
        </div>
      ))}
    </div>
  );
};
```

## 📱 Estados y Manejo de Errores

### Manejo de Estados de Conexión
```javascript
// Estados típicos que debes manejar:
const [connectionState, setConnectionState] = useState({
  isConnecting: false,
  isConnected: false,
  hasError: false,
  errorMessage: null,
  reconnectAttempts: 0
});
```

### Manejo de Errores
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Mostrar toast/notification al usuario
  showErrorNotification(error.message);
});

// Para errores de API REST
const handleApiError = (error) => {
  if (error.response) {
    // Error del servidor
    console.error('API Error:', error.response.data);
    return error.response.data.message || 'Error del servidor';
  } else if (error.request) {
    // Error de red
    return 'Error de conexión';
  } else {
    return error.message;
  }
};
```

## 🚀 Próximos Pasos

1. **Instalar dependencias** en tu proyecto frontend
2. **Configurar variables de entorno**
3. **Implementar servicios** (socket y API)
4. **Crear hooks personalizados** para reutilizar lógica
5. **Desarrollar componentes** usando los ejemplos
6. **Probar la conexión** con el backend

## 📊 Limitaciones Actuales

- **Máximo participantes por reunión:** 10 (configurable)
- **Mensajes de chat:** No se guardan en base de datos (solo en tiempo real)
- **Autenticación:** No implementada (se asume que viene del User Backend)
- **Persistencia:** Solo los datos de reunión se guardan, no el historial de chat

¡Con esta guía tienes todo lo necesario para conectar tu frontend con el backend de chat!
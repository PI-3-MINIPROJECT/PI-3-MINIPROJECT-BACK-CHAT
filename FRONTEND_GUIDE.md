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

### ⚠️ IMPORTANTE: URL del Servidor
El servidor ahora corre en puerto **4001** (no 4000). Actualiza todas tus URLs:

```bash
# En tu .env del frontend
VITE_CHAT_SERVER_URL=http://localhost:4001
VITE_SOCKET_URL=http://localhost:4001
```

### Inicialización del Socket
```javascript
// services/socketService.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4001';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
  }

  connect() {
    if (this.socket?.connected || this.isConnecting) {
      return this.socket;
    }

    this.isConnecting = true;
    
    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Event listeners básicos
    this.socket.on('connect', () => {
      console.log('✅ Socket conectado:', this.socket.id);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error.message);
      this.isConnecting = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  getSocket() {
    return this.socket;
  }

  // Método helper para emitir eventos con verificación
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket no conectado, no se puede enviar:', event);
    }
  }
}

// Exportar instancia singleton
export default new SocketService();
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

// ⚠️ IMPORTANTE: Actualizar URL base al puerto 4001
const API_BASE_URL = import.meta.env.VITE_CHAT_SERVER_URL || 'http://localhost:4001';

export const chatAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptors para debugging
chatAPI.interceptors.request.use(request => {
  console.log('🔄 API Request:', request.method?.toUpperCase(), request.url);
  console.log('📦 Data:', request.data);
  return request;
});

chatAPI.interceptors.response.use(
  response => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('❌ API Error:', error.message, error.config?.url);
    return Promise.reject(error);
  }
);

export const meetingService = {
  // Crear reunión
  async createMeeting(meetingData) {
    try {
      const response = await chatAPI.post('/api/meetings', meetingData);
      console.log('✅ Reunión creada:', response.data.data?.meetingId);
      return response.data;
    } catch (error) {
      console.error('❌ Error creando reunión:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // Crear reunión (método alternativo con parámetros individuales)
  async createMeetingSimple(userId, title, date, time, description = '', estimatedDuration = 60, maxParticipants = 10) {
    return this.createMeeting({
      userId,
      title,
      description,
      date, // YYYY-MM-DD
      time, // HH:mm
      estimatedDuration,
      maxParticipants
    });
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

  // Obtener reuniones de hoy
  async getTodayMeetings(userId) {
    try {
      const response = await chatAPI.get(`/api/meetings/today/${userId}`);
      console.log(`✅ Encontradas ${response.data.data.count} reuniones para hoy`);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo reuniones de hoy:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // Verificar salud del servidor
  async healthCheck() {
    const response = await chatAPI.get('/health');
    return response.data;
  }
};
```

## 🎯 Ejemplos de Uso en Componentes

### Hook Personalizado para Chat Completo
```javascript
// hooks/useChat.js
import { useEffect, useState, useCallback, useRef } from 'react';
import socketService from '../services/socketService';

export const useChat = (meetingId, userId, username) => {
  // Estados
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  
  // Referencias
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Función para unirse a la reunión
  const joinMeeting = useCallback(() => {
    if (socketRef.current?.connected && meetingId && userId && username) {
      console.log('🔄 Uniéndose a la reunión:', meetingId);
      
      socketRef.current.emit('join:meeting', {
        meetingId,
        userId,
        username
      });
    }
  }, [meetingId, userId, username]);

  // Función para enviar mensaje
  const sendMessage = useCallback((messageText) => {
    if (!messageText.trim()) return;
    
    if (socketRef.current?.connected) {
      console.log('📤 Enviando mensaje:', messageText);
      
      socketRef.current.emit('chat:message', {
        meetingId,
        userId,
        username,
        message: messageText.trim()
      });
    } else {
      console.error('❌ No se puede enviar mensaje: Socket desconectado');
    }
  }, [meetingId, userId, username]);

  // Función para indicadores de escritura
  const startTyping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:start', {
        meetingId,
        userId,
        username
      });
    }
  }, [meetingId, userId, username]);

  const stopTyping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:stop', {
        meetingId,
        userId,
        username
      });
    }
  }, [meetingId, userId, username]);

  // Hook principal
  useEffect(() => {
    if (!meetingId || !userId || !username) {
      console.warn('⚠️ Faltan datos para conectar al chat');
      return;
    }

    // Conectar socket
    const socket = socketService.connect();
    socketRef.current = socket;

    // Event listeners
    const handleConnect = () => {
      console.log('✅ Conectado al chat');
      setIsConnected(true);
      setConnectionError(null);
      joinMeeting();
    };

    const handleDisconnect = (reason) => {
      console.log('❌ Desconectado del chat:', reason);
      setIsConnected(false);
    };

    const handleConnectError = (error) => {
      console.error('❌ Error de conexión:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    };

    const handleUsersOnline = (data) => {
      console.log('👥 Usuarios online:', data.participants.length);
      setOnlineUsers(data.participants || []);
    };

    const handleNewMessage = (message) => {
      console.log('💬 Nuevo mensaje de:', message.username);
      setMessages(prev => [...prev, message]);
    };

    const handleUserJoined = (data) => {
      console.log('👋 Usuario se unió:', data.username);
      // Opcional: Mostrar notificación
    };

    const handleUserLeft = (data) => {
      console.log('👋 Usuario se fue:', data.username);
      // Opcional: Mostrar notificación
    };

    const handleTypingStart = (data) => {
      setIsTyping(prev => {
        if (!prev.find(user => user.userId === data.userId)) {
          return [...prev, data];
        }
        return prev;
      });
    };

    const handleTypingStop = (data) => {
      setIsTyping(prev => prev.filter(user => user.userId !== data.userId));
    };

    const handleError = (error) => {
      console.error('❌ Error del socket:', error);
      setConnectionError(error.message);
    };

    // Registrar listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('users:online', handleUsersOnline);
    socket.on('chat:message', handleNewMessage);
    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('error', handleError);

    // Cleanup
    return () => {
      console.log('🧹 Limpiando conexión de chat');
      
      // Salir de la reunión
      if (socket.connected) {
        socket.emit('leave:meeting', meetingId);
      }

      // Remover listeners
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('users:online', handleUsersOnline);
      socket.off('chat:message', handleNewMessage);
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('error', handleError);

      // Desconectar
      socketService.disconnect();
      
      // Limpiar timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [meetingId, userId, username, joinMeeting]);

  // Función con debounce para typing
  const handleTyping = useCallback(() => {
    startTyping();
    
    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Establecer nuevo timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  }, [startTyping, stopTyping]);

  return {
    // Estados
    isConnected,
    onlineUsers,
    messages,
    isTyping,
    connectionError,
    
    // Funciones
    sendMessage,
    startTyping: handleTyping,
    stopTyping,
    
    // Información
    participantCount: onlineUsers.length
  };
};
```

### Componente de Chat Completo
```jsx
// components/ChatRoom.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';

const ChatRoom = ({ meetingId, userId, username }) => {
  // Estados locales
  const [messageInput, setMessageInput] = useState('');
  const [showUsersList, setShowUsersList] = useState(false);
  
  // Referencias
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Hook de chat
  const {
    isConnected,
    onlineUsers,
    messages,
    isTyping,
    connectionError,
    sendMessage,
    startTyping,
    participantCount
  } = useChat(meetingId, userId, username);

  // Auto-scroll a nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Manejar envío de mensaje
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !isConnected) {
      return;
    }

    sendMessage(messageInput);
    setMessageInput('');
    inputRef.current?.focus();
  };

  // Manejar cambios en el input (para typing indicators)
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // Solo activar typing si hay conexión y contenido
    if (isConnected && e.target.value.trim()) {
      startTyping();
    }
  };

  // Formatear timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar si el mensaje es propio
  const isOwnMessage = (messageUserId) => messageUserId === userId;

  return (
    <div className="chat-room">
      {/* Header del chat */}
      <div className="chat-header">
        <div className="chat-title">
          <h3>Chat de la Reunión</h3>
          <div className="connection-indicator">
            {isConnected ? (
              <span className="status-online">🟢 Conectado</span>
            ) : (
              <span className="status-offline">🔴 Desconectado</span>
            )}
          </div>
        </div>
        
        {/* Botón para mostrar/ocultar usuarios */}
        <button 
          className="users-toggle"
          onClick={() => setShowUsersList(!showUsersList)}
        >
          👥 {participantCount}
        </button>
      </div>

      {/* Error de conexión */}
      {connectionError && (
        <div className="connection-error">
          ⚠️ Error de conexión: {connectionError}
        </div>
      )}

      {/* Lista de usuarios online (colapsible) */}
      {showUsersList && (
        <div className="users-list">
          <h4>Participantes Online ({participantCount})</h4>
          <div className="users-grid">
            {onlineUsers.map(user => (
              <div 
                key={user.userId} 
                className={`user-item ${user.userId === userId ? 'current-user' : ''}`}
              >
                <span className="user-status">🟢</span>
                <span className="user-name">
                  {user.username}
                  {user.userId === userId && ' (Tú)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Container de mensajes */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            💬 No hay mensajes aún. ¡Sé el primero en escribir!
          </div>
        ) : (
          <div className="messages-list">
            {messages.map(msg => (
              <div 
                key={msg.messageId} 
                className={`message ${isOwnMessage(msg.userId) ? 'own-message' : 'other-message'}`}
              >
                {!isOwnMessage(msg.userId) && (
                  <div className="message-sender">{msg.username}</div>
                )}
                <div className="message-content">
                  <span className="message-text">{msg.message}</span>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}
            
            {/* Indicador de que alguien está escribiendo */}
            {isTyping.length > 0 && (
              <div className="typing-indicator">
                <div className="typing-content">
                  <span className="typing-dots">●●●</span>
                  <span className="typing-text">
                    {isTyping.map(user => user.username).join(', ')} está escribiendo...
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input para enviar mensajes */}
      <form onSubmit={handleSendMessage} className="message-form">
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder={
              isConnected 
                ? "Escribe un mensaje..." 
                : "Conectando al chat..."
            }
            disabled={!isConnected}
            maxLength={500}
            autoComplete="off"
          />
          <button 
            type="submit" 
            disabled={!isConnected || !messageInput.trim()}
            className="send-button"
          >
            📤
          </button>
        </div>
        
        {/* Contador de caracteres */}
        <div className="input-footer">
          <small className="char-count">
            {messageInput.length}/500
          </small>
          <small className="connection-help">
            {!isConnected && "Esperando conexión..."}
          </small>
        </div>
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

## 🎨 **Estilos CSS para el Chat**

```css
/* styles/ChatRoom.css */
.chat-room {
  display: flex;
  flex-direction: column;
  height: 500px; /* Ajusta según necesites */
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.chat-title h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.connection-indicator {
  font-size: 12px;
  margin-top: 4px;
}

.status-online {
  color: #4caf50;
}

.status-offline {
  color: #f44336;
}

.users-toggle {
  background: #2196f3;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.connection-error {
  background: #ffebee;
  color: #c62828;
  padding: 8px 16px;
  font-size: 14px;
  border-bottom: 1px solid #e0e0e0;
}

.users-list {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  max-height: 150px;
  overflow-y: auto;
}

.users-list h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.users-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: white;
  border-radius: 4px;
  font-size: 14px;
}

.user-item.current-user {
  background: #e3f2fd;
  color: #1976d2;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.no-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-style: italic;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  max-width: 70%;
}

.message.own-message {
  align-self: flex-end;
}

.message.other-message {
  align-self: flex-start;
}

.message-sender {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.message-content {
  background: #e0e0e0;
  padding: 8px 12px;
  border-radius: 12px;
  position: relative;
}

.own-message .message-content {
  background: #2196f3;
  color: white;
}

.message-text {
  display: block;
  word-wrap: break-word;
  line-height: 1.4;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-left: 8px;
}

.typing-indicator {
  align-self: flex-start;
  margin: 8px 0;
}

.typing-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 14px;
  color: #666;
}

.typing-dots {
  animation: typing 1.5s infinite;
}

@keyframes typing {
  0%, 60%, 100% { opacity: 0; }
  30% { opacity: 1; }
}

.message-form {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.input-container {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.input-container input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}

.input-container input:focus {
  border-color: #2196f3;
}

.input-container input:disabled {
  background: #f5f5f5;
  color: #999;
}

.send-button {
  background: #2196f3;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
  min-width: 44px;
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count, .connection-help {
  font-size: 12px;
  color: #999;
}
```

## 🚀 **Ejemplo de Integración Completa**

```jsx
// pages/MeetingRoom.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatRoom from '../components/ChatRoom';
import { meetingService } from '../services/meetingService';
import '../styles/ChatRoom.css';

const MeetingRoom = () => {
  // Obtener meetingId de la URL
  const { meetingId } = useParams();
  
  // Estados
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Datos del usuario (obtener de tu sistema de auth)
  const userId = 'user-123'; // Reemplaza con tu lógica de auth
  const username = 'Juan Pérez'; // Reemplaza con tu lógica de auth

  // Cargar información de la reunión
  useEffect(() => {
    const loadMeeting = async () => {
      try {
        setLoading(true);
        const response = await meetingService.getMeetingById(meetingId);
        setMeeting(response.data);
      } catch (err) {
        console.error('Error cargando reunión:', err);
        setError('No se pudo cargar la reunión');
      } finally {
        setLoading(false);
      }
    };

    if (meetingId) {
      loadMeeting();
    }
  }, [meetingId]);

  // Unirse a la reunión cuando se carga
  useEffect(() => {
    const joinMeeting = async () => {
      try {
        await meetingService.joinMeeting(meetingId, userId);
        console.log('✅ Te has unido a la reunión');
      } catch (err) {
        console.error('Error uniéndose a la reunión:', err);
      }
    };

    if (meeting && userId) {
      joinMeeting();
    }
  }, [meeting, meetingId, userId]);

  if (loading) {
    return <div className="loading">Cargando reunión...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!meeting) {
    return <div className="error">Reunión no encontrada</div>;
  }

  return (
    <div className="meeting-room">
      {/* Header de la reunión */}
      <div className="meeting-header">
        <h1>{meeting.title}</h1>
        <p>{meeting.description}</p>
        <div className="meeting-info">
          <span>📅 {meeting.date}</span>
          <span>🕐 {meeting.time}</span>
          <span>👥 {meeting.activeParticipants} participantes</span>
        </div>
      </div>

      <div className="meeting-content">
        {/* Sección de video (tu implementación) */}
        <div className="video-section">
          <div className="video-placeholder">
            🎥 Aquí va tu componente de video
          </div>
        </div>

        {/* Sección de chat */}
        <div className="chat-section">
          <ChatRoom 
            meetingId={meetingId}
            userId={userId}
            username={username}
          />
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
```

## 🔄 **Flujo Completo de Integración**

### Paso 1: Configurar URLs
```bash
# .env en tu frontend
VITE_CHAT_SERVER_URL=http://localhost:4001
VITE_SOCKET_URL=http://localhost:4001
```

### Paso 2: Instalar dependencias
```bash
npm install socket.io-client axios
```

### Paso 3: Crear archivos
1. `services/socketService.js` - Servicio de Socket.io
2. `services/meetingService.js` - Servicio REST API  
3. `hooks/useChat.js` - Hook para el chat
4. `components/ChatRoom.jsx` - Componente de chat
5. `styles/ChatRoom.css` - Estilos

### Paso 4: Usar en tu aplicación
```jsx
// En cualquier componente donde necesites chat
<ChatRoom 
  meetingId="abc123"
  userId="user-123" 
  username="Juan Pérez"
/>
```

## 🧪 **Funciones de Test Rápido**

```javascript
// Función para probar conectividad desde consola del navegador
window.testBackend = async () => {
  try {
    // Test REST API
    const health = await fetch('http://localhost:4001/health');
    const healthData = await health.json();
    console.log('✅ REST API:', healthData);
    
    // Test Socket.io
    const io = await import('socket.io-client');
    const socket = io.default('http://localhost:4001');
    
    socket.on('connect', () => {
      console.log('✅ Socket.io conectado:', socket.id);
      socket.disconnect();
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Socket.io error:', error.message);
    });
    
  } catch (error) {
    console.error('❌ Error de conectividad:', error);
  }
};

// Ejecutar en consola: window.testBackend()
```

## ✅ **Checklist Final**

- [ ] URLs actualizadas al puerto 4001
- [ ] Dependencies instaladas (`socket.io-client`, `axios`)
- [ ] Servicio de Socket.io configurado
- [ ] Hook de chat implementado
- [ ] Componente ChatRoom agregado
- [ ] CSS importado
- [ ] Variables de entorno configuradas
- [ ] Test de conectividad realizado

**¡Con esto tu frontend debería poder conectarse completamente al chat en tiempo real!**
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
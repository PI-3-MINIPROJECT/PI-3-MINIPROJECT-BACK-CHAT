# Architecture - API Gateway Pattern

## 🏗️ System Overview

```
┌──────────────────────────────────────────────────────┐
│           Frontend (React - Port 5173)               │
│   - Only connects to User Backend                   │
│   - VITE_API_URL=http://localhost:3000              │
└─────────────────────┬────────────────────────────────┘
                      │
                      │ HTTP + WebSocket
                      │ (All requests)
                      ↓
┌──────────────────────────────────────────────────────┐
│      User Backend (API Gateway - Port 3000)          │
│      PI-3-MINIPROJECT-BACK                           │
│                                                      │
│  Responsibilities:                                   │
│  ✅ Authentication (login, register, logout)        │
│  ✅ User management (CRUD)                          │
│  ✅ Session validation (cookies)                    │
│  ✅ Proxy to Chat Backend                           │
│                                                      │
│  Environment:                                        │
│  - CHAT_BACKEND_URL=http://localhost:4000           │
└─────────────────────┬────────────────────────────────┘
                      │
                      │ HTTP (Internal)
                      │ Proxied requests
                      ↓
┌──────────────────────────────────────────────────────┐
│     Chat Backend (Microservice - Port 4000)          │
│     PI-3-MINIPROJECT-BACK-CHAT (THIS)                │
│                                                      │
│  Responsibilities:                                   │
│  ✅ Meeting CRUD                                     │
│  ✅ Real-time chat (Socket.io)                      │
│  ✅ Participant management                          │
│  ✅ Firestore storage                               │
│                                                      │
│  Security:                                           │
│  - TRUSTS User Backend (internal service)           │
│  - Does NOT validate authentication                 │
│                                                      │
│  Environment:                                        │
│  - CORS_ORIGIN includes User Backend                │
└──────────────────────────────────────────────────────┘
```

## 🔄 Request Flow

### Creating a Meeting

```
1. Frontend
   POST http://localhost:3000/api/meetings
   Headers: Cookie: session=xxx
   Body: { title, description }
   
2. User Backend (API Gateway)
   ├─ Validates session cookie ✅
   ├─ Extracts: userId = req.user.uid
   │
   └─► HTTP Request to Chat Backend
       POST http://localhost:4000/api/meetings
       Body: { userId, title, description }
       
3. Chat Backend (This Server)
   ├─ No authentication needed (User Backend already validated)
   ├─ Generates meetingId
   ├─ Saves to Firestore
   └─► Returns meeting data
   
4. User Backend → Frontend
   Returns meeting data
```

### Real-time Chat

```
1. Frontend connects Socket.io
   ws://localhost:3000
   (User Backend - NOT Chat Backend)
   
2. User Backend
   ├─ Validates session
   └─► Relays to Chat Backend
       ws://localhost:4000
       
3. Chat Backend
   ├─ Manages Socket.io rooms
   ├─ Broadcasts messages
   └─ Real-time communication
```

## 📊 Data Flow

### Participants

**Firestore (Persistent):**
```javascript
meetings/{meetingId}/
  participants: ["user1", "user2", "user3"]  // Historical
  activeParticipants: 2                       // Real-time count
```

**Memory (Real-time):**
```javascript
meetingRooms.get("meeting123")
// [{ socketId, userId, username, joinedAt }]
// Only currently connected users
```

### Messages

```
❌ NOT stored in database
✅ Real-time only via Socket.io
✅ Lost when session ends
```

## 🔐 Security Model

### User Backend (Security Boundary)
- Validates ALL authentication
- Verifies cookies and sessions
- Adds userId to proxied requests
- Acts as trusted gateway

### Chat Backend (Trusted Zone)
- Receives only from User Backend
- TRUSTS provided userId
- No authentication validation needed
- Internal microservice

## 🌐 Environment Variables

### User Backend
```env
PORT=3000
CHAT_BACKEND_URL=http://localhost:4000  # Required for proxy
CORS_ORIGIN=http://localhost:5173
```

### Chat Backend (This)
```env
PORT=4000
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
MAX_PARTICIPANTS=10
```

## 💡 Benefits

1. **Single Entry Point:** Frontend only knows User Backend
2. **Security:** Authentication centralized in User Backend
3. **Flexibility:** Chat Backend can change without frontend impact
4. **Scalability:** Services scale independently
5. **Simplicity:** Clear separation of concerns

---

**API Gateway Pattern:** Frontend → User Backend → Chat Backend


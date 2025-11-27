# PI-3 Miniproject Chat Server

Real-time chat microservice for video conference platform. Works behind **User Backend API Gateway**.

## 🏗️ Architecture

```
Frontend → User Backend (API Gateway) → Chat Backend (This)
            Port 3000                     Port 4000
```

**Frontend NEVER connects directly to this server.** All requests go through User Backend.

## ✨ Features

- ✅ CRUD de reuniones (CREATE, READ, UPDATE, DELETE)
- ✅ Chat en tiempo real con Socket.io
- ✅ Soporte 2-10 participantes por reunión
- ✅ Mensajes en tiempo real (NO guardados en BD)
- ✅ Participantes históricos en Firestore
- ✅ Participantes activos en memoria
- ✅ TypeScript + Express + Socket.io
- ✅ Documentado con JSDoc
- ✅ Listo para Render

## 📊 Data Storage

### Firestore (Persistent)
```javascript
meetings/{meetingId}/
  - meetingId: string
  - hostId: string
  - title: string
  - description: string
  - participants: string[]      // ALL users who ever joined
  - activeParticipants: number  // Currently online count
  - createdAt: timestamp
  - updatedAt: timestamp
  - status: "active" | "ended"
```

### Memory (Real-time)
```javascript
meetingRooms = Map {
  "meeting123": [
    { socketId, userId, username, joinedAt }
  ]
}
```

### Messages
❌ **NOT stored in database** - Real-time only via Socket.io

## 🚀 Quick Start

### 1. Install
```bash
npm install
```

### 2. Configure
Copy `env.example` to `.env` and configure:

```env
PORT=4000
NODE_ENV=development

# Firebase (same project as User Backend)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_STORAGE_BUCKET=your-bucket

# CORS (allow User Backend)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Limits
MAX_PARTICIPANTS=10
MIN_PARTICIPANTS=2
```

### 3. Run
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📡 API Endpoints

**Note:** These endpoints are called by User Backend, not directly by Frontend.

### Meetings

```
POST   /api/meetings
Body: { userId, title, description }
→ Create meeting

GET    /api/meetings/user/:userId
→ Get user's meetings

GET    /api/meetings/:meetingId
→ Get meeting info

PUT    /api/meetings/:meetingId
Body: { userId, title, description, status }
→ Update meeting

DELETE /api/meetings/:meetingId
Body: { userId }
→ Delete meeting (host only)

POST   /api/meetings/:meetingId/join
Body: { userId }
→ Join meeting

POST   /api/meetings/:meetingId/leave
Body: { userId }
→ Leave meeting
```

### Stats

```
GET    /api/chat/stats
→ Server statistics
```

## 🔌 Socket.io Events

### Client → Server

```javascript
// Join meeting
socket.emit('join:meeting', {
  meetingId: 'abc123',
  userId: 'user123',
  username: 'John Doe'
});

// Send message (real-time only, not saved)
socket.emit('chat:message', {
  meetingId: 'abc123',
  userId: 'user123',
  username: 'John Doe',
  message: 'Hello!'
});

// Leave meeting
socket.emit('leave:meeting', 'abc123');

// Typing indicators
socket.emit('typing:start', { meetingId, userId, username });
socket.emit('typing:stop', { meetingId, userId, username });
```

### Server → Client

```javascript
// User joined
socket.on('user:joined', (data) => {
  // { userId, username, timestamp }
});

// User left
socket.on('user:left', (data) => {
  // { userId, username, timestamp }
});

// Users currently online
socket.on('users:online', (data) => {
  // { meetingId, participants: [...], count }
});

// Chat message (real-time, not saved)
socket.on('chat:message', (message) => {
  // { messageId, meetingId, userId, username, message, timestamp }
});

// Typing indicators
socket.on('typing:start', (data) => {
  // { userId, username }
});

socket.on('typing:stop', (data) => {
  // { userId, username }
});

// Errors
socket.on('error', (error) => {
  // { message }
});
```

## 🔐 Security

This is an **internal microservice** that trusts User Backend:

- ✅ User Backend validates ALL authentication
- ✅ User Backend adds userId to requests
- ✅ This server trusts the userId is valid
- ✅ No direct frontend access

## 📦 Project Structure

```
src/
├── config/
│   ├── firebase.ts       # Firebase Admin SDK
│   └── socket.ts         # Socket.io server
├── controllers/
│   ├── chatController.ts    # Stats endpoints
│   └── meetingController.ts # Meeting CRUD
├── services/
│   └── chatService.ts    # Business logic
├── routes/
│   ├── chatRoutes.ts     # Stats routes
│   └── meetingRoutes.ts  # Meeting routes
├── middlewares/
│   └── errorHandler.ts   # Error handling
├── types/
│   └── index.ts          # TypeScript types
├── utils/
│   └── logger.ts         # Logging utility
└── server.ts             # Main server
```

## 🌐 Deployment (Render)

### Auto Deploy
1. Connect GitHub repo to Render
2. Render detects `render.yaml`
3. Set environment variables
4. Deploy!

### Environment Variables (Render)
```env
NODE_ENV=production
PORT=4000
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_STORAGE_BUCKET=...
CORS_ORIGIN=https://frontend.vercel.app,https://user-backend.onrender.com
MAX_PARTICIPANTS=10
MIN_PARTICIPANTS=2
```

## 🔄 How It Works

### 1. User Creates Meeting (via User Backend)
```
User Backend → POST /api/meetings
              { userId, title, description }
              ↓
This Server:
  - Generates meetingId
  - Saves to Firestore
  - Returns meeting data
```

### 2. User Joins Chat
```
Socket.io connection
  ↓
emit('join:meeting', { meetingId, userId })
  ↓
This Server:
  - Adds to in-memory list (real-time)
  - Adds to Firestore participants[] (historical)
  - Updates activeParticipants count
  - Notifies all: users:online
```

### 3. User Sends Message
```
emit('chat:message', { meetingId, userId, message })
  ↓
This Server:
  - ❌ Does NOT save to database
  - ✅ Broadcasts to all in room
  - Real-time only
```

### 4. User Disconnects
```
Socket disconnects
  ↓
This Server:
  - Removes from in-memory list
  - Keeps in Firestore participants[] (historical record)
  - Updates activeParticipants count
  - Notifies others: user:left
```

## 💡 Key Concepts

### Participants: Two Lists

1. **Historical (Firestore):**
   - `participants: ["user1", "user2", "user3"]`
   - ALL users who ever joined
   - Never removed
   - For statistics and records

2. **Active (Memory):**
   - `meetingRooms.get("meeting123")`
   - ONLY currently connected users
   - Removed on disconnect
   - For real-time features

### Messages: Real-time Only

- ✅ Sent via Socket.io
- ❌ NOT saved to database
- ❌ NO history after session ends
- Perfect for live chat during meetings

## 🧪 Testing

```bash
# Start server
npm run dev

# Test meeting creation (via User Backend)
curl -X POST http://localhost:3000/api/meetings \
  -H "Content-Type: application/json" \
  -H "Cookie: session=xxx" \
  -d '{"title":"Test","description":"Test"}'

# Check server stats
curl http://localhost:4000/api/chat/stats
```

## 📚 Tech Stack

- Node.js 18+
- TypeScript
- Express.js
- Socket.io 4.7
- Firebase Admin SDK
- Helmet (security)
- Morgan (logging)
- CORS

## 📄 License

ISC

---

**Internal Microservice** - Accessed only through User Backend API Gateway

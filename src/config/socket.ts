import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { 
  SocketEvents, 
  OnlineUser, 
  ChatMessage, 
  JoinMeetingPayload, 
  TypingPayload 
} from '../types';
import { ChatService } from '../services/chatService';
import { logger } from '../utils/logger';

const chatService = new ChatService();

// Store online users by meeting (in memory - real-time only)
const meetingRooms = new Map<string, OnlineUser[]>();

// Configuration constants
const MAX_PARTICIPANTS = parseInt(process.env.MAX_PARTICIPANTS || '10', 10);
const MIN_PARTICIPANTS = parseInt(process.env.MIN_PARTICIPANTS || '2', 10);

/**
 * Initialize Socket.IO server
 * @param {HTTPServer} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export const initializeSocketIO = (httpServer: HTTPServer): Server => {
  const corsOriginEnv = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const allowedOrigins = corsOriginEnv === '*' 
    ? '*' 
    : corsOriginEnv.split(',').map(origin => origin.trim());

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: allowedOrigins !== '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  /**
   * Handle socket connection
   * @param {Socket} socket - Socket instance
   */
  io.on(SocketEvents.CONNECTION, (socket: Socket) => {
    logger.info(`New connection: ${socket.id}`);

    /**
     * Handle user joining a meeting
     */
    socket.on(SocketEvents.JOIN_MEETING, async (payload: JoinMeetingPayload) => {
      try {
        const { meetingId, userId, username } = payload;

        if (!meetingId || !userId) {
          socket.emit(SocketEvents.ERROR, {
            message: 'Meeting ID and User ID are required',
          });
          return;
        }

        // Check if meeting exists
        const meetingExists = await chatService.meetingExists(meetingId);
        if (!meetingExists) {
          socket.emit(SocketEvents.ERROR, {
            message: 'Meeting not found',
          });
          return;
        }

        // Get current participants in the meeting (real-time, in memory)
        const currentParticipants = meetingRooms.get(meetingId) || [];

        // Check if meeting is full
        if (currentParticipants.length >= MAX_PARTICIPANTS) {
          socket.emit(SocketEvents.ERROR, {
            message: `Meeting is full (maximum ${MAX_PARTICIPANTS} participants)`,
          });
          return;
        }

        // Check if user is already connected (avoid duplicates in real-time list)
        const existingUser = currentParticipants.find(u => u.userId === userId);
        if (existingUser) {
          // Update socket ID if user reconnects
          existingUser.socketId = socket.id;
        } else {
          // Add new user to real-time list
          const newUser: OnlineUser = {
            socketId: socket.id,
            userId,
            meetingId,
            username,
            joinedAt: new Date().toISOString(),
          };
          currentParticipants.push(newUser);
        }

        // Update meeting rooms (real-time, in memory)
        meetingRooms.set(meetingId, currentParticipants);

        // Join the socket room
        socket.join(meetingId);

        // Add user to participants in Firestore if not already there
        // This keeps a persistent record of everyone who has connected
        await chatService.addParticipantToMeeting(meetingId, userId);

        // Update active participants count in Firestore (real-time count)
        await chatService.updateActiveParticipants(meetingId, currentParticipants.length);

        // Notify all users in the meeting about who is currently online (real-time)
        io.to(meetingId).emit(SocketEvents.USERS_ONLINE, {
          meetingId,
          participants: currentParticipants.map(p => ({
            userId: p.userId,
            username: p.username,
            joinedAt: p.joinedAt,
          })),
          count: currentParticipants.length,
        });

        // Notify others that a new user joined
        socket.to(meetingId).emit(SocketEvents.USER_JOINED, {
          userId,
          username,
          timestamp: new Date().toISOString(),
        });

        logger.success(`User ${userId} joined meeting ${meetingId}`);

      } catch (error) {
        logger.error('Error joining meeting', error);
        socket.emit(SocketEvents.ERROR, {
          message: 'Failed to join meeting',
        });
      }
    });

    /**
     * Handle chat message (real-time only, not saved to database)
     */
    socket.on(SocketEvents.CHAT_MESSAGE, async (payload: Partial<ChatMessage>) => {
      try {
        const { meetingId, userId, message } = payload;

        if (!meetingId || !userId || !message) {
          socket.emit(SocketEvents.ERROR, {
            message: 'Meeting ID, User ID, and message are required',
          });
          return;
        }

        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
          return;
        }

        // Get user info from real-time list
        const participants = meetingRooms.get(meetingId) || [];
        const user = participants.find(p => p.socketId === socket.id || p.userId === userId);

        const chatMessage: ChatMessage = {
          messageId: `${Date.now()}_${socket.id}`,
          meetingId,
          userId,
          username: user?.username || payload.username,
          message: trimmedMessage,
          timestamp: new Date().toISOString(),
        };

        // Broadcast message to all users in the meeting (real-time only, not saved)
        io.to(meetingId).emit(SocketEvents.CHAT_MESSAGE, chatMessage);

        logger.info(`Message sent in meeting ${meetingId} by user ${userId}`);

      } catch (error) {
        logger.error('Error sending message', error);
        socket.emit(SocketEvents.ERROR, {
          message: 'Failed to send message',
        });
      }
    });

    /**
     * Handle typing indicator start
     */
    socket.on(SocketEvents.TYPING_START, (payload: TypingPayload) => {
      const { meetingId, userId, username } = payload;
      
      if (!meetingId || !userId) {
        return;
      }

      // Broadcast to others in the meeting (not to sender)
      socket.to(meetingId).emit(SocketEvents.TYPING_START, {
        userId,
        username,
      });
    });

    /**
     * Handle typing indicator stop
     */
    socket.on(SocketEvents.TYPING_STOP, (payload: TypingPayload) => {
      const { meetingId, userId, username } = payload;
      
      if (!meetingId || !userId) {
        return;
      }

      // Broadcast to others in the meeting (not to sender)
      socket.to(meetingId).emit(SocketEvents.TYPING_STOP, {
        userId,
        username,
      });
    });

    /**
     * Handle user leaving a meeting
     */
    socket.on(SocketEvents.LEAVE_MEETING, async (meetingId: string) => {
      await handleUserLeave(socket, meetingId, io);
    });

    /**
     * Handle socket disconnection
     */
    socket.on(SocketEvents.DISCONNECT, async () => {
      logger.info(`Disconnected: ${socket.id}`);

      // Find and remove user from all meetings (real-time list)
      for (const [meetingId, participants] of meetingRooms.entries()) {
        const userIndex = participants.findIndex(p => p.socketId === socket.id);
        
        if (userIndex !== -1) {
          await handleUserLeave(socket, meetingId, io);
          break;
        }
      }
    });
  });

  return io;
};

/**
 * Handle user leaving a meeting
 * @param {Socket} socket - Socket instance
 * @param {string} meetingId - Meeting ID
 * @param {Server} io - Socket.IO server instance
 */
async function handleUserLeave(socket: Socket, meetingId: string, io: Server): Promise<void> {
  try {
    const participants = meetingRooms.get(meetingId);
    
    if (!participants) {
      return;
    }

    const userIndex = participants.findIndex(p => p.socketId === socket.id);
    
    if (userIndex === -1) {
      return;
    }

    const user = participants[userIndex];
    
    // Remove from real-time list (in memory)
    participants.splice(userIndex, 1);

    // Update meeting rooms (real-time)
    if (participants.length === 0) {
      meetingRooms.delete(meetingId);
    } else {
      meetingRooms.set(meetingId, participants);
    }

    // Leave the socket room
    socket.leave(meetingId);

    // Notify others in the meeting
    io.to(meetingId).emit(SocketEvents.USER_LEFT, {
      userId: user.userId,
      username: user.username,
      timestamp: new Date().toISOString(),
    });

    // Update online users list (real-time)
    io.to(meetingId).emit(SocketEvents.USERS_ONLINE, {
      meetingId,
      participants: participants.map(p => ({
        userId: p.userId,
        username: p.username,
        joinedAt: p.joinedAt,
      })),
      count: participants.length,
    });

    // Update active participants count in Firestore (real-time count)
    await chatService.updateActiveParticipants(meetingId, participants.length);

    logger.info(`User ${user.userId} left meeting ${meetingId}`);

  } catch (error) {
    logger.error('Error handling user leave', error);
  }
}

/**
 * Get active meetings count
 * @returns {number} Number of active meetings
 */
export const getActiveMeetingsCount = (): number => {
  return meetingRooms.size;
};

/**
 * Get total users count (currently connected)
 * @returns {number} Total number of connected users
 */
export const getTotalUsersCount = (): number => {
  let total = 0;
  for (const participants of meetingRooms.values()) {
    total += participants.length;
  }
  return total;
};

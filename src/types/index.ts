/**
 * Type definitions for the chat server
 * @module types
 */

/**
 * User information in a chat room
 * @interface OnlineUser
 */
export interface OnlineUser {
  socketId: string;
  userId: string;
  meetingId: string;
  username?: string;
  joinedAt: string;
}

/**
 * Chat message payload
 * @interface ChatMessage
 */
export interface ChatMessage {
  messageId: string;
  meetingId: string;
  userId: string;
  username?: string;
  message: string;
  timestamp: string;
}

/**
 * Meeting room information
 * @interface MeetingRoom
 */
export interface MeetingRoom {
  meetingId: string;
  participants: OnlineUser[];
  createdAt: string;
  maxParticipants: number;
}

/**
 * Socket event names
 * @enum SocketEvents
 */
export enum SocketEvents {
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  JOIN_MEETING = 'join:meeting',
  LEAVE_MEETING = 'leave:meeting',
  CHAT_MESSAGE = 'chat:message',
  USER_JOINED = 'user:joined',
  USER_LEFT = 'user:left',
  USERS_ONLINE = 'users:online',
  ERROR = 'error',
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
}

/**
 * Join meeting payload
 * @interface JoinMeetingPayload
 */
export interface JoinMeetingPayload {
  meetingId: string;
  userId: string;
  username?: string;
}

/**
 * Typing indicator payload
 * @interface TypingPayload
 */
export interface TypingPayload {
  meetingId: string;
  userId: string;
  username?: string;
}

/**
 * Error response interface
 * @interface ErrorResponse
 */
export interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
}

/**
 * Meeting data interface
 * @interface Meeting
 */
export interface Meeting {
  meetingId: string;
  hostId: string;
  title: string;
  description: string;
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:mm
  estimatedDuration: number; // Duration in minutes
  maxParticipants: number;
  participants: string[]; // Array of user IDs who have joined
  activeParticipants: number; // Currently online participants
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'cancelled';
}

/**
 * Create meeting request interface
 * @interface CreateMeetingRequest
 */
export interface CreateMeetingRequest {
  userId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  estimatedDuration?: number;
  maxParticipants?: number;
}

/**
 * Update meeting request interface
 * @interface UpdateMeetingRequest
 */
export interface UpdateMeetingRequest {
  userId: string;
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  estimatedDuration?: number;
  maxParticipants?: number;
  status?: 'active' | 'completed' | 'cancelled';
}

/**
 * Success response interface
 * @interface SuccessResponse
 */
export interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
}


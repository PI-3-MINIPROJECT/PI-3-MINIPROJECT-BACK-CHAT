/**
 * Type definitions for the chat server
 * @module types
 */

/**
 * User information in a chat room
 * @interface OnlineUser
 */
export interface OnlineUser {
  /** Socket.IO connection ID */
  socketId: string;
  /** User ID from authentication system */
  userId: string;
  /** Meeting ID the user is connected to */
  meetingId: string;
  /** Optional username for display */
  username?: string;
  /** ISO timestamp when user joined */
  joinedAt: string;
}

/**
 * Chat message payload
 * @interface ChatMessage
 */
export interface ChatMessage {
  /** Unique message identifier */
  messageId: string;
  /** Meeting ID where message was sent */
  meetingId: string;
  /** User ID who sent the message */
  userId: string;
  /** Optional username for display */
  username?: string;
  /** Message content */
  message: string;
  /** ISO timestamp when message was sent */
  timestamp: string;
}

/**
 * Meeting room information
 * @interface MeetingRoom
 */
export interface MeetingRoom {
  /** Meeting identifier */
  meetingId: string;
  /** Array of currently online users */
  participants: OnlineUser[];
  /** ISO timestamp when room was created */
  createdAt: string;
  /** Maximum number of participants allowed */
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
 * Join meeting payload for Socket.IO events
 * @interface JoinMeetingPayload
 */
export interface JoinMeetingPayload {
  /** Meeting ID to join */
  meetingId: string;
  /** User ID joining the meeting */
  userId: string;
  /** Optional username for display */
  username?: string;
}

/**
 * Typing indicator payload for Socket.IO events
 * @interface TypingPayload
 */
export interface TypingPayload {
  /** Meeting ID where user is typing */
  meetingId: string;
  /** User ID who is typing */
  userId: string;
  /** Optional username for display */
  username?: string;
}

/**
 * Error response interface for HTTP error responses
 * @interface ErrorResponse
 */
export interface ErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Error message describing what went wrong */
  message: string;
  /** HTTP status code (400, 404, 500, etc.) */
  statusCode: number;
}

/**
 * Meeting data interface
 * @interface Meeting
 */
export interface Meeting {
  /** Unique meeting identifier */
  meetingId: string;
  /** User ID of the meeting host */
  hostId: string;
  /** Meeting title */
  title: string;
  /** Meeting description */
  description: string;
  /** Meeting date in YYYY-MM-DD format */
  date: string;
  /** Meeting time in HH:mm format */
  time: string;
  /** Estimated duration in minutes */
  estimatedDuration: number;
  /** Maximum number of participants allowed */
  maxParticipants: number;
  /** Array of user IDs who have ever joined (historical record) */
  participants: string[];
  /** Number of currently online participants (real-time) */
  activeParticipants: number;
  /** ISO timestamp when meeting was created */
  createdAt: string;
  /** ISO timestamp when meeting was last updated */
  updatedAt: string;
  /** Meeting status */
  status: 'active' | 'completed' | 'cancelled';
}

/**
 * Create meeting request interface for POST /api/meetings
 * @interface CreateMeetingRequest
 */
export interface CreateMeetingRequest {
  /** User ID of the meeting host */
  userId: string;
  /** Meeting title (required) */
  title: string;
  /** Optional meeting description */
  description?: string;
  /** Meeting date in YYYY-MM-DD format (required) */
  date: string;
  /** Meeting time in HH:mm format (required) */
  time: string;
  /** Optional estimated duration in minutes (default: 60) */
  estimatedDuration?: number;
  /** Optional maximum participants (default: from env MAX_PARTICIPANTS) */
  maxParticipants?: number;
}

/**
 * Update meeting request interface for PUT /api/meetings/:meetingId
 * @interface UpdateMeetingRequest
 */
export interface UpdateMeetingRequest {
  /** User ID making the request (must be host) */
  userId: string;
  /** Optional new meeting title */
  title?: string;
  /** Optional new meeting description */
  description?: string;
  /** Optional new meeting date in YYYY-MM-DD format */
  date?: string;
  /** Optional new meeting time in HH:mm format */
  time?: string;
  /** Optional new estimated duration in minutes */
  estimatedDuration?: number;
  /** Optional new maximum participants */
  maxParticipants?: number;
  /** Optional new meeting status */
  status?: 'active' | 'completed' | 'cancelled';
}

/**
 * Success response interface for HTTP success responses
 * @interface SuccessResponse
 * @template T - Type of the data payload
 */
export interface SuccessResponse<T = any> {
  /** Always true for success responses */
  success: true;
  /** Optional success message */
  message?: string;
  /** Optional response data payload */
  data?: T;
}


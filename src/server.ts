// IMPORTANT: Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { initializeFirebase } from './config/firebase';
import { initializeSocketIO } from './config/socket';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import chatRoutes from './routes/chatRoutes';
import meetingRoutes from './routes/meetingRoutes';
import { logger } from './utils/logger';

/**
 * Main server application class
 * @class App
 */
class App {
  public app: Application;
  public server: any;
  public io: Server | null = null;
  private readonly PORT: number;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.PORT = parseInt(process.env.PORT || '4000', 10);
    
    this.initializeMiddlewares();
    this.initializeFirebase();
    this.initializeRoutes();
    this.initializeSocketIO();
    this.initializeErrorHandling();
  }

  /**
   * Initialize Express middlewares
   * @private
   */
  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration - Supports multiple origins
    const corsOriginEnv = process.env.CORS_ORIGIN || 'http://localhost:5173';
    
    // Parse multiple origins separated by comma
    const allowedOrigins = corsOriginEnv === '*' 
      ? '*' 
      : corsOriginEnv.split(',').map(origin => origin.trim());
    
    this.app.use(
      cors({
        origin: (origin, callback) => {
          // If *, allow any origin (without credentials)
          if (allowedOrigins === '*') {
            return callback(null, true);
          }
          
          // Allow requests without origin (Postman, mobile apps, same origin)
          if (!origin) {
            return callback(null, true);
          }
          
          // Check if origin is in allowed list
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
          }
        },
        credentials: allowedOrigins === '*' ? false : true,
      })
    );

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    if (process.env.NODE_ENV !== 'production') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }
  }

  /**
   * Initialize Firebase Admin SDK
   * @private
   */
  private initializeFirebase(): void {
    try {
      initializeFirebase();
      logger.success('Firebase initialized successfully');
    } catch (error) {
      logger.error('Error initializing Firebase:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize API routes
   * @private
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'ok',
        service: 'chat-server',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // API routes
    this.app.use('/api/chat', chatRoutes);
    this.app.use('/api/meetings', meetingRoutes);

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.status(200).json({
        service: 'PI-3 Miniproject Chat Server',
        version: '1.0.0',
        description: 'Real-time chat server with Socket.io and Firebase',
        endpoints: {
          health: '/health',
          stats: '/api/chat/stats',
          meetings: {
            create: 'POST /api/meetings',
            list: 'GET /api/meetings/user/:userId',
            get: 'GET /api/meetings/:meetingId',
            update: 'PUT /api/meetings/:meetingId',
            delete: 'DELETE /api/meetings/:meetingId',
            join: 'POST /api/meetings/:meetingId/join',
            leave: 'POST /api/meetings/:meetingId/leave',
          },
        },
        socketEvents: {
          join: 'join:meeting',
          leave: 'leave:meeting',
          message: 'chat:message',
          typing_start: 'typing:start',
          typing_stop: 'typing:stop',
        },
      });
    });
  }

  /**
   * Initialize Socket.IO for real-time communication
   * @private
   */
  private initializeSocketIO(): void {
    this.io = initializeSocketIO(this.server);
    logger.success('Socket.IO initialized successfully');
  }

  /**
   * Initialize error handling middlewares
   * @private
   */
  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   * @public
   */
  public listen(): void {
    this.server.listen(this.PORT, () => {
      logger.success(`Server running on port ${this.PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${this.PORT}/health`);
      logger.info(`Socket.IO ready for connections`);
    });
  }
}

// Create and start the application
const app = new App();
app.listen();

// Export for testing purposes
export default app;


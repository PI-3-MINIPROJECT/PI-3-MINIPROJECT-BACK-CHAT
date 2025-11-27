import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * Middleware to validate authentication by checking with User Backend
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export const validateAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:3000';
    
    // Get cookies from request
    const cookies = req.headers.cookie;

    if (!cookies) {
      throw createError('No authentication cookie provided', 401);
    }

    // Validate session with User Backend
    const response = await fetch(`${userBackendUrl}/api/auth/validate`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw createError('Invalid or expired session', 401);
    }

    const data = await response.json();
    
    // Attach user info to request
    req.user = data.user;

    next();
  } catch (error: any) {
    if (error.statusCode) {
      next(error);
    } else {
      logger.error('Error validating authentication', error);
      next(createError('Authentication failed', 401));
    }
  }
};

/**
 * Optional auth middleware - doesn't fail if no auth
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userBackendUrl = process.env.USER_BACKEND_URL || 'http://localhost:3000';
    const cookies = req.headers.cookie;

    if (cookies) {
      const response = await fetch(`${userBackendUrl}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Cookie': cookies,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        req.user = data.user;
      }
    }

    next();
  } catch (error) {
    // Fail silently, just continue without user
    next();
  }
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}


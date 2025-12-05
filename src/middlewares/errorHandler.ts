import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom error class for application errors
 * Extends Error and adds HTTP status code
 * @class AppError
 * @extends {Error}
 */
export class AppError extends Error {
  /** HTTP status code for the error */
  statusCode: number;

  /**
   * Create a new AppError instance
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (400, 404, 500, etc.)
   * @constructor
   */
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a custom error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {AppError} Custom error instance
 */
export const createError = (message: string, statusCode: number): AppError => {
  return new AppError(message, statusCode);
};

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error(`Error: ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Not found handler middleware
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};


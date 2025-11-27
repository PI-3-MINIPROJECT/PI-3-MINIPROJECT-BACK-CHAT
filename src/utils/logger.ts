/**
 * Logger utility for consistent logging
 * @module utils/logger
 */

/**
 * Log levels
 * @enum LogLevel
 */
enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

/**
 * Log a message with timestamp
 * @param {LogLevel} level - Log level
 * @param {string} message - Message to log
 * @param {any} data - Additional data to log
 */
const log = (level: LogLevel, message: string, data?: any): void => {
  const timestamp = new Date().toISOString();
  const emoji = {
    [LogLevel.INFO]: '📡',
    [LogLevel.WARN]: '⚠️',
    [LogLevel.ERROR]: '❌',
    [LogLevel.SUCCESS]: '✅',
  }[level];

  console.log(`${emoji} [${timestamp}] [${level}] ${message}`);
  
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

/**
 * Logger object with methods for different log levels
 */
export const logger = {
  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {any} data - Additional data
   */
  info: (message: string, data?: any): void => log(LogLevel.INFO, message, data),

  /**
   * Log warning message
   * @param {string} message - Message to log
   * @param {any} data - Additional data
   */
  warn: (message: string, data?: any): void => log(LogLevel.WARN, message, data),

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {any} data - Additional data
   */
  error: (message: string, data?: any): void => log(LogLevel.ERROR, message, data),

  /**
   * Log success message
   * @param {string} message - Message to log
   * @param {any} data - Additional data
   */
  success: (message: string, data?: any): void => log(LogLevel.SUCCESS, message, data),
};


/**
 * @fileoverview Simple logging utility with timestamped, colored console output
 * @module utils/logger
 */

/**
 * Logger utility class for formatted console logging
 * Provides different log levels with emoji indicators and timestamps
 * @class Logger
 */
export class Logger {
  /**
   * Formats current timestamp in ISO format
   * @returns {string} ISO formatted timestamp
   * @private
   */
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Logs an informational message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments to log
   * @returns {void}
   */
  static info(message: string, ...args: any[]): void {
    console.log(`[${this.formatTimestamp()}] ℹ️  INFO: ${message}`, ...args);
  }

  /**
   * Logs a success message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments to log
   * @returns {void}
   */
  static success(message: string, ...args: any[]): void {
    console.log(`[${this.formatTimestamp()}] ✅ SUCCESS: ${message}`, ...args);
  }

  /**
   * Logs an error message
   * Optionally includes error object details
   * @param {string} message - Error message to log
   * @param {any} [error] - Optional error object to log
   * @returns {void}
   */
  static error(message: string, error?: any): void {
    console.error(`[${this.formatTimestamp()}] ❌ ERROR: ${message}`);
    if (error) {
      console.error(error);
    }
  }

  /**
   * Logs a warning message
   * @param {string} message - Warning message to log
   * @param {...any} args - Additional arguments to log
   * @returns {void}
   */
  static warn(message: string, ...args: any[]): void {
    console.warn(`[${this.formatTimestamp()}] ⚠️  WARN: ${message}`, ...args);
  }

  /**
   * Logs a debug message
   * Only logs in development environment (NODE_ENV === 'development')
   * @param {string} message - Debug message to log
   * @param {...any} args - Additional arguments to log
   * @returns {void}
   */
  static debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.formatTimestamp()}] 🔍 DEBUG: ${message}`, ...args);
    }
  }
}

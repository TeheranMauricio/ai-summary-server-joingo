export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  static info(message: string, ...args: any[]) {
    console.log(`[${this.formatTimestamp()}] ℹ️  INFO: ${message}`, ...args);
  }

  static success(message: string, ...args: any[]) {
    console.log(`[${this.formatTimestamp()}] ✅ SUCCESS: ${message}`, ...args);
  }

  static error(message: string, error?: any) {
    console.error(`[${this.formatTimestamp()}] ❌ ERROR: ${message}`);
    if (error) {
      console.error(error);
    }
  }

  static warn(message: string, ...args: any[]) {
    console.warn(`[${this.formatTimestamp()}] ⚠️  WARN: ${message}`, ...args);
  }

  static debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.formatTimestamp()}] 🔍 DEBUG: ${message}`, ...args);
    }
  }
}
/**
 * @fileoverview Application configuration loaded from environment variables
 * @module config
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Application configuration object
 * Loads settings from environment variables with fallback defaults
 */
export const config = {
  /** Server port number */
  port: process.env.PORT || 4000,

  /** Node environment (development, production, etc.) */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** OpenAI API configuration */
  openai: {
    /** OpenAI API key for transcription service */
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  /** Anthropic Claude API configuration */
  anthropic: {
    /** Anthropic API key for AI summarization */
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },

  /** Email service configuration */
  email: {
    /** Email service provider (e.g., 'gmail') */
    service: process.env.EMAIL_SERVICE || 'gmail',
    /** Email account username */
    user: process.env.EMAIL_USER || '',
    /** Email account password or app-specific password */
    password: process.env.EMAIL_PASSWORD || '',
    /** SMTP server configuration */
    smtp: {
      /** SMTP server host */
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      /** SMTP server port */
      port: parseInt(process.env.SMTP_PORT || '587'),
      /** Whether to use TLS/SSL */
      secure: process.env.SMTP_SECURE === 'true',
    }
  },

  /** CORS configuration */
  cors: {
    /** Allowed origins for CORS requests */
    origins: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.VOICE_SERVER_URL || 'http://localhost:3001',
      process.env.CHAT_SERVER_URL || 'http://localhost:3002',
    ]
  }
};

/**
 * Validates critical configuration values
 * Exits the process if required configuration is missing
 * @throws {Error} Exits process with code 1 if validation fails
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (!config.anthropic.apiKey) {
    errors.push('ANTHROPIC_API_KEY is required');
  }

  if (!config.email.user || !config.email.password) {
    errors.push('EMAIL_USER and EMAIL_PASSWORD are required');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log('✅ Configuration validated successfully');
}

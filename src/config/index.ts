import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
    }
  },
  
  cors: {
    origins: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.VOICE_SERVER_URL || 'http://localhost:3001',
      process.env.CHAT_SERVER_URL || 'http://localhost:3002',
    ]
  }
};

// Validar configuración crítica
export function validateConfig() {
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
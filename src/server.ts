/**
 * @fileoverview Main server file for JoinGo AI Summary Server
 * Handles WebSocket connections via Socket.IO, REST API endpoints, and meeting data processing
 *
 * This server provides:
 * - Real-time audio transcription using OpenAI Whisper
 * - AI-powered meeting summaries using Anthropic Claude
 * - Email distribution of summaries
 * - WebSocket event handling for meeting lifecycle
 * - REST API for meeting data retrieval
 *
 * @module server
 * @author DVVID-G
 */

import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import { config, validateConfig } from './config';
import { Logger } from './utils/logger';

// Services
import { StorageService } from './services/storage.service';
import { TranscriptionService } from './services/transcription.service';
import { SummarizerService } from './services/summarizer.service';
import { EmailService } from './services/email.service';

// Types
import {
  AudioChunkData,
  ChatMessageData,
  GenerateSummaryData,
  JoinMeetingData
} from './types/socket.types';

// Validate configuration on startup
validateConfig();

// Initialize Express application
const app = express();
app.use(cors({
  origin: config.cors.origins,
  credentials: true
}));
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// Configure Socket.IO with CORS and buffer size limits
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 10e6 // 10MB for audio chunks
});

// Initialize all services
const storageService = new StorageService();
const transcriptionService = new TranscriptionService();
const summarizerService = new SummarizerService();
const emailService = new EmailService();

// ==================== REST API ENDPOINTS ====================

/**
 * Health check endpoint
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'JoinGo AI Summary Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

/**
 * Get all active meetings
 */
app.get('/api/meetings', (_req, res) => {
  try {
    const meetings = storageService.getAllMeetings();
    res.json({
      success: true,
      count: meetings.length,
      meetings: meetings.map(m => ({
        meetingId: m.meetingId,
        participantCount: m.participants.length,
        transcriptionCount: m.transcriptions.length,
        chatMessageCount: m.chatMessages.length,
        startTime: m.startTime,
        endTime: m.endTime
      }))
    });
  } catch (error: any) {
    Logger.error('Failed to get meetings', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get specific meeting data
 */
app.get('/api/meetings/:meetingId', (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = storageService.getMeetingData(meetingId);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    return res.json({
      success: true,
      meeting
    });
  } catch (error: any) {
    Logger.error('Failed to get meeting data', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get meeting statistics
 */
app.get('/api/meetings/:meetingId/stats', (req, res) => {
  try {
    const { meetingId } = req.params;
    const stats = storageService.getMeetingStats(meetingId);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    return res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    Logger.error('Failed to get meeting stats', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Verify email service
 */
app.get('/api/email/verify', async (_req, res) => {
  try {
    const isConnected = await emailService.verifyConnection();
    res.json({
      success: true,
      connected: isConnected
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== SOCKET.IO EVENTS ====================

io.on('connection', (socket) => {
  Logger.info(`Client connected: ${socket.id}`);

  /**
   * Cliente se une a una reunión
   */
  socket.on('join-meeting', (data: JoinMeetingData) => {
    const { meetingId, userId, userName, userEmail } = data;
    
    Logger.info(`User ${userName} joining meeting ${meetingId}`);
    
    // Unirse a la sala de Socket.IO
    socket.join(meetingId);
    
    // Agregar participante al storage
    storageService.addParticipant(meetingId, {
      id: userId,
      name: userName,
      email: userEmail
    });
    
    // Notificar a otros participantes
    socket.to(meetingId).emit('participant-joined', {
      userId,
      userName,
      timestamp: new Date().toISOString()
    });
    
    // Confirmar al cliente
    socket.emit('joined-meeting', {
      success: true,
      meetingId,
      message: `Successfully joined meeting ${meetingId}`
    });
  });

  /**
   * Recibir chunks de audio para transcripción
   */
  socket.on('audio-chunk', async (data: AudioChunkData) => {
    const { meetingId, userId, userName, audioData, timestamp } = data;
    
    try {
      Logger.debug(`Received audio chunk from ${userName} in meeting ${meetingId}`);
      
      // Convertir ArrayBuffer a Buffer
      const audioBuffer = Buffer.from(audioData);
      
      // Almacenar el chunk
      storageService.addAudioChunk(meetingId, {
        userId,
        userName,
        data: audioBuffer,
        timestamp
      });
      
      // Transcribir el audio (en tiempo real)
      try {
        const transcriptionText = await transcriptionService.transcribe(audioBuffer);
        
        // Guardar transcripción
        storageService.addTranscription(meetingId, {
          userId,
          userName,
          text: transcriptionText,
          timestamp
        });
        
        // Emitir transcripción en tiempo real a todos en la reunión
        io.to(meetingId).emit('live-transcription', {
          userId,
          userName,
          text: transcriptionText,
          timestamp
        });
        
        Logger.success(`Audio transcribed for ${userName}: "${transcriptionText.substring(0, 50)}..."`);
      } catch (transcriptionError: any) {
        Logger.warn(`Transcription failed for audio chunk: ${transcriptionError.message}`);
        // No fallar todo el proceso si una transcripción falla
      }
      
    } catch (error: any) {
      Logger.error('Error processing audio chunk', error);
      socket.emit('audio-chunk-error', {
        meetingId,
        error: error.message
      });
    }
  });

  /**
   * Recibir mensajes de chat
   */
  socket.on('chat-message', (data: ChatMessageData) => {
    const { meetingId, userId, userName, message, timestamp } = data;
    
    Logger.debug(`Chat message from ${userName} in meeting ${meetingId}`);
    
    // Almacenar mensaje
    storageService.addChatMessage(meetingId, {
      userId,
      userName,
      message,
      timestamp
    });
    
    // Confirmar recepción
    socket.emit('chat-message-received', {
      success: true,
      timestamp
    });
  });

  /**
   * Generar resumen de la reunión
   */
  socket.on('generate-summary', async (data: GenerateSummaryData) => {
    const { meetingId, participants } = data;
    
    Logger.info(`Generating summary for meeting ${meetingId}`);
    
    try {
      // Marcar reunión como finalizada
      storageService.endMeeting(meetingId);
      
      // Obtener datos de la reunión
      const meetingData = storageService.getMeetingData(meetingId);
      
      if (!meetingData) {
        throw new Error('Meeting data not found');
      }
      
      // Notificar que está generando
      socket.emit('summary-generating', {
        meetingId,
        message: 'Generando resumen con IA...'
      });
      
      // Generar resumen con Claude
      const summary = await summarizerService.generateSummary(meetingData);
      
      Logger.success(`Summary generated for meeting ${meetingId}`);
      
      // Enviar resumen por email
      try {
        await emailService.sendSummaryEmail(participants, summary);
        Logger.success(`Summary email sent to ${participants.length} participants`);
      } catch (emailError: any) {
        Logger.error('Failed to send summary email', emailError);
        // Continuar aunque falle el email
      }
      
      // Emitir resumen a todos en la reunión
      io.to(meetingId).emit('summary-ready', {
        meetingId,
        summary,
        emailSent: true
      });
      
      // También enviar al socket que lo solicitó
      socket.emit('summary-ready', {
        meetingId,
        summary,
        emailSent: true
      });
      
      // Limpiar datos de la reunión después de un tiempo
      setTimeout(() => {
        storageService.clearMeeting(meetingId);
        Logger.info(`Meeting data cleared for ${meetingId}`);
      }, 5 * 60 * 1000); // 5 minutos
      
    } catch (error: any) {
      Logger.error('Summary generation failed', error);
      socket.emit('summary-error', {
        meetingId,
        error: error.message
      });
    }
  });

  /**
   * Obtener resumen rápido (sin enviar email)
   */
  socket.on('get-quick-summary', async (data: { meetingId: string }) => {
    const { meetingId } = data;
    
    try {
      const meetingData = storageService.getMeetingData(meetingId);
      
      if (!meetingData) {
        throw new Error('Meeting data not found');
      }
      
      const quickSummary = await summarizerService.generateQuickSummary(meetingData);
      
      socket.emit('quick-summary-ready', {
        meetingId,
        summary: quickSummary
      });
      
    } catch (error: any) {
      Logger.error('Quick summary generation failed', error);
      socket.emit('quick-summary-error', {
        meetingId,
        error: error.message
      });
    }
  });

  /**
   * Cliente abandona la reunión
   */
  socket.on('leave-meeting', (data: { meetingId: string; userId: string; userName: string }) => {
    const { meetingId, userId, userName } = data;
    
    Logger.info(`User ${userName} leaving meeting ${meetingId}`);
    
    socket.leave(meetingId);
    
    // Notificar a otros
    socket.to(meetingId).emit('participant-left', {
      userId,
      userName,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Desconexión del cliente
   */
  socket.on('disconnect', () => {
    Logger.info(`Client disconnected: ${socket.id}`);
  });

  /**
   * Manejo de errores
   */
  socket.on('error', (error) => {
    Logger.error('Socket error', error);
  });
});

// ==================== ERROR HANDLING ====================

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection at:', promise);
  Logger.error('Reason:', reason);
});

// ==================== START SERVER ====================

const PORT = config.port;

httpServer.listen(PORT, () => {
  Logger.success('='.repeat(50));
  Logger.success(`🚀 JoinGo AI Summary Server Started`);
  Logger.success('='.repeat(50));
  Logger.info(`📡 Server running on port: ${PORT}`);
  Logger.info(`🌍 Environment: ${config.nodeEnv}`);
  Logger.info(`🔗 CORS Origins: ${config.cors.origins.join(', ')}`);
  Logger.success('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    Logger.info('HTTP server closed');
    transcriptionService.cleanupTempFiles();
    process.exit(0);
  });
});
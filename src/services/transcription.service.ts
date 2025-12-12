/**
 * @fileoverview Service for transcribing audio using OpenAI Whisper API
 * @module services/transcription
 */

import OpenAI from 'openai';
import { config } from '../config';
import { Logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Service for transcribing audio chunks using OpenAI's Whisper model
 * Handles temporary file storage and cleanup
 * @class TranscriptionService
 */
export class TranscriptionService {
  /** OpenAI client instance */
  private openai: OpenAI;

  /** Path to temporary directory for audio files */
  private tempDir: string;

  /**
   * Creates an instance of TranscriptionService
   * Initializes OpenAI client and creates temp directory for audio files
   */
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });

    // Create temporary directory for audio files
    this.tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Transcribes an audio chunk using Whisper API
   * Saves buffer to temp file, transcribes it, then cleans up
   * @param {Buffer} audioBuffer - Audio data as a buffer
   * @param {string} [language='es'] - Language code for transcription (default: Spanish)
   * @returns {Promise<string>} Transcribed text
   * @throws {Error} If transcription fails
   */
  async transcribe(audioBuffer: Buffer, language: string = 'es'): Promise<string> {
    const tempFilePath = path.join(this.tempDir, `audio-${Date.now()}.webm`);

    try {
      // Save buffer temporarily
      fs.writeFileSync(tempFilePath, audioBuffer);

      Logger.debug(`Transcribing audio file: ${tempFilePath}`);

      // Transcribe with Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: language,
        response_format: 'text'
      });

      Logger.success(`Transcription completed: "${transcription.substring(0, 50)}..."`);

      return transcription;
    } catch (error: any) {
      Logger.error('Transcription failed', error);
      throw new Error(`Transcription error: ${error.message}`);
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  /**
   * Transcribes multiple audio chunks sequentially
   * Continues processing even if individual chunks fail
   * @param {Buffer[]} audioBuffers - Array of audio buffers to transcribe
   * @returns {Promise<string[]>} Array of transcribed texts (includes fallback for failures)
   */
  async transcribeMultiple(audioBuffers: Buffer[]): Promise<string[]> {
    const transcriptions: string[] = [];

    for (const buffer of audioBuffers) {
      try {
        const text = await this.transcribe(buffer);
        transcriptions.push(text);
      } catch (error) {
        Logger.warn('Failed to transcribe one audio chunk, continuing...');
        transcriptions.push('[Transcripción no disponible]');
      }
    }

    return transcriptions;
  }

  /**
   * Cleans up all temporary audio files
   * Should be called on server shutdown
   * @returns {void}
   */
  cleanupTempFiles(): void {
    try {
      const files = fs.readdirSync(this.tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.tempDir, file));
      }
      Logger.info('Temporary audio files cleaned up');
    } catch (error) {
      Logger.error('Failed to cleanup temp files', error);
    }
  }
}

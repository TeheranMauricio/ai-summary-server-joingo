import OpenAI from 'openai';
import { config } from '../config';
import { Logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class TranscriptionService {
  private openai: OpenAI;
  private tempDir: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    
    // Crear directorio temporal para audio
    this.tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Transcribe un chunk de audio usando Whisper
   */
  async transcribe(audioBuffer: Buffer, language: string = 'es'): Promise<string> {
    const tempFilePath = path.join(this.tempDir, `audio-${Date.now()}.webm`);
    
    try {
      // Guardar el buffer temporalmente
      fs.writeFileSync(tempFilePath, audioBuffer);
      
      Logger.debug(`Transcribing audio file: ${tempFilePath}`);
      
      // Transcribir con Whisper
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
      // Limpiar archivo temporal
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  /**
   * Transcribe múltiples chunks de audio
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
   * Limpia el directorio temporal
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
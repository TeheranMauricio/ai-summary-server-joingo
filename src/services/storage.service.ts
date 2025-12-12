import { MeetingData, Transcription, ChatMessage, AudioChunk, Participant } from '../types/meeting.types';
import { Logger } from '../utils/logger';

export class StorageService {
  private meetings: Map<string, MeetingData> = new Map();

  /**
   * Inicializa una nueva reunión
   */
  initMeeting(meetingId: string): void {
    if (!this.meetings.has(meetingId)) {
      this.meetings.set(meetingId, {
        meetingId,
        participants: [],
        transcriptions: [],
        chatMessages: [],
        audioChunks: [],
        startTime: new Date().toISOString()
      });
      Logger.info(`Meeting initialized: ${meetingId}`);
    }
  }

  /**
   * Agrega un participante a la reunión
   */
  addParticipant(meetingId: string, participant: Participant): void {
    this.initMeeting(meetingId);
    const meeting = this.meetings.get(meetingId);
    
    if (meeting) {
      // Evitar duplicados
      const exists = meeting.participants.some(p => p.id === participant.id);
      if (!exists) {
        meeting.participants.push(participant);
        Logger.info(`Participant added to ${meetingId}: ${participant.name}`);
      }
    }
  }

  /**
   * Almacena un chunk de audio
   */
  addAudioChunk(meetingId: string, audioChunk: AudioChunk): void {
    this.initMeeting(meetingId);
    const meeting = this.meetings.get(meetingId);
    
    if (meeting) {
      meeting.audioChunks.push(audioChunk);
      Logger.debug(`Audio chunk added to ${meetingId} from ${audioChunk.userName}`);
    }
  }

  /**
   * Agrega una transcripción
   */
  addTranscription(meetingId: string, transcription: Transcription): void {
    this.initMeeting(meetingId);
    const meeting = this.meetings.get(meetingId);
    
    if (meeting) {
      meeting.transcriptions.push(transcription);
      Logger.info(`Transcription added to ${meetingId}: "${transcription.text.substring(0, 50)}..."`);
    }
  }

  /**
   * Agrega un mensaje de chat
   */
  addChatMessage(meetingId: string, message: ChatMessage): void {
    this.initMeeting(meetingId);
    const meeting = this.meetings.get(meetingId);
    
    if (meeting) {
      meeting.chatMessages.push(message);
      Logger.debug(`Chat message added to ${meetingId}: ${message.userName}`);
    }
  }

  /**
   * Marca el fin de una reunión
   */
  endMeeting(meetingId: string): void {
    const meeting = this.meetings.get(meetingId);
    if (meeting) {
      meeting.endTime = new Date().toISOString();
      Logger.info(`Meeting ended: ${meetingId}`);
    }
  }

  /**
   * Obtiene los datos completos de una reunión
   */
  getMeetingData(meetingId: string): MeetingData | undefined {
    return this.meetings.get(meetingId);
  }

  /**
   * Obtiene todas las reuniones activas
   */
  getAllMeetings(): MeetingData[] {
    return Array.from(this.meetings.values());
  }

  /**
   * Limpia los datos de una reunión
   */
  clearMeeting(meetingId: string): boolean {
    const deleted = this.meetings.delete(meetingId);
    if (deleted) {
      Logger.info(`Meeting data cleared: ${meetingId}`);
    }
    return deleted;
  }

  /**
   * Obtiene estadísticas de una reunión
   */
  getMeetingStats(meetingId: string): any {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return null;

    return {
      meetingId,
      participantCount: meeting.participants.length,
      transcriptionCount: meeting.transcriptions.length,
      chatMessageCount: meeting.chatMessages.length,
      audioChunkCount: meeting.audioChunks.length,
      duration: meeting.endTime 
        ? new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()
        : null
    };
  }
}
/**
 * @fileoverview In-memory storage service for managing meeting data
 * @module services/storage
 */

import { MeetingData, Transcription, ChatMessage, AudioChunk, Participant } from '../types/meeting.types';
import { Logger } from '../utils/logger';

/**
 * Service for storing and managing meeting data in memory
 * Uses a Map to store meetings by their ID
 * @class StorageService
 */
export class StorageService {
  /** In-memory map storing all active meetings */
  private meetings: Map<string, MeetingData> = new Map();

  /**
   * Initializes a new meeting
   * Creates a new meeting entry if it doesn't exist
   * @param {string} meetingId - Unique identifier for the meeting
   * @returns {void}
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
   * Adds a participant to a meeting
   * Automatically prevents duplicate participants
   * @param {string} meetingId - ID of the meeting
   * @param {Participant} participant - Participant data to add
   * @returns {void}
   */
  addParticipant(meetingId: string, participant: Participant): void {
    this.initMeeting(meetingId);
    const meeting = this.meetings.get(meetingId);

    if (meeting) {
      // Prevent duplicates
      const exists = meeting.participants.some(p => p.id === participant.id);
      if (!exists) {
        meeting.participants.push(participant);
        Logger.info(`Participant added to ${meetingId}: ${participant.name}`);
      }
    }
  }

  /**
   * Stores an audio chunk from a meeting
   * @param {string} meetingId - ID of the meeting
   * @param {AudioChunk} audioChunk - Audio chunk data to store
   * @returns {void}
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
   * Adds a transcription to a meeting
   * @param {string} meetingId - ID of the meeting
   * @param {Transcription} transcription - Transcription data to add
   * @returns {void}
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
   * Adds a chat message to a meeting
   * @param {string} meetingId - ID of the meeting
   * @param {ChatMessage} message - Chat message data to add
   * @returns {void}
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
   * Marks a meeting as ended
   * Sets the endTime timestamp for the meeting
   * @param {string} meetingId - ID of the meeting to end
   * @returns {void}
   */
  endMeeting(meetingId: string): void {
    const meeting = this.meetings.get(meetingId);
    if (meeting) {
      meeting.endTime = new Date().toISOString();
      Logger.info(`Meeting ended: ${meetingId}`);
    }
  }

  /**
   * Retrieves complete data for a specific meeting
   * @param {string} meetingId - ID of the meeting
   * @returns {MeetingData | undefined} Meeting data or undefined if not found
   */
  getMeetingData(meetingId: string): MeetingData | undefined {
    return this.meetings.get(meetingId);
  }

  /**
   * Retrieves all active meetings
   * @returns {MeetingData[]} Array of all meeting data
   */
  getAllMeetings(): MeetingData[] {
    return Array.from(this.meetings.values());
  }

  /**
   * Clears all data for a specific meeting
   * Removes the meeting from storage
   * @param {string} meetingId - ID of the meeting to clear
   * @returns {boolean} True if meeting was deleted, false if not found
   */
  clearMeeting(meetingId: string): boolean {
    const deleted = this.meetings.delete(meetingId);
    if (deleted) {
      Logger.info(`Meeting data cleared: ${meetingId}`);
    }
    return deleted;
  }

  /**
   * Gets statistics for a specific meeting
   * @param {string} meetingId - ID of the meeting
   * @returns {Object | null} Statistics object or null if meeting not found
   * @returns {string} .meetingId - Meeting ID
   * @returns {number} .participantCount - Number of participants
   * @returns {number} .transcriptionCount - Number of transcriptions
   * @returns {number} .chatMessageCount - Number of chat messages
   * @returns {number} .audioChunkCount - Number of audio chunks
   * @returns {number | null} .duration - Meeting duration in milliseconds, null if ongoing
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

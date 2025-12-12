/**
 * @fileoverview Type definitions for meeting-related data structures
 * @module types/meeting
 */

/**
 * Represents a participant in a meeting
 * @interface Participant
 */
export interface Participant {
  /** Unique identifier for the participant */
  id: string;
  /** Display name of the participant */
  name: string;
  /** Email address of the participant */
  email: string;
}

/**
 * Represents a voice transcription entry from a meeting
 * @interface Transcription
 */
export interface Transcription {
  /** ID of the user who spoke */
  userId: string;
  /** Name of the user who spoke */
  userName: string;
  /** Transcribed text content */
  text: string;
  /** ISO timestamp when the transcription was created */
  timestamp: string;
}

/**
 * Represents a chat message sent during a meeting
 * @interface ChatMessage
 */
export interface ChatMessage {
  /** ID of the user who sent the message */
  userId: string;
  /** Name of the user who sent the message */
  userName: string;
  /** The chat message content */
  message: string;
  /** ISO timestamp when the message was sent */
  timestamp: string;
}

/**
 * Represents an audio chunk recorded during a meeting
 * @interface AudioChunk
 */
export interface AudioChunk {
  /** ID of the user who created the audio */
  userId: string;
  /** Name of the user who created the audio */
  userName: string;
  /** Raw audio data as a buffer */
  data: Buffer;
  /** ISO timestamp when the audio was captured */
  timestamp: string;
}

/**
 * Complete data structure for a meeting session
 * @interface MeetingData
 */
export interface MeetingData {
  /** Unique identifier for the meeting */
  meetingId: string;
  /** List of all participants in the meeting */
  participants: Participant[];
  /** All voice transcriptions from the meeting */
  transcriptions: Transcription[];
  /** All chat messages from the meeting */
  chatMessages: ChatMessage[];
  /** All audio chunks recorded during the meeting */
  audioChunks: AudioChunk[];
  /** ISO timestamp when the meeting started */
  startTime: string;
  /** ISO timestamp when the meeting ended (optional, undefined if ongoing) */
  endTime?: string;
}

/**
 * Represents a task or action item identified during a meeting
 * @interface Task
 */
export interface Task {
  /** Description of the task to be completed */
  description: string;
  /** Name of the person assigned to the task */
  assignee: string;
  /** Optional deadline for the task (YYYY-MM-DD format) */
  deadline?: string;
}

/**
 * Represents a participant's contributions in a meeting summary
 * @interface ParticipantContribution
 */
export interface ParticipantContribution {
  /** Name of the participant */
  name: string;
  /** Summary of the participant's contributions and participation */
  contributions: string;
}

/**
 * AI-generated summary of a meeting
 * @interface Summary
 */
export interface Summary {
  /** Executive summary of the meeting (2-3 paragraphs) */
  summary: string;
  /** List of participants with their individual contributions */
  participants: ParticipantContribution[];
  /** Main topics discussed during the meeting */
  topics: string[];
  /** Action items and tasks identified */
  tasks: Task[];
  /** Next steps to be taken after the meeting */
  nextSteps: string[];
  /** ISO timestamp when the summary was generated */
  generatedAt: string;
  /** Human-readable duration of the meeting (e.g., "45 minutos", "1h 30min") */
  meetingDuration?: string;
}

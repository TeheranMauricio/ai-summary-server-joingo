/**
 * @fileoverview Type definitions for Socket.IO event payloads
 * @module types/socket
 */

/**
 * Payload for audio chunk events sent via Socket.IO
 * @interface AudioChunkData
 */
export interface AudioChunkData {
  /** ID of the meeting the audio belongs to */
  meetingId: string;
  /** ID of the user sending the audio */
  userId: string;
  /** Name of the user sending the audio */
  userName: string;
  /** Raw audio data as an ArrayBuffer */
  audioData: ArrayBuffer;
  /** ISO timestamp when the audio was captured */
  timestamp: string;
}

/**
 * Payload for chat message events sent via Socket.IO
 * @interface ChatMessageData
 */
export interface ChatMessageData {
  /** ID of the meeting the message belongs to */
  meetingId: string;
  /** ID of the user sending the message */
  userId: string;
  /** Name of the user sending the message */
  userName: string;
  /** The chat message content */
  message: string;
  /** ISO timestamp when the message was sent */
  timestamp: string;
}

/**
 * Payload for generate summary events sent via Socket.IO
 * @interface GenerateSummaryData
 */
export interface GenerateSummaryData {
  /** ID of the meeting to generate summary for */
  meetingId: string;
  /** List of participants to send the summary email to */
  participants: Array<{
    /** Unique identifier for the participant */
    id: string;
    /** Display name of the participant */
    name: string;
    /** Email address of the participant */
    email: string;
  }>;
}

/**
 * Payload for join meeting events sent via Socket.IO
 * @interface JoinMeetingData
 */
export interface JoinMeetingData {
  /** ID of the meeting to join */
  meetingId: string;
  /** ID of the user joining */
  userId: string;
  /** Name of the user joining */
  userName: string;
  /** Email address of the user joining */
  userEmail: string;
}

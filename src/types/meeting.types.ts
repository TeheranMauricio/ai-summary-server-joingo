export interface Participant {
  id: string;
  name: string;
  email: string;
}

export interface Transcription {
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export interface AudioChunk {
  userId: string;
  userName: string;
  data: Buffer;
  timestamp: string;
}

export interface MeetingData {
  meetingId: string;
  participants: Participant[];
  transcriptions: Transcription[];
  chatMessages: ChatMessage[];
  audioChunks: AudioChunk[];
  startTime: string;
  endTime?: string;
}

export interface Task {
  description: string;
  assignee: string;
  deadline?: string;
}

export interface ParticipantContribution {
  name: string;
  contributions: string;
}

export interface Summary {
  summary: string;
  participants: ParticipantContribution[];
  topics: string[];
  tasks: Task[];
  nextSteps: string[];
  generatedAt: string;
  meetingDuration?: string;
}
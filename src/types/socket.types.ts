export interface AudioChunkData {
  meetingId: string;
  userId: string;
  userName: string;
  audioData: ArrayBuffer;
  timestamp: string;
}

export interface ChatMessageData {
  meetingId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export interface GenerateSummaryData {
  meetingId: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export interface JoinMeetingData {
  meetingId: string;
  userId: string;
  userName: string;
  userEmail: string;
}
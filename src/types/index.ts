/** Conversation message entry in the transcript */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  feedback?: FeedbackItem[];
}

/** A single piece of learning feedback */
export interface FeedbackItem {
  type: 'grammar' | 'vocabulary' | 'pronunciation';
  original: string;
  suggestion: string;
  explanation: string;
}

/** Available personality types for the AI partner */
export type Personality =
  | 'friendly_friend'
  | 'english_teacher'
  | 'debate_partner'
  | 'job_interviewer'
  | 'casual_companion';

/** Available practice modes */
export type PracticeMode =
  | 'conversation'
  | 'interview'
  | 'daily_conversation'
  | 'debate'
  | 'story';

/** Overall application state */
export type AppState =
  | 'setup'          // Model loading / configuration
  | 'ready'          // Models loaded, idle
  | 'recording'      // User is speaking (microphone active)
  | 'transcribing'   // Processing speech → text
  | 'generating'     // LLM producing a response
  | 'speaking'       // TTS playing the response
  | 'error';         // Fatal error

/** Model loading status for each modality */
export interface ModelStatus {
  llm: 'idle' | 'loading' | 'ready' | 'error';
  stt: 'idle' | 'loading' | 'ready' | 'error' | 'unavailable';
  tts: 'idle' | 'loading' | 'ready' | 'error' | 'unavailable';
}

/** Session statistics */
export interface SessionStats {
  messageCount: number;
  feedbackCount: number;
  startedAt: Date;
}

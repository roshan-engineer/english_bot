export type Personality =
  | 'friendly-friend'
  | 'english-teacher'
  | 'debate-partner'
  | 'job-interviewer'
  | 'casual-companion';

export type PracticeMode =
  | 'conversation'
  | 'interview'
  | 'daily-conversation'
  | 'debate'
  | 'story';

export interface PersonalityConfig {
  id: Personality;
  label: string;
  description: string;
  emoji: string;
  systemPrompt: string;
}

export interface PracticeModeConfig {
  id: PracticeMode;
  label: string;
  description: string;
  emoji: string;
  systemPromptSuffix: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface GrammarFeedback {
  original: string;
  corrected: string;
  explanation: string;
}

export interface VocabSuggestion {
  word: string;
  betterAlternative: string;
  context: string;
}

export interface FeedbackResult {
  grammarCorrections: GrammarFeedback[];
  vocabularySuggestions: VocabSuggestion[];
  pronunciationNote?: string;
  overallScore?: number;
}

export type SDKStatus =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'loading-models'
  | 'models-ready'
  | 'error';

export type ConversationStatus =
  | 'idle'
  | 'recording'
  | 'processing-stt'
  | 'generating'
  | 'speaking'
  | 'error';

export interface ModelSetup {
  llmFile: File | null;
  sttEncoderFile: File | null;
  sttDecoderFile: File | null;
  sttTokensFile: File | null;
  ttsModelFile: File | null;
  ttsTokensFile: File | null;
}

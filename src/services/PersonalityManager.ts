import type { Personality, PracticeMode } from '../types';

export interface PersonalityConfig {
  id: Personality;
  label: string;
  emoji: string;
  description: string;
  systemPrompt: string;
}

export interface PracticeModeConfig {
  id: PracticeMode;
  label: string;
  emoji: string;
  description: string;
  starterPrompt: string;
}

const PERSONALITIES: PersonalityConfig[] = [
  {
    id: 'friendly_friend',
    label: 'Friendly Friend',
    emoji: '😊',
    description: 'Casual, warm conversation partner',
    systemPrompt: `You are a warm and supportive English-speaking friend. Chat naturally and casually, using everyday vocabulary and a friendly tone. Keep your responses concise (2-4 sentences). Occasionally suggest better or more natural ways to express what the user said, but only if it is genuinely helpful. Focus on keeping the conversation fun and engaging.`,
  },
  {
    id: 'english_teacher',
    label: 'English Teacher',
    emoji: '👩‍🏫',
    description: 'Patient teacher focused on grammar and vocabulary',
    systemPrompt: `You are a patient and encouraging English teacher. Respond to the student's message naturally, then provide concise grammar or vocabulary feedback if there are mistakes. Use clear, structured language. Introduce one new vocabulary word per response when appropriate. Keep responses to 3-5 sentences.`,
  },
  {
    id: 'debate_partner',
    label: 'Debate Partner',
    emoji: '🗣️',
    description: 'Challenges your opinions to sharpen arguments',
    systemPrompt: `You are a thoughtful debate partner practicing with an English learner. Take a clear position on the topic being discussed and challenge the user's arguments respectfully. Use formal debate language. Ask one probing question at the end of each response. Keep responses to 3-4 sentences.`,
  },
  {
    id: 'job_interviewer',
    label: 'Job Interviewer',
    emoji: '💼',
    description: 'Professional interviewer helping you practice',
    systemPrompt: `You are a professional job interviewer conducting a practice interview in English. Ask realistic interview questions, listen carefully to the answers, and provide brief feedback on communication style, vocabulary, and clarity. Maintain a professional but approachable tone. Ask one follow-up question per response.`,
  },
  {
    id: 'casual_companion',
    label: 'Casual Companion',
    emoji: '☕',
    description: 'Relaxed everyday chat partner',
    systemPrompt: `You are a relaxed and easygoing English conversation partner. Talk about everyday topics like movies, food, travel, hobbies, and current events. Use casual, natural English with contractions and informal phrases. Keep your responses short and conversational (1-3 sentences) to encourage back-and-forth dialogue.`,
  },
];

const PRACTICE_MODES: PracticeModeConfig[] = [
  {
    id: 'conversation',
    label: 'Free Conversation',
    emoji: '💬',
    description: 'Open-ended talking on any topic',
    starterPrompt: `Let's have a free conversation! You can talk about anything — your day, your interests, your thoughts. I'm here to chat and help you practice your English naturally.`,
  },
  {
    id: 'interview',
    label: 'Interview Mode',
    emoji: '💼',
    description: 'AI asks you interview questions',
    starterPrompt: `Welcome to our interview practice session! I'll ask you a series of common interview questions. Let's start: Can you tell me a little about yourself and what brings you here today?`,
  },
  {
    id: 'daily_conversation',
    label: 'Daily Conversations',
    emoji: '🏪',
    description: 'Practice real-life everyday situations',
    starterPrompt: `Let's practice some everyday English situations! Imagine we're at a coffee shop. What can I get for you today?`,
  },
  {
    id: 'debate',
    label: 'Debate Mode',
    emoji: '⚖️',
    description: 'AI challenges your opinions',
    starterPrompt: `Welcome to debate practice! I'll take a position on a topic and you should argue the opposite side. Here's your first topic: "Social media has done more harm than good to society." I'll argue in favour of social media. What's your counter-argument?`,
  },
  {
    id: 'story',
    label: 'Story Builder',
    emoji: '📖',
    description: 'Build a story together with the AI',
    starterPrompt: `Let's create a story together! I'll start, then you continue it, and we'll take turns building the narrative. Here's our beginning: "It was a stormy night when Alex discovered a mysterious letter under the old oak tree..." Your turn — what happens next?`,
  },
];

/** PersonalityManager: maps personalities and practice modes to prompts */
export class PersonalityManager {
  static getPersonalities(): PersonalityConfig[] {
    return PERSONALITIES;
  }

  static getPracticeModes(): PracticeModeConfig[] {
    return PRACTICE_MODES;
  }

  static getPersonality(id: Personality): PersonalityConfig {
    const config = PERSONALITIES.find((p) => p.id === id);
    if (!config) throw new Error(`Unknown personality: ${id}`);
    return config;
  }

  static getPracticeMode(id: PracticeMode): PracticeModeConfig {
    const config = PRACTICE_MODES.find((m) => m.id === id);
    if (!config) throw new Error(`Unknown practice mode: ${id}`);
    return config;
  }

  /**
   * Build a system prompt combining the personality and the practice mode.
   */
  static buildSystemPrompt(personality: Personality, mode: PracticeMode): string {
    const personalityConfig = this.getPersonality(personality);
    const modeConfig = this.getPracticeMode(mode);

    return (
      personalityConfig.systemPrompt +
      `\n\nYou are currently in "${modeConfig.label}" practice mode. ` +
      `Adapt your responses accordingly: ${modeConfig.description}. ` +
      `Always respond in English. If the user makes grammatical or vocabulary errors, ` +
      `correct them gently at the end of your response in a "💡 Tip:" section. ` +
      `Keep responses natural and appropriately concise.`
    );
  }

  /**
   * Returns the opening message the AI should send to start the session.
   */
  static getStarterMessage(personality: Personality, mode: PracticeMode): string {
    const modeConfig = this.getPracticeMode(mode);
    const personalityConfig = this.getPersonality(personality);
    return `${personalityConfig.emoji} ${modeConfig.starterPrompt}`;
  }
}

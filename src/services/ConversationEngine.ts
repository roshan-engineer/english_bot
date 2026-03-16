import type { ChatMessage, LLMGenerationOptions } from '@runanywhere/web';
import type { Personality, PracticeMode, Message } from '../types';
import { PersonalityManager } from './PersonalityManager';

export interface ConversationEngineConfig {
  personality: Personality;
  mode: PracticeMode;
  maxHistoryMessages?: number;
  maxTokens?: number;
  temperature?: number;
}

/**
 * ConversationEngine
 *
 * Manages the conversation context (history + system prompt) and drives the
 * LLM text-generation loop via the RunAnywhere Web SDK.
 *
 * The LLM is accessed lazily through a dynamic import so that the module can
 * be imported in non-WASM environments (e.g. during unit tests) without crashing.
 */
export class ConversationEngine {
  private history: ChatMessage[] = [];
  private config: Required<ConversationEngineConfig>;
  private systemPrompt: string;

  constructor(config: ConversationEngineConfig) {
    this.config = {
      personality: config.personality,
      mode: config.mode,
      maxHistoryMessages: config.maxHistoryMessages ?? 20,
      maxTokens: config.maxTokens ?? 256,
      temperature: config.temperature ?? 0.7,
    };
    this.systemPrompt = PersonalityManager.buildSystemPrompt(
      config.personality,
      config.mode
    );
  }

  /** Update the personality / mode mid-session. Clears history. */
  reconfigure(personality: Personality, mode: PracticeMode): void {
    this.config.personality = personality;
    this.config.mode = mode;
    this.systemPrompt = PersonalityManager.buildSystemPrompt(personality, mode);
    this.clearHistory();
  }

  /** Clear the conversation history. */
  clearHistory(): void {
    this.history = [];
  }

  /** Get the current conversation history (for display). */
  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  /**
   * Send a user message to the LLM and return the full assistant response.
   * Maintains the sliding-window history so the model has conversation context.
   */
  async chat(userText: string): Promise<string> {
    const { TextGeneration } = await import('@runanywhere/web-llamacpp');

    if (!TextGeneration.isModelLoaded) {
      throw new Error('LLM model is not loaded. Please load a model first.');
    }

    // Append the user message to history
    this.history.push({ role: 'user', content: userText });

    // Build the sliding-window prompt
    const recentHistory = this.history.slice(-this.config.maxHistoryMessages);

    // Format the full prompt as a conversation
    const prompt = this.buildPrompt(recentHistory);

    const options: LLMGenerationOptions = {
      systemPrompt: this.systemPrompt,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    const result = await TextGeneration.generate(prompt, options);
    const assistantText = result.text.trim();

    // Append assistant response to history
    this.history.push({ role: 'assistant', content: assistantText });

    return assistantText;
  }

  /**
   * Stream a response token by token.
   * Returns an async generator that yields each token as it arrives.
   */
  async *chatStream(userText: string): AsyncGenerator<string, string, unknown> {
    const { TextGeneration } = await import('@runanywhere/web-llamacpp');

    if (!TextGeneration.isModelLoaded) {
      throw new Error('LLM model is not loaded. Please load a model first.');
    }

    this.history.push({ role: 'user', content: userText });
    const recentHistory = this.history.slice(-this.config.maxHistoryMessages);
    const prompt = this.buildPrompt(recentHistory);

    const options: LLMGenerationOptions = {
      systemPrompt: this.systemPrompt,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    const streamResult = await TextGeneration.generateStream(prompt, options);
    let fullText = '';

    for await (const token of streamResult.stream) {
      fullText += token;
      yield token;
    }

    this.history.push({ role: 'assistant', content: fullText.trim() });
    return fullText.trim();
  }

  /** Cancel any in-progress generation. */
  async cancel(): Promise<void> {
    try {
      const { TextGeneration } = await import('@runanywhere/web-llamacpp');
      TextGeneration.cancel();
    } catch {
      // Ignore errors if module not loaded
    }
  }

  /**
   * Build a conversation prompt string from the message history.
   * Uses a simple Human/Assistant template compatible with most instruction models.
   */
  private buildPrompt(messages: ChatMessage[]): string {
    return messages
      .map((m) => {
        const role = m.role === 'user' ? 'Human' : 'Assistant';
        return `${role}: ${m.content}`;
      })
      .join('\n') + '\nAssistant:';
  }

  /**
   * Generate the AI's opening message for the current mode.
   * Does NOT use the LLM — returns a pre-scripted starter to save inference time.
   */
  getStarterMessage(): string {
    return PersonalityManager.getStarterMessage(
      this.config.personality,
      this.config.mode
    );
  }

  /** Build a Message object with a unique id for the transcript. */
  static makeMessage(
    role: Message['role'],
    text: string,
    feedback?: Message['feedback']
  ): Message {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role,
      text,
      timestamp: new Date(),
      feedback,
    };
  }
}

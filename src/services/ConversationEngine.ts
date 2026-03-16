/**
 * ConversationEngine
 *
 * Manages the local LLM conversation state and generation via the
 * RunAnywhere LlamaCPP backend. Maintains session history for context.
 */

import { RunAnywhere, SDKEnvironment } from '@runanywhere/web';
import { LlamaCPP, TextGeneration, LlamaCppBridge } from '@runanywhere/web-llamacpp';
import type { Message } from '../types';

export interface GenerationCallbacks {
  onToken?: (token: string, accumulated: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export class ConversationEngine {
  private loaded = false;
  private history: Message[] = [];
  private systemPrompt = '';

  async initialize(): Promise<void> {
    if (!RunAnywhere.isInitialized) {
      await RunAnywhere.initialize({ environment: SDKEnvironment.Development });
    }
    await LlamaCPP.register();
  }

  async loadModel(modelFile: File): Promise<void> {
    const bridge = LlamaCppBridge.shared;
    await bridge.ensureLoaded();

    // Mount the file directly into the WASM virtual FS
    const mountedPath = bridge.mountFile(modelFile);
    const modelPath = mountedPath ?? `/models/${modelFile.name}`;
    if (!mountedPath) {
      const buffer = await modelFile.arrayBuffer();
      bridge.writeFile(modelPath, new Uint8Array(buffer));
    }

    await TextGeneration.loadModel(modelPath, 'local-llm', 'Local LLM');
    this.loaded = true;
  }

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  clearHistory(): void {
    this.history = [];
  }

  getHistory(): Message[] {
    return [...this.history];
  }

  addMessage(message: Message): void {
    this.history.push(message);
  }

  /**
   * Build the full prompt with conversation history in a chat format.
   * Uses a simple instruction-following format compatible with most GGUF models.
   */
  private buildPrompt(userText: string): string {
    const parts: string[] = [];

    if (this.systemPrompt) {
      parts.push(`<|system|>\n${this.systemPrompt}<|end|>`);
    }

    // Include last N turns for context (avoid hitting context limit)
    const recentHistory = this.history.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        parts.push(`<|user|>\n${msg.text}<|end|>`);
      } else {
        parts.push(`<|assistant|>\n${msg.text}<|end|>`);
      }
    }

    parts.push(`<|user|>\n${userText}<|end|>`);
    parts.push(`<|assistant|>\n`);

    return parts.join('\n');
  }

  async generateResponse(
    userText: string,
    callbacks?: GenerationCallbacks,
  ): Promise<string> {
    if (!this.loaded) {
      throw new Error('LLM model not loaded. Call loadModel() first.');
    }

    const prompt = this.buildPrompt(userText);
    let accumulated = '';

    try {
      const streaming = await TextGeneration.generateStream(prompt, {
        maxTokens: 200,
        temperature: 0.7,
      });

      for await (const token of streaming.stream) {
        accumulated += token;
        callbacks?.onToken?.(token, accumulated);
      }

      // Strip any trailing end tokens
      const cleaned = accumulated
        .replace(/<\|end\|>.*$/s, '')
        .replace(/<\|assistant\|>.*$/s, '')
        .trim();

      callbacks?.onComplete?.(cleaned);
      return cleaned;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks?.onError?.(err);
      throw err;
    }
  }

  get isLoaded(): boolean {
    return this.loaded;
  }
}

export const conversationEngine = new ConversationEngine();

/**
 * FeedbackAnalyzer
 *
 * Analyzes user speech for grammar mistakes, vocabulary improvements,
 * and pronunciation feedback using the local LLM.
 */

import { TextGeneration } from '@runanywhere/web-llamacpp';
import type { FeedbackResult, GrammarFeedback, VocabSuggestion } from '../types';

const FEEDBACK_PROMPT = `You are an English language coach. Analyze the following user speech for:
1. Grammar mistakes (if any)
2. Vocabulary improvements (suggest better or more natural words/phrases)
3. A brief pronunciation note if the sentence structure suggests pronunciation difficulty

Respond ONLY in valid JSON with this exact shape (no markdown, no extra text):
{
  "grammarCorrections": [
    { "original": "...", "corrected": "...", "explanation": "..." }
  ],
  "vocabularySuggestions": [
    { "word": "...", "betterAlternative": "...", "context": "..." }
  ],
  "pronunciationNote": "..." 
}

If there are no corrections or suggestions, return empty arrays and omit pronunciationNote.

User speech: "`;

export class FeedbackAnalyzer {
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async analyze(userText: string): Promise<FeedbackResult | null> {
    if (!this.enabled || !userText.trim()) return null;

    try {
      // Escape backslashes first, then double quotes, to safely embed text in the JSON prompt
      const escaped = userText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const prompt = FEEDBACK_PROMPT + escaped + '"';
      const result = await TextGeneration.generate(prompt, {
        maxTokens: 300,
        temperature: 0.3,
      });

      const jsonText = result.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(jsonText) as {
        grammarCorrections?: GrammarFeedback[];
        vocabularySuggestions?: VocabSuggestion[];
        pronunciationNote?: string;
      };

      return {
        grammarCorrections: parsed.grammarCorrections ?? [],
        vocabularySuggestions: parsed.vocabularySuggestions ?? [],
        pronunciationNote: parsed.pronunciationNote,
      };
    } catch {
      // If parsing fails, return empty feedback rather than crashing
      return {
        grammarCorrections: [],
        vocabularySuggestions: [],
      };
    }
  }
}

export const feedbackAnalyzer = new FeedbackAnalyzer();

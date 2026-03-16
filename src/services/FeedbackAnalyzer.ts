import type { FeedbackItem } from '../types';

/**
 * FeedbackAnalyzer
 *
 * Parses AI responses for embedded "💡 Tip:" sections that contain grammar,
 * vocabulary, or pronunciation corrections. Also provides utility methods to
 * extract structured FeedbackItems so they can be displayed in the feedback panel.
 */
export class FeedbackAnalyzer {
  private static readonly TIP_PATTERN = /💡\s*Tip:\s*([\s\S]*?)(?=\n\n|$)/gi;
  private static readonly GRAMMAR_KEYWORDS = [
    'grammar',
    'should be',
    'instead of',
    'correct form',
    'tense',
    'article',
    'plural',
    'singular',
    'preposition',
  ];
  private static readonly VOCAB_KEYWORDS = [
    'vocabulary',
    'word',
    'phrase',
    'expression',
    'synonym',
    'alternative',
    'better way',
    'more natural',
  ];

  /**
   * Extract the tip/feedback section from an AI response and return the
   * cleaned main text (without the tip block) plus a list of FeedbackItems.
   */
  static analyze(responseText: string): {
    cleanedText: string;
    feedbackItems: FeedbackItem[];
  } {
    const feedbackItems: FeedbackItem[] = [];
    let cleanedText = responseText;

    // Extract all "💡 Tip:" blocks
    const tipMatches = [...responseText.matchAll(this.TIP_PATTERN)];
    for (const match of tipMatches) {
      const tipContent = match[1].trim();
      const item = this.parseTipContent(tipContent);
      if (item) feedbackItems.push(item);
      // Remove the tip block from the main text
      cleanedText = cleanedText.replace(match[0], '').trim();
    }

    return { cleanedText, feedbackItems };
  }

  /**
   * Parse a tip string into a structured FeedbackItem.
   * The AI is prompted to follow a loose pattern, so we do best-effort parsing.
   */
  private static parseTipContent(content: string): FeedbackItem | null {
    if (!content) return null;

    const type = this.classifyFeedbackType(content);

    // Try to extract "X" → "Y" pattern
    const arrowMatch = content.match(/["']?([^"'\u2192]+)["']?\s*(?:\u2192|->|>)\s*["']?([^"'.]+)["']?/);
    if (arrowMatch) {
      return {
        type,
        original: arrowMatch[1].trim(),
        suggestion: arrowMatch[2].trim(),
        explanation: content,
      };
    }

    // Try "instead of X, say Y" pattern
    const insteadMatch = content.match(/instead of\s+["']?([^"',]+)["']?,?\s+(?:say|use|try)\s+["']?([^"'.]+)["']?/i);
    if (insteadMatch) {
      return {
        type,
        original: insteadMatch[1].trim(),
        suggestion: insteadMatch[2].trim(),
        explanation: content,
      };
    }

    // Fallback: treat the whole content as an explanation
    return {
      type,
      original: '',
      suggestion: '',
      explanation: content,
    };
  }

  private static classifyFeedbackType(
    content: string
  ): 'grammar' | 'vocabulary' | 'pronunciation' {
    const lower = content.toLowerCase();
    if (this.VOCAB_KEYWORDS.some((k) => lower.includes(k))) return 'vocabulary';
    if (lower.includes('pronoun') || lower.includes('stress') || lower.includes('sound'))
      return 'pronunciation';
    if (this.GRAMMAR_KEYWORDS.some((k) => lower.includes(k))) return 'grammar';
    return 'grammar';
  }

  /** Returns a human-readable summary of feedback stats */
  static summarize(items: FeedbackItem[]): string {
    if (items.length === 0) return 'No corrections this session — great job!';
    const grammar = items.filter((i) => i.type === 'grammar').length;
    const vocab = items.filter((i) => i.type === 'vocabulary').length;
    const pron = items.filter((i) => i.type === 'pronunciation').length;
    const parts: string[] = [];
    if (grammar) parts.push(`${grammar} grammar`);
    if (vocab) parts.push(`${vocab} vocabulary`);
    if (pron) parts.push(`${pron} pronunciation`);
    return `${items.length} correction${items.length !== 1 ? 's' : ''}: ${parts.join(', ')}`;
  }
}

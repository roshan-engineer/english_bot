import React from 'react';
import type { FeedbackResult } from '../types';
import './FeedbackPanel.css';

interface Props {
  feedback: FeedbackResult | null;
  isAnalyzing: boolean;
}

export const FeedbackPanel: React.FC<Props> = ({ feedback, isAnalyzing }) => {
  if (isAnalyzing) {
    return (
      <div className="feedback-panel feedback-loading">
        <div className="feedback-spinner" />
        <span>Analyzing your speech…</span>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="feedback-panel feedback-empty">
        <span className="feedback-empty-icon">📊</span>
        <p>Feedback will appear here after you speak.</p>
      </div>
    );
  }

  const hasGrammar = feedback.grammarCorrections.length > 0;
  const hasVocab = feedback.vocabularySuggestions.length > 0;
  const hasPronunciation = !!feedback.pronunciationNote;

  if (!hasGrammar && !hasVocab && !hasPronunciation) {
    return (
      <div className="feedback-panel feedback-good">
        <span className="feedback-good-icon">✅</span>
        <p>Great job! No corrections needed.</p>
      </div>
    );
  }

  return (
    <div className="feedback-panel">
      {hasGrammar && (
        <div className="feedback-section">
          <h4 className="feedback-section-title">
            <span>✏️</span> Grammar
          </h4>
          {feedback.grammarCorrections.map((c, i) => (
            <div key={i} className="feedback-item feedback-grammar">
              <div className="feedback-diff">
                <span className="feedback-original">❌ {c.original}</span>
                <span className="feedback-arrow">→</span>
                <span className="feedback-corrected">✅ {c.corrected}</span>
              </div>
              {c.explanation && (
                <p className="feedback-explanation">{c.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {hasVocab && (
        <div className="feedback-section">
          <h4 className="feedback-section-title">
            <span>📚</span> Vocabulary
          </h4>
          {feedback.vocabularySuggestions.map((v, i) => (
            <div key={i} className="feedback-item feedback-vocab">
              <div className="feedback-diff">
                <span className="feedback-original">"{v.word}"</span>
                <span className="feedback-arrow">→</span>
                <span className="feedback-corrected">"{v.betterAlternative}"</span>
              </div>
              {v.context && (
                <p className="feedback-explanation">{v.context}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {hasPronunciation && (
        <div className="feedback-section">
          <h4 className="feedback-section-title">
            <span>🔊</span> Pronunciation Tip
          </h4>
          <div className="feedback-item">
            <p className="feedback-explanation">{feedback.pronunciationNote}</p>
          </div>
        </div>
      )}
    </div>
  );
};

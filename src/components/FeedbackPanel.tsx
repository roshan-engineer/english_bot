import React from 'react';
import type { FeedbackItem, SessionStats } from '../types';
import { FeedbackAnalyzer } from '../services/FeedbackAnalyzer';

interface FeedbackPanelProps {
  feedback: FeedbackItem[];
  stats: SessionStats;
}

const TYPE_CONFIG: Record<
  FeedbackItem['type'],
  { emoji: string; label: string; className: string }
> = {
  grammar: { emoji: '📝', label: 'Grammar', className: 'feedback-grammar' },
  vocabulary: { emoji: '📚', label: 'Vocabulary', className: 'feedback-vocab' },
  pronunciation: { emoji: '🔊', label: 'Pronunciation', className: 'feedback-pron' },
};

/**
 * FeedbackPanel
 *
 * Displays the running list of grammar/vocabulary/pronunciation corrections
 * and session statistics.
 */
const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ feedback, stats }) => {
  const summary = FeedbackAnalyzer.summarize(feedback);
  const elapsed = Math.floor(
    (Date.now() - stats.startedAt.getTime()) / 1000
  );
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <aside className="feedback-panel" aria-label="Feedback and corrections">
      <h3 className="panel-title">📊 Session Feedback</h3>

      <div className="session-stats">
        <div className="stat">
          <span className="stat-value">{stats.messageCount}</span>
          <span className="stat-label">Messages</span>
        </div>
        <div className="stat">
          <span className="stat-value">{stats.feedbackCount}</span>
          <span className="stat-label">Corrections</span>
        </div>
        <div className="stat">
          <span className="stat-value">{timeStr}</span>
          <span className="stat-label">Duration</span>
        </div>
      </div>

      <p className="feedback-summary">{summary}</p>

      {feedback.length === 0 ? (
        <div className="feedback-empty">
          <p>Corrections and tips will appear here as you practice.</p>
        </div>
      ) : (
        <ul className="feedback-list">
          {feedback.map((item, i) => {
            const cfg = TYPE_CONFIG[item.type];
            return (
              <li key={i} className={`feedback-item ${cfg.className}`}>
                <div className="feedback-header">
                  <span>{cfg.emoji}</span>
                  <span className="feedback-type-label">{cfg.label}</span>
                </div>
                {item.original && (
                  <div className="feedback-correction">
                    <span className="original">{item.original}</span>
                    <span className="arrow">→</span>
                    <span className="suggestion">{item.suggestion}</span>
                  </div>
                )}
                {item.explanation && (
                  <p className="feedback-explanation">{item.explanation}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};

export default FeedbackPanel;

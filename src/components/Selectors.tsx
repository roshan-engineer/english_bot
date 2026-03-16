import React from 'react';
import { PERSONALITIES, PRACTICE_MODES } from '../services/PersonalityManager';
import type { Personality, PracticeMode } from '../types';
import './Selectors.css';

interface Props {
  personality: Personality;
  mode: PracticeMode;
  onPersonalityChange: (p: Personality) => void;
  onModeChange: (m: PracticeMode) => void;
  disabled?: boolean;
}

export const Selectors: React.FC<Props> = ({
  personality,
  mode,
  onPersonalityChange,
  onModeChange,
  disabled = false,
}) => {
  return (
    <div className="selectors">
      <div className="selector-group">
        <h3 className="selector-label">Conversation Partner</h3>
        <div className="selector-grid">
          {PERSONALITIES.map((p) => (
            <button
              key={p.id}
              className={`selector-card ${personality === p.id ? 'active' : ''}`}
              onClick={() => onPersonalityChange(p.id)}
              disabled={disabled}
              title={p.description}
            >
              <span className="selector-emoji">{p.emoji}</span>
              <span className="selector-name">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="selector-group">
        <h3 className="selector-label">Practice Mode</h3>
        <div className="selector-grid">
          {PRACTICE_MODES.map((m) => (
            <button
              key={m.id}
              className={`selector-card ${mode === m.id ? 'active' : ''}`}
              onClick={() => onModeChange(m.id)}
              disabled={disabled}
              title={m.description}
            >
              <span className="selector-emoji">{m.emoji}</span>
              <span className="selector-name">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

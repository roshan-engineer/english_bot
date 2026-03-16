import React from 'react';
import type { PracticeMode } from '../types';
import {
  PersonalityManager,
  type PracticeModeConfig,
} from '../services/PersonalityManager';

interface PracticeModeSelectorProps {
  value: PracticeMode;
  onChange: (value: PracticeMode) => void;
  disabled?: boolean;
}

/**
 * PracticeModeSelector
 *
 * Renders a card-based picker for choosing the current practice mode.
 */
const PracticeModeSelector: React.FC<PracticeModeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const modes: PracticeModeConfig[] = PersonalityManager.getPracticeModes();

  return (
    <div className="selector-section">
      <h3 className="selector-title">Practice Mode</h3>
      <div className="selector-grid">
        {modes.map((m) => (
          <button
            key={m.id}
            className={`selector-card ${value === m.id ? 'selected' : ''}`}
            onClick={() => onChange(m.id)}
            disabled={disabled}
            title={m.description}
            aria-pressed={value === m.id}
          >
            <span className="card-emoji">{m.emoji}</span>
            <span className="card-label">{m.label}</span>
            <span className="card-desc">{m.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PracticeModeSelector;

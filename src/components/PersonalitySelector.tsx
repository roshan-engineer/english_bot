import React from 'react';
import type { Personality } from '../types';
import {
  PersonalityManager,
  type PersonalityConfig,
} from '../services/PersonalityManager';

interface PersonalitySelectorProps {
  value: Personality;
  onChange: (value: Personality) => void;
  disabled?: boolean;
}

/**
 * PersonalitySelector
 *
 * Renders a card-based picker for choosing the AI conversation partner's
 * personality type.
 */
const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const personalities: PersonalityConfig[] = PersonalityManager.getPersonalities();

  return (
    <div className="selector-section">
      <h3 className="selector-title">Conversation Partner</h3>
      <div className="selector-grid">
        {personalities.map((p) => (
          <button
            key={p.id}
            className={`selector-card ${value === p.id ? 'selected' : ''}`}
            onClick={() => onChange(p.id)}
            disabled={disabled}
            title={p.description}
            aria-pressed={value === p.id}
          >
            <span className="card-emoji">{p.emoji}</span>
            <span className="card-label">{p.label}</span>
            <span className="card-desc">{p.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PersonalitySelector;

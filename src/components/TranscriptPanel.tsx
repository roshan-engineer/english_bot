import React from 'react';
import type { Message } from '../types';
import './TranscriptPanel.css';

interface Props {
  messages: Message[];
}

export const TranscriptPanel: React.FC<Props> = ({ messages }) => {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="transcript-panel transcript-empty">
        <div className="transcript-placeholder">
          <span className="transcript-placeholder-icon">🎙️</span>
          <p>Your conversation will appear here.</p>
          <p className="transcript-hint">Set up your models and press <strong>Start</strong> to begin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transcript-panel">
      <div className="transcript-scroll">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`transcript-message transcript-${msg.role}`}
          >
            <div className="transcript-bubble">
              <span className="transcript-role">
                {msg.role === 'user' ? '🎙️ You' : '🤖 AI'}
              </span>
              <p className="transcript-text">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

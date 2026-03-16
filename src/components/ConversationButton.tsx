import React from 'react';
import type { ConversationStatus } from '../types';
import './ConversationButton.css';

interface Props {
  status: ConversationStatus;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

const STATUS_LABELS: Record<ConversationStatus, string> = {
  idle: 'Start Speaking',
  recording: 'Stop & Send',
  'processing-stt': 'Transcribing…',
  generating: 'AI is thinking…',
  speaking: 'AI is speaking…',
  error: 'Try Again',
};

const STATUS_ICONS: Record<ConversationStatus, string> = {
  idle: '🎙️',
  recording: '⏹️',
  'processing-stt': '⏳',
  generating: '🧠',
  speaking: '🔊',
  error: '⚠️',
};

export const ConversationButton: React.FC<Props> = ({
  status,
  disabled = false,
  onStart,
  onStop,
}) => {
  const isRecording = status === 'recording';
  const isBusy =
    status === 'processing-stt' ||
    status === 'generating' ||
    status === 'speaking';

  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else if (status === 'idle' || status === 'error') {
      onStart();
    }
  };

  return (
    <div className="conversation-button-container">
      <button
        className={`conversation-button ${isRecording ? 'recording' : ''} ${isBusy ? 'busy' : ''}`}
        onClick={handleClick}
        disabled={disabled || isBusy}
        aria-label={STATUS_LABELS[status]}
      >
        <span className={`cb-icon ${isRecording ? 'pulse' : ''}`}>
          {STATUS_ICONS[status]}
        </span>
        <span className="cb-label">{STATUS_LABELS[status]}</span>
      </button>
      {isRecording && (
        <p className="cb-recording-hint">🔴 Recording… tap to stop</p>
      )}
    </div>
  );
};

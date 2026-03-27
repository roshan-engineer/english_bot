import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';

interface ConversationTranscriptProps {
  messages: Message[];
  /** Text being streamed into the current assistant bubble */
  streamingText?: string;
  /** Label shown while the AI is generating */
  status?: string;
}

/**
 * ConversationTranscript
 *
 * Scrollable chat transcript showing user and assistant messages.
 * Supports live streaming output for the current assistant response.
 */
const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  messages,
  streamingText,
  status,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever content changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const formatTime = (date: Date): string =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="transcript" role="log" aria-live="polite" aria-label="Conversation transcript">
      {messages.length === 0 && !streamingText && !status && (
        <div className="transcript-empty">
          <span>💬</span>
          <p>Your conversation will appear here.</p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message message-${msg.role}`}
          aria-label={`${msg.role === 'user' ? 'You' : 'AI'}: ${msg.text}`}
        >
          <div className="message-header">
            <span className="message-role">
              {msg.role === 'user' ? '🎙 You' : '🤖 AI'}
            </span>
            <span className="message-time">{formatTime(msg.timestamp)}</span>
          </div>
          <div className="message-text">{msg.text}</div>
          {msg.feedback && msg.feedback.length > 0 && (
            <div className="message-feedback">
              {msg.feedback.map((fb, i) => (
                <div key={i} className={`feedback-inline feedback-${fb.type}`}>
                  💡 <strong>{fb.type}:</strong>{' '}
                  {fb.original ? (
                    <>
                      <span className="feedback-original">{fb.original}</span>
                      {' → '}
                      <span className="feedback-suggestion">{fb.suggestion}</span>
                    </>
                  ) : (
                    fb.explanation
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Live streaming bubble */}
      {streamingText && (
        <div className="message message-assistant message-streaming">
          <div className="message-header">
            <span className="message-role">🤖 AI</span>
          </div>
          <div className="message-text">{streamingText}</div>
        </div>
      )}

      {/* Status indicator */}
      {status && !streamingText && (
        <div className="status-indicator">
          <span className="status-spinner">⟳</span>
          <span>{status}</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ConversationTranscript;

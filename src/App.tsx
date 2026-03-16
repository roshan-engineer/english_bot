import React, { useState, useCallback, useRef } from 'react';
import type {
  Personality,
  PracticeMode,
  Message,
  FeedbackResult,
  SDKStatus,
  ConversationStatus,
  ModelSetup,
} from './types';
import { buildSystemPrompt } from './services/PersonalityManager';
import { conversationEngine } from './services/ConversationEngine';
import { speechToTextService } from './services/SpeechToTextService';
import { textToSpeechService } from './services/TextToSpeechService';
import { feedbackAnalyzer } from './services/FeedbackAnalyzer';
import { AudioRecorder } from './services/AudioRecorder';
import { Selectors } from './components/Selectors';
import { TranscriptPanel } from './components/TranscriptPanel';
import { FeedbackPanel } from './components/FeedbackPanel';
import { ConversationButton } from './components/ConversationButton';
import { ModelSetupPanel } from './components/ModelSetupPanel';
import './App.css';

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export default function App() {
  // SDK / model state
  const [sdkStatus, setSdkStatus] = useState<SDKStatus>('idle');
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [sttAvailable, setSttAvailable] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const [modelSetup, setModelSetup] = useState<ModelSetup>({
    llmFile: null,
    sttEncoderFile: null,
    sttDecoderFile: null,
    sttTokensFile: null,
    ttsModelFile: null,
    ttsTokensFile: null,
  });

  // Conversation state
  const [personality, setPersonality] = useState<Personality>('friendly-friend');
  const [mode, setMode] = useState<PracticeMode>('conversation');
  const [messages, setMessages] = useState<Message[]>([]);
  const [convStatus, setConvStatus] = useState<ConversationStatus>('idle');
  const [streamingText, setStreamingText] = useState('');

  // Text input fallback (when STT unavailable)
  const [textInput, setTextInput] = useState('');

  // Feedback state
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isBusy = useRef(false);
  const recorderRef = useRef(new AudioRecorder());

  // ── Model Loading ──────────────────────────────────────────────────────────

  const handleLoadModels = useCallback(async () => {
    if (!modelSetup.llmFile) return;

    setSdkStatus('loading-models');
    setSdkError(null);

    try {
      // Initialize SDK and register LlamaCPP backend
      await conversationEngine.initialize();

      // Load LLM
      await conversationEngine.loadModel(modelSetup.llmFile);

      // Load STT if provided
      if (
        modelSetup.sttEncoderFile &&
        modelSetup.sttDecoderFile &&
        modelSetup.sttTokensFile
      ) {
        await speechToTextService.initialize();
        await speechToTextService.loadModel({
          encoder: modelSetup.sttEncoderFile,
          decoder: modelSetup.sttDecoderFile,
          tokens: modelSetup.sttTokensFile,
        });
        setSttAvailable(true);
      }

      // Load TTS if provided
      if (modelSetup.ttsModelFile && modelSetup.ttsTokensFile) {
        await textToSpeechService.initialize();
        await textToSpeechService.loadVoice({
          model: modelSetup.ttsModelFile,
          tokens: modelSetup.ttsTokensFile,
        });
        setTtsAvailable(true);
      }

      // Apply initial system prompt
      conversationEngine.setSystemPrompt(buildSystemPrompt(personality, mode));

      setSdkStatus('models-ready');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSdkError(`Failed to load models: ${msg}`);
      setSdkStatus('error');
    }
  }, [modelSetup, personality, mode]);

  // Update system prompt when personality/mode changes (if models loaded)
  const handlePersonalityChange = useCallback(
    (p: Personality) => {
      setPersonality(p);
      if (sdkStatus === 'models-ready') {
        conversationEngine.setSystemPrompt(buildSystemPrompt(p, mode));
      }
    },
    [sdkStatus, mode],
  );

  const handleModeChange = useCallback(
    (m: PracticeMode) => {
      setMode(m);
      if (sdkStatus === 'models-ready') {
        conversationEngine.setSystemPrompt(buildSystemPrompt(personality, m));
        conversationEngine.clearHistory();
        setMessages([]);
        setFeedback(null);
      }
    },
    [sdkStatus, personality],
  );

  // ── Conversation Turn ──────────────────────────────────────────────────────

  const processTurn = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isBusy.current) return;
      isBusy.current = true;

      // Add user message
      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        text: userText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      conversationEngine.addMessage(userMsg);

      // Analyze user speech for feedback (async, non-blocking)
      setIsAnalyzing(true);
      setFeedback(null);
      feedbackAnalyzer.analyze(userText).then((result) => {
        setFeedback(result);
        setIsAnalyzing(false);
      }).catch(() => {
        setIsAnalyzing(false);
      });

      // Generate AI response (streaming)
      setConvStatus('generating');
      setStreamingText('');

      let fullResponse = '';
      try {
        fullResponse = await conversationEngine.generateResponse(userText, {
          onToken: (_token, accumulated) => {
            setStreamingText(accumulated);
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setSdkError(msg);
        setConvStatus('error');
        isBusy.current = false;
        return;
      }

      setStreamingText('');

      // Add assistant message
      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        text: fullResponse,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      conversationEngine.addMessage(assistantMsg);

      // Speak the response if TTS is available
      if (ttsAvailable && fullResponse) {
        setConvStatus('speaking');
        try {
          await textToSpeechService.synthesize(fullResponse);
        } catch {
          // TTS failure is non-fatal
        }
      }

      setConvStatus('idle');
      isBusy.current = false;
    },
    [ttsAvailable],
  );

  // ── Voice Recording ────────────────────────────────────────────────────────

  const handleStartRecording = useCallback(async () => {
    if (convStatus !== 'idle' && convStatus !== 'error') return;
    try {
      await recorderRef.current.start();
      setConvStatus('recording');
    } catch {
      setSdkError('Microphone access denied. Please allow microphone access.');
      setConvStatus('error');
    }
  }, [convStatus]);

  const handleStopRecording = useCallback(async () => {
    if (convStatus !== 'recording') return;

    const audioData = recorderRef.current.stop();
    setConvStatus('processing-stt');

    try {
      let userText: string;
      if (sttAvailable) {
        userText = await speechToTextService.transcribe(audioData);
      } else {
        // Fallback: can't transcribe without STT model
        userText = '';
        setSdkError(
          'No STT model loaded. Please provide STT model files or use text input.',
        );
        setConvStatus('error');
        return;
      }

      if (!userText) {
        setSdkError('Could not transcribe speech. Please try again.');
        setConvStatus('error');
        return;
      }

      setSdkError(null);
      await processTurn(userText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSdkError(msg);
      setConvStatus('error');
    }
  }, [convStatus, sttAvailable, processTurn]);

  // ── Text Input Submit ──────────────────────────────────────────────────────

  const handleTextSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = textInput.trim();
      if (!text) return;
      setTextInput('');
      setConvStatus('generating');
      await processTurn(text);
    },
    [textInput, processTurn],
  );

  const handleClearConversation = useCallback(() => {
    conversationEngine.clearHistory();
    setMessages([]);
    setFeedback(null);
    setConvStatus('idle');
    setStreamingText('');
    setSdkError(null);
    isBusy.current = false;
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const isReady = sdkStatus === 'models-ready';
  const isLoadingModels = sdkStatus === 'loading-models';

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <span className="header-logo">🎓</span>
            <div>
              <h1 className="header-title">English Practice</h1>
              <p className="header-subtitle">AI-powered · 100% local · No cloud</p>
            </div>
          </div>
          {isReady && (
            <div className="header-badges">
              <span className="badge badge-ready">🧠 LLM Ready</span>
              {sttAvailable && <span className="badge badge-ready">🎙️ STT Ready</span>}
              {ttsAvailable && <span className="badge badge-ready">🔊 TTS Ready</span>}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="app-main">
        {!isReady ? (
          /* Setup screen */
          <div className="setup-screen">
            <ModelSetupPanel
              setup={modelSetup}
              onSetupChange={setModelSetup}
              onLoad={handleLoadModels}
              isLoading={isLoadingModels}
              loadError={sdkError}
            />
          </div>
        ) : (
          /* Main app */
          <div className="main-layout">
            {/* Left sidebar */}
            <aside className="sidebar">
              <Selectors
                personality={personality}
                mode={mode}
                onPersonalityChange={handlePersonalityChange}
                onModeChange={handleModeChange}
                disabled={convStatus !== 'idle' && convStatus !== 'error'}
              />

              <div className="sidebar-actions">
                <button
                  className="clear-button"
                  onClick={handleClearConversation}
                  disabled={messages.length === 0}
                >
                  🗑️ Clear Conversation
                </button>
              </div>

              {/* Feedback Panel */}
              <div className="sidebar-feedback">
                <h3 className="sidebar-section-title">📊 Feedback</h3>
                <FeedbackPanel
                  feedback={feedback}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            </aside>

            {/* Main conversation area */}
            <section className="conversation-area">
              {/* Error banner */}
              {sdkError && (
                <div className="error-banner">
                  <span>⚠️</span>
                  <span>{sdkError}</span>
                  <button
                    className="error-dismiss"
                    onClick={() => setSdkError(null)}
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Streaming indicator */}
              {streamingText && (
                <div className="streaming-banner">
                  <div className="streaming-dot" />
                  <span className="streaming-preview">
                    {streamingText.slice(0, 120)}
                    {streamingText.length > 120 ? '…' : ''}
                  </span>
                </div>
              )}

              {/* Transcript */}
              <TranscriptPanel messages={messages} />

              {/* Controls */}
              <div className="controls">
                <ConversationButton
                  status={convStatus}
                  disabled={!isReady}
                  onStart={handleStartRecording}
                  onStop={handleStopRecording}
                />

                {/* Text input fallback */}
                <div className="text-input-area">
                  <form className="text-form" onSubmit={handleTextSubmit}>
                    <input
                      className="text-input"
                      type="text"
                      placeholder={
                        sttAvailable
                          ? 'Or type your message here…'
                          : 'Type your message (no STT model loaded)…'
                      }
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      disabled={
                        convStatus !== 'idle' && convStatus !== 'error'
                      }
                    />
                    <button
                      type="submit"
                      className="text-submit-button"
                      disabled={
                        !textInput.trim() ||
                        (convStatus !== 'idle' && convStatus !== 'error')
                      }
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

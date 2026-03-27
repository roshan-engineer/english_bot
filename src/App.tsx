import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import './App.css';

import type {
  AppState,
  FeedbackItem,
  Message,
  ModelStatus,
  Personality,
  PracticeMode,
  SessionStats,
} from './types';
import { ConversationEngine } from './services/ConversationEngine';
import { FeedbackAnalyzer } from './services/FeedbackAnalyzer';
import { SpeechToTextService } from './services/SpeechToText';
import type { STTModelFiles } from './services/SpeechToText';
import { TextToSpeechService } from './services/TextToSpeech';
import type { TTSModelFiles } from './services/TextToSpeech';

import ModelSetup from './components/ModelSetup';
import PersonalitySelector from './components/PersonalitySelector';
import PracticeModeSelector from './components/PracticeModeSelector';
import AudioRecorder from './components/AudioRecorder';
import ConversationTranscript from './components/ConversationTranscript';
import FeedbackPanel from './components/FeedbackPanel';

const App: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    llm: 'idle',
    stt: 'idle',
    tts: 'idle',
  });

  const [appState, setAppState] = useState<AppState>('setup');
  const [errorMsg, setErrorMsg] = useState('');

  const [personality, setPersonality] = useState<Personality>('friendly_friend');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('conversation');

  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [allFeedback, setAllFeedback] = useState<FeedbackItem[]>([]);
  const [textInput, setTextInput] = useState('');
  const [statusLabel, setStatusLabel] = useState('');

  const [stats, setStats] = useState<SessionStats>({
    messageCount: 0,
    feedbackCount: 0,
    startedAt: new Date(),
  });

  const engineRef = useRef<ConversationEngine | null>(null);
  const sttRef = useRef<SpeechToTextService>(new SpeechToTextService());
  const ttsRef = useRef<TextToSpeechService>(new TextToSpeechService());
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const llmReady = modelStatus.llm === 'ready';
  const allModelsReady =
    llmReady &&
    (modelStatus.stt === 'ready' || modelStatus.stt === 'unavailable') &&
    (modelStatus.tts === 'ready' || modelStatus.tts === 'unavailable');

  // Initialise the RunAnywhere SDK once on mount
  useEffect(() => {
    (async () => {
      try {
        const { RunAnywhere, SDKEnvironment } = await import('@runanywhere/web');
        if (!RunAnywhere.isInitialized) {
          await RunAnywhere.initialize({ environment: SDKEnvironment.Development });
        }
        const { LlamaCPP } = await import('@runanywhere/web-llamacpp');
        if (!LlamaCPP.isRegistered) {
          await LlamaCPP.register();
        }
      } catch (err) {
        console.error('Failed to initialise RunAnywhere SDK:', err);
        setErrorMsg(
          `SDK init failed: ${err instanceof Error ? err.message : String(err)}`
        );
        setAppState('error');
      }
    })();
  }, []);

  const handleLoadLLM = useCallback(async (file: File) => {
    setModelStatus((s) => ({ ...s, llm: 'loading' }));
    try {
      const { TextGeneration } = await import('@runanywhere/web-llamacpp');
      const { LlamaCppBridge } = await import('@runanywhere/web-llamacpp');

      const bridge = LlamaCppBridge.shared;
      const modelPath = `/models/${file.name}`;
      await bridge.writeFileStream(modelPath, file.stream());
      await TextGeneration.loadModel(
        modelPath,
        file.name.replace('.gguf', ''),
        file.name
      );
      setModelStatus((s) => ({ ...s, llm: 'ready' }));
    } catch (err) {
      setModelStatus((s) => ({ ...s, llm: 'error' }));
      throw err;
    }
  }, []);

  const handleLoadSTT = useCallback(async (files: STTModelFiles) => {
    setModelStatus((s) => ({ ...s, stt: 'loading' }));
    try {
      const { ONNX } = await import('@runanywhere/web-onnx');
      if (!ONNX.isRegistered) {
        await ONNX.register();
      }
      await sttRef.current.loadModel(files);
      setModelStatus((s) => ({ ...s, stt: 'ready' }));
    } catch (err) {
      setModelStatus((s) => ({ ...s, stt: 'error' }));
      throw err;
    }
  }, []);

  const handleSkipSTT = useCallback(() => {
    setModelStatus((s) => ({ ...s, stt: 'unavailable' }));
  }, []);

  const handleLoadTTS = useCallback(async (files: TTSModelFiles) => {
    setModelStatus((s) => ({ ...s, tts: 'loading' }));
    try {
      const { ONNX } = await import('@runanywhere/web-onnx');
      if (!ONNX.isRegistered) {
        await ONNX.register();
      }
      await ttsRef.current.loadVoice(files);
      setModelStatus((s) => ({ ...s, tts: 'ready' }));
    } catch (err) {
      setModelStatus((s) => ({ ...s, tts: 'error' }));
      throw err;
    }
  }, []);

  const handleSkipTTS = useCallback(() => {
    setModelStatus((s) => ({ ...s, tts: 'unavailable' }));
  }, []);

  const handleStartPractice = useCallback(() => {
    if (!allModelsReady) return;

    const engine = new ConversationEngine({ personality, mode: practiceMode });
    engineRef.current = engine;

    const starterText = engine.getStarterMessage();
    const starterMsg = ConversationEngine.makeMessage('assistant', starterText);

    setMessages([starterMsg]);
    setAllFeedback([]);
    setStreamingText('');
    setTextInput('');
    setStats({ messageCount: 0, feedbackCount: 0, startedAt: new Date() });
    setAppState('ready');

    if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    statsTimerRef.current = setInterval(() => {
      setStats((s) => ({ ...s }));
    }, 1000);
  }, [allModelsReady, personality, practiceMode]);

  const handleEndSession = useCallback(() => {
    if (statsTimerRef.current) {
      clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    }
    setAppState('setup');
    setMessages([]);
    setStreamingText('');
    setStatusLabel('');
    engineRef.current?.clearHistory();
  }, []);

  const processUserInput = useCallback(async (userText: string) => {
    if (!userText.trim() || !engineRef.current) return;

    const engine = engineRef.current;

    const userMsg = ConversationEngine.makeMessage('user', userText.trim());
    setMessages((prev) => [...prev, userMsg]);
    setStats((s) => ({ ...s, messageCount: s.messageCount + 1 }));

    setAppState('generating');
    setStatusLabel('AI is thinking…');
    setStreamingText('');

    let fullResponse = '';
    try {
      for await (const token of engine.chatStream(userText.trim())) {
        fullResponse += token;
        setStreamingText(fullResponse);
      }
    } catch (err) {
      const errText = err instanceof Error ? err.message : String(err);
      setStreamingText('');
      setStatusLabel('');
      setAppState('ready');
      setMessages((prev) => [
        ...prev,
        ConversationEngine.makeMessage('assistant', `⚠️ Error: ${errText}`),
      ]);
      return;
    }

    setStreamingText('');

    const { cleanedText, feedbackItems } = FeedbackAnalyzer.analyze(fullResponse);
    if (feedbackItems.length > 0) {
      setAllFeedback((prev) => [...prev, ...feedbackItems]);
      setStats((s) => ({
        ...s,
        feedbackCount: s.feedbackCount + feedbackItems.length,
      }));
    }

    const assistantMsg = ConversationEngine.makeMessage(
      'assistant',
      cleanedText,
      feedbackItems.length > 0 ? feedbackItems : undefined
    );
    setMessages((prev) => [...prev, assistantMsg]);

    if (ttsRef.current.isReady) {
      setAppState('speaking');
      setStatusLabel('Speaking…');
      try {
        await ttsRef.current.speak(cleanedText);
      } catch (err) {
        console.warn('TTS speak failed:', err);
      }
    }

    setStatusLabel('');
    setAppState('ready');
  }, []);

  const handleRecordStart = useCallback(() => {
    setAppState('recording');
    setStatusLabel('Listening…');
  }, []);

  const handleRecordStop = useCallback(
    async (samples: Float32Array) => {
      if (!sttRef.current.isReady) return;

      setAppState('transcribing');
      setStatusLabel('Transcribing…');

      try {
        const transcript = await sttRef.current.transcribe(samples);
        if (transcript) {
          await processUserInput(transcript);
        } else {
          setStatusLabel('');
          setAppState('ready');
        }
      } catch (err) {
        console.error('Transcription error:', err);
        setStatusLabel('Transcription failed. Please try again.');
        setAppState('ready');
      }
    },
    [processUserInput]
  );

  const handleTextSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!textInput.trim() || appState !== 'ready') return;
      const text = textInput;
      setTextInput('');
      await processUserInput(text);
    },
    [textInput, appState, processUserInput]
  );

  const handlePersonalityChange = useCallback(
    (p: Personality) => {
      setPersonality(p);
      if (appState !== 'setup') {
        engineRef.current?.reconfigure(p, practiceMode);
      }
    },
    [appState, practiceMode]
  );

  const handleModeChange = useCallback(
    (m: PracticeMode) => {
      setPracticeMode(m);
      if (appState !== 'setup') {
        engineRef.current?.reconfigure(personality, m);
      }
    },
    [appState, personality]
  );

  useEffect(() => {
    return () => {
      if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    };
  }, []);

  const isInSession = appState !== 'setup' && appState !== 'error';
  const isIdle = appState === 'ready';
  const isRecording = appState === 'recording';
  const isBusy =
    appState === 'transcribing' ||
    appState === 'generating' ||
    appState === 'speaking';
  const sttAvailable = modelStatus.stt === 'ready';

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="header-title">🗣 English Speaking Practice</h1>
        <div className="header-badges">
          {llmReady && <span className="badge badge-green">LLM ✓</span>}
          {modelStatus.stt === 'ready' && (
            <span className="badge badge-blue">STT ✓</span>
          )}
          {modelStatus.tts === 'ready' && (
            <span className="badge badge-purple">TTS ✓</span>
          )}
        </div>
        {isInSession && (
          <button className="end-btn" onClick={handleEndSession}>
            ⏹ End Session
          </button>
        )}
      </header>

      {appState === 'error' && (
        <div className="error-banner">
          <strong>⚠️ Error:</strong> {errorMsg}
        </div>
      )}

      {appState === 'setup' && (
        <main className="setup-screen">
          <ModelSetup
            modelStatus={modelStatus}
            onLoadLLM={handleLoadLLM}
            onLoadSTT={handleLoadSTT}
            onLoadTTS={handleLoadTTS}
            onSkipSTT={handleSkipSTT}
            onSkipTTS={handleSkipTTS}
          />

          {allModelsReady && (
            <div className="session-config">
              <PersonalitySelector
                value={personality}
                onChange={handlePersonalityChange}
              />
              <PracticeModeSelector
                value={practiceMode}
                onChange={handleModeChange}
              />
              <button
                className="start-btn"
                onClick={handleStartPractice}
                disabled={!allModelsReady}
              >
                🚀 Start Practice
              </button>
            </div>
          )}
        </main>
      )}

      {isInSession && (
        <main className="session-screen">
          <div className="session-main">
            <div className="session-controls">
              <PersonalitySelector
                value={personality}
                onChange={handlePersonalityChange}
                disabled={isBusy}
              />
              <PracticeModeSelector
                value={practiceMode}
                onChange={handleModeChange}
                disabled={isBusy}
              />
            </div>

            <ConversationTranscript
              messages={messages}
              streamingText={streamingText}
              status={statusLabel}
            />

            <div className="input-area">
              {sttAvailable && (
                <AudioRecorder
                  isRecording={isRecording}
                  onStart={handleRecordStart}
                  onStop={handleRecordStop}
                  disabled={isBusy && !isRecording}
                />
              )}

              <form className="text-input-form" onSubmit={handleTextSubmit}>
                <input
                  type="text"
                  className="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    sttAvailable ? 'Or type your message…' : 'Type your message…'
                  }
                  disabled={!isIdle}
                  aria-label="Type your message"
                />
                <button
                  type="submit"
                  className="send-btn"
                  disabled={!isIdle || !textInput.trim()}
                  aria-label="Send message"
                >
                  ➤
                </button>
              </form>
            </div>
          </div>

          <FeedbackPanel feedback={allFeedback} stats={stats} />
        </main>
      )}
    </div>
  );
};

export default App;

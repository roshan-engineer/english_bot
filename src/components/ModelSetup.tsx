import React, { useCallback, useRef, useState } from 'react';
import type { ModelStatus } from '../types';
import type { STTModelFiles } from '../services/SpeechToText';
import type { TTSModelFiles } from '../services/TextToSpeech';

interface ModelSetupProps {
  modelStatus: ModelStatus;
  onLoadLLM: (file: File) => Promise<void>;
  onLoadSTT: (files: STTModelFiles) => Promise<void>;
  onLoadTTS: (files: TTSModelFiles) => Promise<void>;
  onSkipSTT: () => void;
  onSkipTTS: () => void;
}

/**
 * ModelSetup component
 *
 * Guides the user through loading the three AI models required for the
 * English speaking assistant:
 *   1. LLM  — user supplies a GGUF model file (required)
 *   2. STT  — user supplies Whisper ONNX files (optional, enables voice input)
 *   3. TTS  — user supplies Piper ONNX files  (optional, enables voice output)
 *
 * All models run 100% locally — no network requests are made.
 */
const ModelSetup: React.FC<ModelSetupProps> = ({
  modelStatus,
  onLoadLLM,
  onLoadSTT,
  onLoadTTS,
  onSkipSTT,
  onSkipTTS,
}) => {
  // LLM
  const llmFileRef = useRef<HTMLInputElement>(null);
  const [llmError, setLlmError] = useState('');

  // STT
  const sttEncoderRef = useRef<HTMLInputElement>(null);
  const sttDecoderRef = useRef<HTMLInputElement>(null);
  const sttTokensRef = useRef<HTMLInputElement>(null);
  const [sttError, setSttError] = useState('');
  const [sttLoading, setSttLoading] = useState(false);

  // TTS
  const ttsModelRef = useRef<HTMLInputElement>(null);
  const ttsTokensRef = useRef<HTMLInputElement>(null);
  const ttsEspeakRef = useRef<HTMLInputElement>(null);
  const [ttsError, setTtsError] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);

  const handleLoadLLM = useCallback(async () => {
    const file = llmFileRef.current?.files?.[0];
    if (!file) {
      setLlmError('Please select a GGUF model file.');
      return;
    }
    setLlmError('');
    try {
      await onLoadLLM(file);
    } catch (err) {
      setLlmError(`Failed to load LLM: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [onLoadLLM]);

  const handleLoadSTT = useCallback(async () => {
    const encoder = sttEncoderRef.current?.files?.[0];
    const decoder = sttDecoderRef.current?.files?.[0];
    const tokens = sttTokensRef.current?.files?.[0];
    if (!encoder || !decoder || !tokens) {
      setSttError('Please select all three STT files (encoder, decoder, tokens).');
      return;
    }
    setSttError('');
    setSttLoading(true);
    try {
      await onLoadSTT({ encoder, decoder, tokens });
    } catch (err) {
      setSttError(`Failed to load STT: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSttLoading(false);
    }
  }, [onLoadSTT]);

  const handleLoadTTS = useCallback(async () => {
    const model = ttsModelRef.current?.files?.[0];
    const tokens = ttsTokensRef.current?.files?.[0];
    if (!model || !tokens) {
      setTtsError('Please select the TTS model ONNX and tokens files.');
      return;
    }
    setTtsError('');
    setTtsLoading(true);
    const espeakData = ttsEspeakRef.current?.files?.[0];
    try {
      await onLoadTTS({ model, tokens, ...(espeakData ? { espeakData } : {}) });
    } catch (err) {
      setTtsError(`Failed to load TTS: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTtsLoading(false);
    }
  }, [onLoadTTS]);

  const isReady = (s: ModelStatus[keyof ModelStatus]) =>
    s === 'ready' || s === 'unavailable';

  const allReady =
    modelStatus.llm === 'ready' &&
    isReady(modelStatus.stt) &&
    isReady(modelStatus.tts);

  return (
    <div className="model-setup">
      <div className="setup-header">
        <h1 className="app-title">🗣 AI English Speaking Practice</h1>
        <p className="app-subtitle">
          100% local AI — no API keys, no cloud, fully private.
        </p>
        <p className="setup-intro">
          Load your AI models below to get started. All inference runs directly
          in your browser using the{' '}
          <a href="https://github.com/RunanywhereAI/runanywhere-sdks" target="_blank" rel="noopener noreferrer">
            RunAnywhere SDK
          </a>
          .
        </p>
      </div>

      <div className="setup-steps">
        {/* ── LLM ───────────────────────────────────────────────────── */}
        <div className={`setup-step ${modelStatus.llm === 'ready' ? 'step-done' : ''}`}>
          <div className="step-header">
            <span className="step-badge">
              {modelStatus.llm === 'ready' ? '✅' : modelStatus.llm === 'loading' ? '⏳' : '1'}
            </span>
            <div>
              <h4>Language Model (LLM) <span className="required-badge">Required</span></h4>
              <p className="step-desc">
                A GGUF-format language model (e.g.{' '}
                <a
                  href="https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Qwen2.5-0.5B-Q4
                </a>
                {' '}or{' '}
                <a
                  href="https://huggingface.co/HuggingFaceTB/smollm2-360M-instruct-add-basics/resolve/main/smollm2-360m-instruct-q4_k_m.gguf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SmolLM2-360M
                </a>
                ).
                Smaller models (&lt;1 GB) work best in the browser.
              </p>
            </div>
          </div>
          {modelStatus.llm !== 'ready' && (
            <div className="step-body">
              <div className="file-row">
                <label htmlFor="llm-file" className="file-label">GGUF model file</label>
                <input
                  id="llm-file"
                  ref={llmFileRef}
                  type="file"
                  accept=".gguf"
                  className="file-input"
                  disabled={modelStatus.llm === 'loading'}
                />
              </div>
              {llmError && <p className="error-msg">{llmError}</p>}
              <button
                className="load-btn"
                onClick={handleLoadLLM}
                disabled={modelStatus.llm === 'loading'}
              >
                {modelStatus.llm === 'loading' ? '⏳ Loading…' : '🚀 Load LLM'}
              </button>
            </div>
          )}
        </div>

        {/* ── STT ───────────────────────────────────────────────────── */}
        <div
          className={`setup-step ${
            modelStatus.stt === 'ready'
              ? 'step-done'
              : modelStatus.stt === 'unavailable'
              ? 'step-skipped'
              : ''
          }`}
        >
          <div className="step-header">
            <span className="step-badge">
              {modelStatus.stt === 'ready'
                ? '✅'
                : modelStatus.stt === 'unavailable'
                ? '⏭'
                : modelStatus.stt === 'loading'
                ? '⏳'
                : '2'}
            </span>
            <div>
              <h4>Speech Recognition (STT) <span className="optional-badge">Optional</span></h4>
              <p className="step-desc">
                Whisper ONNX files for voice input. Download from{' '}
                <a
                  href="https://huggingface.co/csukuangfj/sherpa-onnx-whisper-tiny.en/tree/main"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  HuggingFace (sherpa-onnx-whisper-tiny.en)
                </a>
                . You need: <code>tiny.en-encoder.int8.onnx</code>,{' '}
                <code>tiny.en-decoder.int8.onnx</code>, <code>tiny.en-tokens.txt</code>.
                Skip to use text input instead.
              </p>
            </div>
          </div>
          {modelStatus.stt === 'idle' || modelStatus.stt === 'error' ? (
            <div className="step-body">
              <div className="file-row">
                <label htmlFor="stt-encoder" className="file-label">Encoder ONNX</label>
                <input id="stt-encoder" ref={sttEncoderRef} type="file" accept=".onnx" className="file-input" />
              </div>
              <div className="file-row">
                <label htmlFor="stt-decoder" className="file-label">Decoder ONNX</label>
                <input id="stt-decoder" ref={sttDecoderRef} type="file" accept=".onnx" className="file-input" />
              </div>
              <div className="file-row">
                <label htmlFor="stt-tokens" className="file-label">Tokens TXT</label>
                <input id="stt-tokens" ref={sttTokensRef} type="file" accept=".txt" className="file-input" />
              </div>
              {sttError && <p className="error-msg">{sttError}</p>}
              <div className="btn-row">
                <button className="load-btn" onClick={handleLoadSTT} disabled={sttLoading}>
                  {sttLoading ? '⏳ Loading…' : '🎙 Load STT'}
                </button>
                <button className="skip-btn" onClick={onSkipSTT}>
                  ⏭ Skip (text input)
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── TTS ───────────────────────────────────────────────────── */}
        <div
          className={`setup-step ${
            modelStatus.tts === 'ready'
              ? 'step-done'
              : modelStatus.tts === 'unavailable'
              ? 'step-skipped'
              : ''
          }`}
        >
          <div className="step-header">
            <span className="step-badge">
              {modelStatus.tts === 'ready'
                ? '✅'
                : modelStatus.tts === 'unavailable'
                ? '⏭'
                : modelStatus.tts === 'loading'
                ? '⏳'
                : '3'}
            </span>
            <div>
              <h4>Text-to-Speech (TTS) <span className="optional-badge">Optional</span></h4>
              <p className="step-desc">
                Piper/VITS ONNX voice files for spoken AI responses. Download from{' '}
                <a
                  href="https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sherpa-onnx TTS releases
                </a>
                . You need: the model <code>.onnx</code> and <code>tokens.txt</code>. 
                Optionally provide <code>espeak-ng-data.tar.gz</code> for Piper models.
                Skip to show text responses instead.
              </p>
            </div>
          </div>
          {modelStatus.tts === 'idle' || modelStatus.tts === 'error' ? (
            <div className="step-body">
              <div className="file-row">
                <label htmlFor="tts-model" className="file-label">Model ONNX</label>
                <input id="tts-model" ref={ttsModelRef} type="file" accept=".onnx" className="file-input" />
              </div>
              <div className="file-row">
                <label htmlFor="tts-tokens" className="file-label">Tokens TXT</label>
                <input id="tts-tokens" ref={ttsTokensRef} type="file" accept=".txt" className="file-input" />
              </div>
              <div className="file-row">
                <label htmlFor="tts-espeak" className="file-label">espeak-ng-data (optional)</label>
                <input id="tts-espeak" ref={ttsEspeakRef} type="file" accept=".gz,.tar.gz,.tgz" className="file-input" />
              </div>
              {ttsError && <p className="error-msg">{ttsError}</p>}
              <div className="btn-row">
                <button className="load-btn" onClick={handleLoadTTS} disabled={ttsLoading}>
                  {ttsLoading ? '⏳ Loading…' : '🔊 Load TTS'}
                </button>
                <button className="skip-btn" onClick={onSkipTTS}>
                  ⏭ Skip (text only)
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {allReady && (
        <div className="setup-complete">
          <p>✅ All models ready! Click <strong>Start Practice</strong> above to begin.</p>
        </div>
      )}
    </div>
  );
};

export default ModelSetup;

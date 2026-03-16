import React from 'react';
import type { ModelSetup } from '../types';
import './ModelSetupPanel.css';

interface Props {
  setup: ModelSetup;
  onSetupChange: (setup: ModelSetup) => void;
  onLoad: () => void;
  isLoading: boolean;
  loadError: string | null;
}

function FileInput({
  label,
  accept,
  file,
  onChange,
  required,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  required?: boolean;
}) {
  return (
    <label className="file-input-label">
      <span className="file-input-name">
        {label}
        {required && <span className="file-required">*</span>}
      </span>
      <input
        type="file"
        accept={accept}
        className="file-input-hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <span className={`file-input-badge ${file ? 'file-selected' : ''}`}>
        {file ? `✅ ${file.name}` : 'Choose file…'}
      </span>
    </label>
  );
}

export const ModelSetupPanel: React.FC<Props> = ({
  setup,
  onSetupChange,
  onLoad,
  isLoading,
  loadError,
}) => {
  const update = (patch: Partial<ModelSetup>) =>
    onSetupChange({ ...setup, ...patch });

  const canLoad = setup.llmFile !== null;

  return (
    <div className="model-setup-panel">
      <div className="setup-header">
        <h2 className="setup-title">🔧 Model Setup</h2>
        <p className="setup-subtitle">
          Load local AI model files to enable on-device English practice.
          All processing runs in your browser — no data leaves your device.
        </p>
      </div>

      <div className="setup-section">
        <h3 className="setup-section-title">
          🧠 Language Model (LLM) <span className="required-badge">Required</span>
        </h3>
        <p className="setup-hint">
          A GGUF model file (e.g. <code>smollm2-360m-instruct-q4_0.gguf</code>).
          Small models (&lt;500 MB) work best.
        </p>
        <FileInput
          label="LLM Model (.gguf)"
          accept=".gguf"
          file={setup.llmFile}
          onChange={(f) => update({ llmFile: f })}
          required
        />
      </div>

      <div className="setup-section">
        <h3 className="setup-section-title">
          🎙️ Speech-to-Text (Optional)
        </h3>
        <p className="setup-hint">
          Whisper ONNX files for voice input. Without these, you can type your
          messages instead.
        </p>
        <div className="file-group">
          <FileInput
            label="Encoder (.onnx)"
            accept=".onnx"
            file={setup.sttEncoderFile}
            onChange={(f) => update({ sttEncoderFile: f })}
          />
          <FileInput
            label="Decoder (.onnx)"
            accept=".onnx"
            file={setup.sttDecoderFile}
            onChange={(f) => update({ sttDecoderFile: f })}
          />
          <FileInput
            label="Tokens (.txt)"
            accept=".txt"
            file={setup.sttTokensFile}
            onChange={(f) => update({ sttTokensFile: f })}
          />
        </div>
      </div>

      <div className="setup-section">
        <h3 className="setup-section-title">
          🔊 Text-to-Speech (Optional)
        </h3>
        <p className="setup-hint">
          Piper VITS ONNX voice files for spoken AI responses.
        </p>
        <div className="file-group">
          <FileInput
            label="Voice Model (.onnx)"
            accept=".onnx"
            file={setup.ttsModelFile}
            onChange={(f) => update({ ttsModelFile: f })}
          />
          <FileInput
            label="Tokens (.txt)"
            accept=".txt"
            file={setup.ttsTokensFile}
            onChange={(f) => update({ ttsTokensFile: f })}
          />
        </div>
      </div>

      {loadError && (
        <div className="setup-error">
          <span>⚠️</span> {loadError}
        </div>
      )}

      <button
        className="setup-load-button"
        onClick={onLoad}
        disabled={!canLoad || isLoading}
      >
        {isLoading ? (
          <>
            <span className="setup-spinner" />
            Loading models…
          </>
        ) : (
          '🚀 Load Models & Start'
        )}
      </button>

      <p className="setup-note">
        ℹ️ Models from the{' '}
        <a
          href="https://github.com/RunanywhereAI/runanywhere-sdks"
          target="_blank"
          rel="noopener noreferrer"
        >
          RunAnywhere SDK
        </a>{' '}
        are compatible. Download GGUF models from{' '}
        <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer">
          Hugging Face
        </a>.
      </p>
    </div>
  );
};

# 🗣 AI English Speaking Practice

A web-based AI English speaking practice assistant that runs **100% locally** in the browser. No API keys, no cloud services — all AI inference is powered by the [RunAnywhere SDK](https://github.com/RunanywhereAI/runanywhere-sdks).

## ✨ Features

- **Voice input** — speak using your microphone; Whisper STT transcribes your speech locally
- **AI conversation** — local LLM (GGUF format) generates contextual replies
- **Voice output** — Piper TTS synthesises spoken AI responses locally
- **Personality system** — choose from Friendly Friend, English Teacher, Debate Partner, Job Interviewer, or Casual Companion
- **Practice modes** — Free Conversation, Interview, Daily Conversations, Debate, and Story Builder
- **Learning feedback** — grammar corrections and vocabulary suggestions extracted from AI responses
- **Session stats** — message count, correction count, and session duration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install & run

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

> **Important:** The app needs specific browser headers (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless`) for WebAssembly multi-threading. These are set automatically in development by the Vite dev server. A COI Service Worker handles production deployments where these headers are not available.

## 🤖 Model Setup

The app requires you to bring your own models. All models run locally — they are loaded into your browser's memory and never sent to any server.

### 1. Language Model (LLM) — **Required**

Any GGUF-format instruction-following model. Recommended small models that work well in-browser:

| Model | Size | Download |
|-------|------|----------|
| Qwen2.5-0.5B-Instruct Q4 | ~400 MB | [HuggingFace](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf) |
| SmolLM2-360M-Instruct Q4 | ~230 MB | [HuggingFace](https://huggingface.co/HuggingFaceTB/smollm2-360M-instruct-add-basics/resolve/main/smollm2-360m-instruct-q4_k_m.gguf) |

### 2. Speech-to-Text (STT) — Optional

Enables voice input via microphone. Uses Whisper (sherpa-onnx format). You need 3 files:

- `tiny.en-encoder.int8.onnx`
- `tiny.en-decoder.int8.onnx`
- `tiny.en-tokens.txt`

Download from [csukuangfj/sherpa-onnx-whisper-tiny.en on HuggingFace](https://huggingface.co/csukuangfj/sherpa-onnx-whisper-tiny.en/tree/main).

If you skip STT, the app falls back to text input.

### 3. Text-to-Speech (TTS) — Optional

Enables spoken AI responses. Uses Piper/VITS (sherpa-onnx format). You need:

- A `.onnx` model file
- A `tokens.txt` file
- Optionally `espeak-ng-data.tar.gz` for Piper models

Browse available voices at [sherpa-onnx TTS releases](https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models).

If you skip TTS, AI responses are shown as text only.

## 🏗 Architecture

```
src/
├── types/
│   └── index.ts               # Shared TypeScript types
├── services/
│   ├── PersonalityManager.ts  # Personality & practice mode configurations + prompts
│   ├── FeedbackAnalyzer.ts    # Parses grammar/vocabulary tips from AI responses
│   ├── ConversationEngine.ts  # LLM chat loop with sliding-window history
│   ├── SpeechToText.ts        # Whisper STT via RunAnywhere ONNX SDK
│   └── TextToSpeech.ts        # Piper TTS via RunAnywhere ONNX SDK
└── components/
    ├── ModelSetup.tsx          # Model loading UI (step 1 before practice)
    ├── PersonalitySelector.tsx # Card picker for AI personality
    ├── PracticeModeSelector.tsx# Card picker for practice mode
    ├── AudioRecorder.tsx       # Microphone capture → Float32Array PCM
    ├── ConversationTranscript.tsx # Scrollable chat transcript
    └── FeedbackPanel.tsx       # Session stats and corrections panel
```

## 🔧 Tech Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite 8
- **AI Runtime:** [RunAnywhere Web SDK](https://github.com/RunanywhereAI/runanywhere-sdks) (`@runanywhere/web`, `@runanywhere/web-llamacpp`, `@runanywhere/web-onnx`)
- **Audio:** Web Audio API + MediaDevices API
- **LLM backend:** llama.cpp (via WebAssembly)
- **STT backend:** sherpa-onnx Whisper (via WebAssembly)
- **TTS backend:** sherpa-onnx Piper (via WebAssembly)

## 📦 Build

```bash
npm run build      # TypeScript compile + Vite production build
npm run preview    # Serve production build locally
```

## 📝 License

MIT

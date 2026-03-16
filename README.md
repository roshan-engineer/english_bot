# English Practice Assistant

A web-based AI English speaking practice assistant that runs **completely locally** using the [RunAnywhere SDK](https://github.com/RunanywhereAI/runanywhere-sdks). No API keys, no cloud services — all AI inference runs in your browser.

## Features

- 🎙️ **Voice input** via browser microphone (requires Whisper STT model)
- �� **Voice output** via Piper VITS TTS (requires TTS model files)
- ⌨️ **Text input fallback** — no microphone required
- 🧠 **Local LLM** conversation engine (GGUF models via llama.cpp WASM)
- 📊 **Real-time grammar & vocabulary feedback**
- 🎭 **5 personality types**: Friendly Friend, English Teacher, Debate Partner, Job Interviewer, Casual Companion
- 💬 **5 practice modes**: Conversation, Interview, Daily Life, Debate, Story Mode
- 🌙 **Dark mode** support
- 📱 **Responsive** layout

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build**: Vite 8
- **AI Runtime**: [@runanywhere/web](https://github.com/RunanywhereAI/runanywhere-sdks) SDK
  - `@runanywhere/web-llamacpp` — LLM via llama.cpp WASM
  - `@runanywhere/web-onnx` — STT/TTS via sherpa-onnx WASM

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Model Setup

The app requires at least one local model file:

### Required — Language Model (LLM)
- Download a GGUF model from [Hugging Face](https://huggingface.co)
- Recommended for performance: `smollm2-360m-instruct-q4_0.gguf` (~200 MB)
- Larger models give better quality: `mistral-7b-instruct-v0.3.Q4_K_M.gguf`

### Optional — Speech-to-Text (Whisper)
Three files needed:
- `encoder.onnx`
- `decoder.onnx`
- `tokens.txt`

Download Whisper ONNX models from the [sherpa-onnx model repository](https://github.com/k2-fsa/sherpa-onnx).

### Optional — Text-to-Speech (Piper)
Two files needed:
- `model.onnx`
- `tokens.txt`

Download Piper VITS voice models from the [sherpa-onnx model repository](https://github.com/k2-fsa/sherpa-onnx).

## System Pipeline

```
User microphone input
  → STT (Whisper via sherpa-onnx WASM)
  → LLM conversation engine (llama.cpp WASM)
  → TTS synthesis (Piper VITS via sherpa-onnx WASM)
  → Audio playback
```

## Architecture

```
src/
├── types/          # TypeScript interfaces
├── services/
│   ├── AudioRecorder.ts        # Microphone capture (Web Audio API)
│   ├── SpeechToTextService.ts  # STT via RunAnywhere ONNX
│   ├── TextToSpeechService.ts  # TTS via RunAnywhere ONNX
│   ├── ConversationEngine.ts   # LLM via RunAnywhere LlamaCPP
│   ├── PersonalityManager.ts   # Personality + mode prompts
│   └── FeedbackAnalyzer.ts     # Grammar/vocab feedback
└── components/
    ├── Selectors.tsx            # Personality + mode selectors
    ├── TranscriptPanel.tsx      # Live conversation transcript
    ├── FeedbackPanel.tsx        # Grammar/vocabulary feedback
    ├── ConversationButton.tsx   # Start/stop recording button
    └── ModelSetupPanel.tsx      # Model file loader
```

## Build

```bash
npm run build
```

## Notes

- The browser must support **SharedArrayBuffer** (required for multi-threaded WASM). The Vite dev server automatically sets the required COOP/COEP headers.
- Model files are loaded from your local filesystem — they are never uploaded to any server.

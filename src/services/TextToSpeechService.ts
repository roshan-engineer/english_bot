/**
 * TextToSpeechService
 *
 * Wraps the RunAnywhere ONNX TTS extension (Piper/VITS) for browser-local
 * text-to-speech synthesis and audio playback.
 */

import { RunAnywhere, SDKEnvironment } from '@runanywhere/web';
import { ONNX, TTS, SherpaONNXBridge } from '@runanywhere/web-onnx';

export interface TTSModelFiles {
  model: File;
  tokens: File;
}

export class TextToSpeechService {
  private loaded = false;
  private audioContext: AudioContext | null = null;

  async initialize(): Promise<void> {
    if (!RunAnywhere.isInitialized) {
      await RunAnywhere.initialize({ environment: SDKEnvironment.Development });
    }
    await ONNX.register();
  }

  async loadVoice(files: TTSModelFiles): Promise<void> {
    const bridge = SherpaONNXBridge.shared;
    await bridge.ensureLoaded();

    const modelBuffer = await files.model.arrayBuffer();
    const tokensBuffer = await files.tokens.arrayBuffer();

    bridge.writeFile('/models/tts/model.onnx', new Uint8Array(modelBuffer));
    bridge.writeFile('/models/tts/tokens.txt', new Uint8Array(tokensBuffer));

    await TTS.loadVoice({
      voiceId: 'piper-en',
      modelPath: '/models/tts/model.onnx',
      tokensPath: '/models/tts/tokens.txt',
      dataDir: '',
    });

    this.loaded = true;
  }

  async synthesize(text: string): Promise<void> {
    if (!this.loaded) {
      throw new Error('TTS voice not loaded. Call loadVoice() first.');
    }

    const result = await TTS.synthesize(text, { speed: 1.0 });
    await this.playAudio(result.audioData, result.sampleRate);
  }

  private async playAudio(samples: Float32Array, sampleRate: number): Promise<void> {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext({ sampleRate });
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const buffer = this.audioContext.createBuffer(1, samples.length, sampleRate);
    // copyToChannel requires Float32Array<ArrayBuffer>; cast to satisfy the constraint
    buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    await new Promise<void>((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  }

  get isLoaded(): boolean {
    return this.loaded;
  }
}

export const textToSpeechService = new TextToSpeechService();

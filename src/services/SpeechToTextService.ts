/**
 * SpeechToTextService
 *
 * Wraps the RunAnywhere ONNX STT extension (Whisper) for browser-local
 * speech-to-text transcription.
 */

import { RunAnywhere, SDKEnvironment } from '@runanywhere/web';
import { ONNX, STT, STTModelType, SherpaONNXBridge } from '@runanywhere/web-onnx';

export interface STTModelFiles {
  encoder: File;
  decoder: File;
  tokens: File;
}

export class SpeechToTextService {
  private loaded = false;

  async initialize(): Promise<void> {
    if (!RunAnywhere.isInitialized) {
      await RunAnywhere.initialize({ environment: SDKEnvironment.Development });
    }
    await ONNX.register();
  }

  async loadModel(files: STTModelFiles): Promise<void> {
    // Write model files to the sherpa-onnx virtual FS via the bridge
    const bridge = SherpaONNXBridge.shared;
    await bridge.ensureLoaded();

    const encoderBuffer = await files.encoder.arrayBuffer();
    const decoderBuffer = await files.decoder.arrayBuffer();
    const tokensBuffer = await files.tokens.arrayBuffer();

    bridge.writeFile('/models/stt/encoder.onnx', new Uint8Array(encoderBuffer));
    bridge.writeFile('/models/stt/decoder.onnx', new Uint8Array(decoderBuffer));
    bridge.writeFile('/models/stt/tokens.txt', new Uint8Array(tokensBuffer));

    await STT.loadModel({
      modelId: 'whisper-tiny-en',
      type: STTModelType.Whisper,
      modelFiles: {
        encoder: '/models/stt/encoder.onnx',
        decoder: '/models/stt/decoder.onnx',
        tokens: '/models/stt/tokens.txt',
      },
      sampleRate: 16000,
    });

    this.loaded = true;
  }

  async transcribe(audioData: Float32Array): Promise<string> {
    if (!this.loaded) {
      throw new Error('STT model not loaded. Call loadModel() first.');
    }
    const result = await STT.transcribe(audioData, { sampleRate: 16000 });
    return result.text.trim();
  }

  get isLoaded(): boolean {
    return this.loaded;
  }
}

export const speechToTextService = new SpeechToTextService();

import type { STTModelType } from '@runanywhere/web-onnx';

export interface STTModelFiles {
  encoder: File;
  decoder: File;
  tokens: File;
}

export interface SpeechToTextConfig {
  modelType?: STTModelType;
  sampleRate?: number;
  language?: string;
}

/**
 * SpeechToText service
 *
 * Wraps the RunAnywhere @runanywhere/web-onnx STT API.
 * Loads a Whisper model from user-supplied File objects (uploaded via the
 * model setup screen) and transcribes Float32Array PCM audio.
 */
export class SpeechToTextService {
  private loaded = false;

  /** Whether a model is currently loaded and ready to transcribe. */
  get isReady(): boolean {
    return this.loaded;
  }

  /**
   * Load a Whisper STT model from three file objects (encoder, decoder, tokens).
   * The files are written to the sherpa-onnx virtual filesystem before loading.
   */
  async loadModel(
    files: STTModelFiles,
    config: SpeechToTextConfig = {}
  ): Promise<void> {
    const { STT, STTModelType: ModelType, SherpaONNXBridge } = await import('@runanywhere/web-onnx');

    // Write model files to the sherpa-onnx virtual FS
    const encoderPath = '/models/stt/encoder.onnx';
    const decoderPath = '/models/stt/decoder.onnx';
    const tokensPath = '/models/stt/tokens.txt';

    const bridge = SherpaONNXBridge.shared;

    await this.writeFileToBridge(bridge, encoderPath, files.encoder);
    await this.writeFileToBridge(bridge, decoderPath, files.decoder);
    await this.writeFileToBridge(bridge, tokensPath, files.tokens);

    await STT.loadModel({
      modelId: 'whisper-tiny-en',
      type: config.modelType ?? ModelType.Whisper,
      modelFiles: {
        encoder: encoderPath,
        decoder: decoderPath,
        tokens: tokensPath,
      },
      sampleRate: config.sampleRate ?? 16000,
      language: config.language ?? 'en',
    });

    this.loaded = true;
  }

  /**
   * Transcribe a Float32Array of mono 16 kHz PCM audio.
   * Returns the recognized text.
   */
  async transcribe(audioSamples: Float32Array): Promise<string> {
    const { STT } = await import('@runanywhere/web-onnx');

    if (!STT.isModelLoaded) {
      throw new Error('STT model is not loaded.');
    }

    const result = await STT.transcribe(audioSamples);
    return result.text.trim();
  }

  /** Unload the STT model and free memory. */
  async unload(): Promise<void> {
    try {
      const { STT } = await import('@runanywhere/web-onnx');
      await STT.unloadModel();
    } catch {
      // Ignore
    }
    this.loaded = false;
  }

  /** Write a browser File object to the sherpa-onnx virtual filesystem. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async writeFileToBridge(bridge: any, path: string, file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    bridge.writeFile(path, new Uint8Array(buffer));
  }
}

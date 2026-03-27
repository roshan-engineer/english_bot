export interface TTSModelFiles {
  model: File;
  tokens: File;
  espeakData?: File; // Optional: espeak-ng-data archive (.tar.gz)
}

export interface TextToSpeechResult {
  audioData: Float32Array;
  sampleRate: number;
}

/**
 * TextToSpeech service
 *
 * Wraps the RunAnywhere @runanywhere/web-onnx TTS API.
 * Loads a Piper/VITS voice from user-supplied File objects and synthesises speech.
 * After synthesis it plays back the audio via the Web Audio API.
 */
export class TextToSpeechService {
  private loaded = false;
  private audioContext: AudioContext | null = null;

  /** Whether a voice is loaded and ready to synthesise. */
  get isReady(): boolean {
    return this.loaded;
  }

  /**
   * Load a Piper TTS voice from file objects.
   * The model and tokens files are written to the sherpa-onnx virtual FS.
   */
  async loadVoice(files: TTSModelFiles): Promise<void> {
    const { TTS, SherpaONNXBridge } = await import('@runanywhere/web-onnx');

    const bridge = SherpaONNXBridge.shared;

    const modelPath = '/models/tts/model.onnx';
    const tokensPath = '/models/tts/tokens.txt';
    let dataDir: string | undefined;

    await this.writeFileToBridge(bridge, modelPath, files.model);
    await this.writeFileToBridge(bridge, tokensPath, files.tokens);

    if (files.espeakData) {
      dataDir = '/models/tts/espeak-ng-data';
      await this.extractTarGzToBridge(bridge, dataDir, files.espeakData);
    }

    await TTS.loadVoice({
      voiceId: 'piper-en',
      modelPath,
      tokensPath,
      ...(dataDir ? { dataDir } : {}),
    });

    this.loaded = true;
  }

  /**
   * Synthesise text and return the PCM audio data.
   */
  async synthesize(text: string): Promise<TextToSpeechResult> {
    const { TTS } = await import('@runanywhere/web-onnx');

    if (!TTS.isVoiceLoaded) {
      throw new Error('TTS voice is not loaded.');
    }

    const result = await TTS.synthesize(text);
    return {
      audioData: result.audioData,
      sampleRate: result.sampleRate,
    };
  }

  /**
   * Synthesise text and play it back using the Web Audio API.
   * Returns a Promise that resolves when playback finishes.
   */
  async speak(text: string): Promise<void> {
    const { audioData, sampleRate } = await this.synthesize(text);

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Ensure audio context is running (browsers suspend it until a user gesture)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const buffer = this.audioContext.createBuffer(1, audioData.length, sampleRate);
    buffer.copyToChannel(audioData as unknown as Float32Array<ArrayBuffer>, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    return new Promise((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  }

  /** Unload the voice and free memory. */
  async unload(): Promise<void> {
    try {
      const { TTS } = await import('@runanywhere/web-onnx');
      await TTS.unloadVoice();
    } catch {
      // Ignore
    }
    this.loaded = false;
  }

  /** Write a browser File to the sherpa-onnx virtual filesystem. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async writeFileToBridge(bridge: any, path: string, file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    bridge.writeFile(path, new Uint8Array(buffer));
  }

  private async extractTarGzToBridge(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bridge: any,
    targetDir: string,
    file: File
  ): Promise<void> {
    const { extractTarGz } = await import('@runanywhere/web');
    const buffer = await file.arrayBuffer();
    const entries = await extractTarGz(new Uint8Array(buffer));
    for (const entry of entries) {
      if (entry.data) {
        const fullPath = `${targetDir}/${entry.path}`;
        bridge.writeFile(fullPath, entry.data);
      }
    }
  }
}

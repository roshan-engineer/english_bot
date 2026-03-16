/**
 * AudioRecorder
 *
 * Captures microphone audio using the Web MediaDevices API and Web Audio API.
 * Records PCM Float32 samples at 16 kHz (required by Whisper STT).
 */

const TARGET_SAMPLE_RATE = 16000;

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private samples: Float32Array[] = [];
  private isRecording = false;

  async start(): Promise<void> {
    if (this.isRecording) return;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: TARGET_SAMPLE_RATE,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // Use a sample rate that the browser supports and resample afterwards
    this.audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    // ScriptProcessor with 4096-sample buffer for low-latency capture
    const bufferSize = 4096;
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.samples = [];
    this.processorNode.onaudioprocess = (event) => {
      const channelData = event.inputBuffer.getChannelData(0);
      this.samples.push(new Float32Array(channelData));
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
    this.isRecording = true;
  }

  stop(): Float32Array {
    if (!this.isRecording) return new Float32Array(0);

    this.isRecording = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Concatenate all chunks into a single Float32Array
    const totalLength = this.samples.reduce((acc, s) => acc + s.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.samples) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    this.samples = [];
    return result;
  }

  get recording(): boolean {
    return this.isRecording;
  }
}

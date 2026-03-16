import React, { useCallback, useRef, useState } from 'react';

interface AudioRecorderProps {
  /** Called when recording starts */
  onStart?: () => void;
  /** Called with the 16 kHz mono PCM samples when recording stops */
  onStop: (samples: Float32Array) => void;
  /** Whether the recorder button is currently active */
  isRecording: boolean;
  /** Whether the recorder can be started */
  disabled?: boolean;
}

const TARGET_SAMPLE_RATE = 16000; // Hz — required by Whisper

/**
 * AudioRecorder component
 *
 * Uses the browser MediaDevices API to capture microphone audio, resamples it
 * to 16 kHz mono via the Web Audio API, and returns a Float32Array of PCM
 * samples for the STT service.
 */
const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onStart,
  onStop,
  isRecording,
  disabled = false,
}) => {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const samplesRef = useRef<Float32Array[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      setPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;

      // Create audio context — force 16 kHz or resample to it
      const ctx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      // ScriptProcessorNode is deprecated but universally supported;
      // AudioWorklet support can be added later.
      const bufferSize = 4096;
      const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
      scriptProcessorRef.current = processor;
      samplesRef.current = [];

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        samplesRef.current.push(new Float32Array(channelData));
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      onStart?.();
    } catch (err) {
      console.error('Microphone access error:', err);
      setPermissionDenied(true);
    }
  }, [onStart]);

  const stopRecording = useCallback(() => {
    // Disconnect audio graph
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    // Concatenate all chunks
    const chunks = samplesRef.current;
    samplesRef.current = [];
    if (chunks.length === 0) return;

    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    onStop(merged);
  }, [onStop]);

  const handleToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className="audio-recorder">
      <button
        className={`record-btn ${isRecording ? 'recording' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        title={isRecording ? 'Click to stop' : 'Click to speak'}
      >
        <span className="record-icon">{isRecording ? '⏹' : '🎙'}</span>
        <span className="record-label">
          {isRecording ? 'Stop Speaking' : 'Start Speaking'}
        </span>
        {isRecording && <span className="recording-pulse" aria-hidden="true" />}
      </button>
      {permissionDenied && (
        <p className="error-msg">
          ⚠️ Microphone access was denied. Please allow microphone access in your browser settings.
        </p>
      )}
    </div>
  );
};

export default AudioRecorder;

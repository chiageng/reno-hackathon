"use client";

import React, { useRef, useState } from 'react';
import { Button } from 'antd';
import { AudioOutlined, LoadingOutlined } from '@ant-design/icons';
import { useMessage } from '@/utils/common';

interface VoiceButtonProps {
  disabled?: boolean;
  /** Called once a non-empty transcript comes back from /api/transcribe */
  onTranscript: (text: string) => void;
}

function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  // iOS Safari produces audio/mp4 — Whisper accepts both.
  if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus';
  }
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  return 'audio/webm';
}

export default function VoiceButton({ disabled, onTranscript }: VoiceButtonProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingMimeRef = useRef<string>('audio/webm');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { displayErrorMessage, displayWarningMessage } = useMessage();

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const sendForTranscription = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const formData = new FormData();
      formData.append('audio', blob, `audio.${ext}`);
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Transcription failed');
      }
      const result = (await res.json()) as { text: string };
      const text = result.text?.trim();
      if (!text) {
        displayWarningMessage("Couldn't hear anything — try again");
        return;
      }
      onTranscript(text);
    } catch (err) {
      displayErrorMessage(err, 'Could not transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (disabled || isRecording || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickRecorderMimeType();
      recordingMimeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        if (blob.size === 0) return;
        void sendForTranscription(blob, mimeType);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      stopStream();
      displayErrorMessage(err, 'Microphone access blocked');
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    try {
      recorderRef.current?.stop();
    } catch {
      // ignore
    }
    setIsRecording(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (disabled || isTranscribing) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    void startRecording();
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    stopRecording();
  };

  const inactive = disabled || isTranscribing;

  return (
    <Button
      type={isRecording ? 'primary' : 'default'}
      shape="circle"
      size="large"
      danger={isRecording}
      disabled={inactive}
      icon={isTranscribing ? <LoadingOutlined /> : <AudioOutlined />}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={(e) => {
        // If user drags off the button while pressed, treat as release.
        if (isRecording) handlePointerEnd(e);
      }}
      style={{
        flexShrink: 0,
        touchAction: 'none',
        userSelect: 'none',
        boxShadow: isRecording
          ? '0 0 0 4px rgba(199, 89, 80, 0.25)'
          : undefined,
        transition: 'box-shadow 150ms ease',
      }}
      aria-label={
        isTranscribing
          ? 'Transcribing'
          : isRecording
            ? 'Recording — release to send'
            : 'Hold to record'
      }
    />
  );
}

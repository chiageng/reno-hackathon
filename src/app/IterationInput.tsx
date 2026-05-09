"use client";

import React, { useState } from 'react';
import { Button, Input } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import VoiceButton from './VoiceButton';

interface IterationInputProps {
  isLoading?: boolean;
  disabled?: boolean;
  onSubmit: (text: string) => void;
  placeholder?: string;
}

export default function IterationInput({
  isLoading = false,
  disabled = false,
  onSubmit,
  placeholder = 'Make the sofa green and add a tall plant…',
}: IterationInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || disabled) return;
    onSubmit(trimmed);
    setText('');
  };

  // Voice transcripts auto-submit. The transcript shows up immediately in the
  // page-level "Edits applied" chip log so the user sees what was heard.
  const handleVoiceTranscript = (transcript: string) => {
    if (isLoading || disabled) return;
    onSubmit(transcript);
    setText('');
  };

  const inactive = disabled || isLoading;

  return (
    <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
      <VoiceButton disabled={inactive} onTranscript={handleVoiceTranscript} />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPressEnter={handleSubmit}
        placeholder={placeholder}
        disabled={inactive}
        maxLength={500}
        size="large"
        style={{ flex: 1 }}
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSubmit}
        loading={isLoading}
        disabled={inactive || !text.trim()}
        size="large"
      >
        Send
      </Button>
    </div>
  );
}

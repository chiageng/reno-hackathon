"use client";

import React, { useState } from 'react';
import { Button, Input, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';

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

  const inactive = disabled || isLoading;

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPressEnter={handleSubmit}
        placeholder={placeholder}
        disabled={inactive}
        maxLength={500}
        size="large"
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
    </Space.Compact>
  );
}

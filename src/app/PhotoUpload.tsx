"use client";

import React, { useRef, useState } from 'react';
import { Button } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { useMessage } from '@/utils/common';

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

interface PhotoUploadProps {
  onPhoto: (dataUrl: string) => void;
  isBusy?: boolean;
}

async function fileToResizedDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not decode image (HEIC files may not work — try JPEG/PNG)'));
      i.src = objectUrl;
    });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported in this browser');

    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function PhotoUpload({ onPhoto, isBusy }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isReading, setIsReading] = useState(false);
  const { displayErrorMessage } = useMessage();

  const handlePick = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      onPhoto(dataUrl);
    } catch (error) {
      displayErrorMessage(error, 'Could not read that photo');
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const disabled = isReading || isBusy;
  const label = isReading ? 'Reading photo…' : isBusy ? 'Working…' : 'Take a photo';

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <Button
        type="primary"
        size="large"
        icon={<CameraOutlined />}
        onClick={handlePick}
        disabled={disabled}
        loading={isReading}
        block
      >
        {label}
      </Button>
    </>
  );
}

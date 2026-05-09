"use client";

import React, { useState } from 'react';
import { Button, Card, Skeleton, Space } from 'antd';
import { useMutation } from '@tanstack/react-query';
import SectionContainer from '@/components/SectionContainer';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';
import { useMessage } from '@/utils/common';
import PhotoUpload from './PhotoUpload';
import AnalysisPanel from './AnalysisPanel';
import type { RoomAnalysis } from '@/lib/openai';

export default function Home() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const { displayErrorMessage } = useMessage();

  const {
    mutate: analyze,
    data: analysis,
    isPending,
    reset: resetMutation,
  } = useMutation({
    mutationFn: async (dataUrl: string): Promise<RoomAnalysis> => {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Analyze failed');
      }
      return res.json() as Promise<RoomAnalysis>;
    },
    onError: (error) => displayErrorMessage(error, 'Could not analyze the photo'),
  });

  const handlePhoto = (dataUrl: string) => {
    setImageDataUrl(dataUrl);
    analyze(dataUrl);
  };

  const handleReset = () => {
    setImageDataUrl(null);
    resetMutation();
  };

  return (
    <SectionContainer maxWidth="640px">
      <div style={{ padding: '32px 20px 64px' }}>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <HText variant="h2" style={{ color: colorConfig.textPrimary, margin: 0 }}>
              Reimagine any room
            </HText>
            <PText variant="normal" style={{ color: colorConfig.textSecondary }}>
              Take one photo. We&rsquo;ll show you three new ways to see your space.
            </PText>
          </div>

          {!imageDataUrl ? (
            <PhotoUpload onPhoto={handlePhoto} />
          ) : (
            <Card styles={{ body: { padding: 0 } }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt="Your room"
                style={{ width: '100%', display: 'block', borderRadius: 8 }}
              />
            </Card>
          )}

          {isPending && (
            <Card>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <PText variant="small" style={{ color: colorConfig.textSecondary }}>
                  Looking at your room…
                </PText>
                <Skeleton active paragraph={{ rows: 3 }} />
              </Space>
            </Card>
          )}

          {analysis && <AnalysisPanel analysis={analysis} />}

          {imageDataUrl && !isPending && (
            <div style={{ textAlign: 'center' }}>
              <Button type="link" onClick={handleReset}>
                ← Start over
              </Button>
            </div>
          )}
        </Space>
      </div>
    </SectionContainer>
  );
}

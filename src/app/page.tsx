"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Skeleton, Space } from 'antd';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import SectionContainer from '@/components/SectionContainer';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';
import { useMessage } from '@/utils/common';
import PhotoUpload from './PhotoUpload';
import AnalysisPanel from './AnalysisPanel';
import StyleGrid, { type StyleResult } from './StyleGrid';
import RedesignView, { type RedesignItem } from './RedesignView';
import type { RoomAnalysis } from '@/lib/openai';
import { STYLE_KEYS, type StyleKey } from '@/lib/styles';

interface StyleApiResponse {
  style: StyleKey;
  imageDataUrl: string;
}

interface NarrateApiResponse {
  audioDataUrl: string;
}

// 36-byte silent WAV used to capture the iOS gesture for later autoplay.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export default function Home() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<StyleKey | null>(null);
  const [isNarrationPlaying, setIsNarrationPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const { displayErrorMessage } = useMessage();

  const {
    mutate: analyze,
    data: analysis,
    isPending: isAnalyzing,
    reset: resetAnalysis,
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

  // Three parallel image-gen calls — each tile reveals as it lands.
  const styleQueries = useQueries({
    queries: STYLE_KEYS.map((style) => ({
      queryKey: ['style', style, sessionKey],
      enabled: !!imageDataUrl && !!analysis && !!sessionKey,
      staleTime: Infinity,
      retry: 1,
      queryFn: async (): Promise<StyleApiResponse> => {
        const res = await fetch('/api/generate-style', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUrl, analysis, style }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? 'Style generation failed');
        }
        return res.json() as Promise<StyleApiResponse>;
      },
    })),
  });

  // Voice narration — fires once analysis arrives.
  const narrationQuery = useQuery({
    queryKey: ['narration', sessionKey],
    enabled: !!analysis && !!sessionKey,
    staleTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<NarrateApiResponse> => {
      if (!analysis) throw new Error('no analysis');
      const res = await fetch('/api/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: analysis.narrationText }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Narration failed');
      }
      return res.json() as Promise<NarrateApiResponse>;
    },
  });

  const narrationUrl = narrationQuery.data?.audioDataUrl ?? null;

  const styleResults: StyleResult[] = STYLE_KEYS.map((style, i) => {
    const q = styleQueries[i];
    return {
      style,
      imageDataUrl: q.data?.imageDataUrl ?? null,
      isLoading: q.isFetching,
      error: q.error ? (q.error as Error).message : null,
    };
  });

  // Autoplay narration when it lands. Already-unlocked audio (see unlockAudio
  // below) lets iOS Safari honour this even though we're outside the original
  // gesture window.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !narrationUrl) return;
    a.src = narrationUrl;
    a.play().catch((err) => {
      console.warn('[reno] narration autoplay blocked', err);
    });
  }, [narrationUrl]);

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    const a = audioRef.current;
    if (!a) return;
    // Captured during a real user gesture so iOS allows future play() calls.
    a.src = SILENT_WAV;
    a.muted = true;
    a.play()
      .then(() => {
        a.pause();
        a.muted = false;
        audioUnlockedRef.current = true;
      })
      .catch(() => {
        // Manual play button is the fallback.
      });
  };

  const toggleNarration = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch((err) => displayErrorMessage(err, 'Could not play narration'));
    } else {
      a.pause();
    }
  };

  const handlePhoto = (dataUrl: string) => {
    unlockAudio();
    setImageDataUrl(dataUrl);
    setSessionKey(crypto.randomUUID());
    analyze(dataUrl);
  };

  const handleReset = () => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute('src');
      a.load();
    }
    setImageDataUrl(null);
    setSessionKey('');
    setSelectedStyle(null);
    setIsNarrationPlaying(false);
    resetAnalysis();
  };

  const completedItems: RedesignItem[] = styleResults
    .filter((r): r is StyleResult & { imageDataUrl: string } => !!r.imageDataUrl)
    .map((r) => ({ style: r.style, afterImage: r.imageDataUrl }));

  const showRedesignView =
    !!selectedStyle &&
    !!imageDataUrl &&
    completedItems.some((it) => it.style === selectedStyle);

  return (
    <SectionContainer maxWidth="960px">
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

          {isAnalyzing && (
            <Card>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <PText variant="small" style={{ color: colorConfig.textSecondary }}>
                  Looking at your room…
                </PText>
                <Skeleton active paragraph={{ rows: 3 }} />
              </Space>
            </Card>
          )}

          {analysis && (
            <AnalysisPanel
              analysis={analysis}
              isNarrationLoading={narrationQuery.isFetching}
              isNarrationPlaying={isNarrationPlaying}
              hasNarration={!!narrationUrl}
              onToggleNarration={toggleNarration}
            />
          )}

          {analysis && imageDataUrl && (
            <StyleGrid results={styleResults} onSelect={setSelectedStyle} />
          )}

          {imageDataUrl && !isAnalyzing && (
            <div style={{ textAlign: 'center' }}>
              <Button type="link" onClick={handleReset}>
                ← Start over
              </Button>
            </div>
          )}
        </Space>
      </div>

      <audio
        ref={audioRef}
        onPlay={() => setIsNarrationPlaying(true)}
        onPause={() => setIsNarrationPlaying(false)}
        onEnded={() => setIsNarrationPlaying(false)}
        preload="auto"
        hidden
      />

      {showRedesignView && imageDataUrl && selectedStyle && (
        <RedesignView
          items={completedItems}
          initialStyle={selectedStyle}
          beforeImage={imageDataUrl}
          onBack={() => setSelectedStyle(null)}
        />
      )}
    </SectionContainer>
  );
}

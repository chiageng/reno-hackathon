"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
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

interface DescribeStylesResponse {
  items: { style: StyleKey; description: string; audioDataUrl: string }[];
}

// 36-byte silent WAV used to capture the iOS gesture for later autoplay.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export default function Home() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<StyleKey | null>(null);

  // Shared audio state — used by both AnalysisPanel and RedesignView.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const [playingAudioSrc, setPlayingAudioSrc] = useState<string | null>(null);

  const { displayErrorMessage } = useMessage();

  const playAudio = useCallback((src: string) => {
    const a = audioRef.current;
    if (!a) return;
    if (a.src !== src) {
      a.src = src;
    } else if (a.ended) {
      // Same clip finished; reset for a clean replay.
      a.currentTime = 0;
    }
    a.play().catch((err) => {
      console.warn('[reno] audio play blocked', err);
    });
  }, []);

  const pauseAudio = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    const a = audioRef.current;
    if (!a) return;
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
  }, []);

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

  // Voice narration of the analysis — fires once analysis arrives.
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

  // Per-design designer commentary + per-design audio narration.
  const descriptionsQuery = useQuery({
    queryKey: ['descriptions', sessionKey],
    enabled: !!analysis && !!sessionKey,
    staleTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<DescribeStylesResponse> => {
      const res = await fetch('/api/describe-styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Description failed');
      }
      return res.json() as Promise<DescribeStylesResponse>;
    },
  });

  const narrationUrl = narrationQuery.data?.audioDataUrl ?? null;
  const descriptionsByStyle: Partial<
    Record<StyleKey, { description: string; audioDataUrl: string }>
  > = {};
  descriptionsQuery.data?.items.forEach((item) => {
    descriptionsByStyle[item.style] = {
      description: item.description,
      audioDataUrl: item.audioDataUrl,
    };
  });

  const styleResults: StyleResult[] = STYLE_KEYS.map((style, i) => {
    const q = styleQueries[i];
    return {
      style,
      imageDataUrl: q.data?.imageDataUrl ?? null,
      isLoading: q.isFetching,
      error: q.error ? (q.error as Error).message : null,
    };
  });

  // Auto-play the analysis narration once it lands (only if no other audio
  // is currently playing — so swiping between styles doesn't get hijacked).
  useEffect(() => {
    if (!narrationUrl) return;
    if (playingAudioSrc) return; // something else is already playing
    playAudio(narrationUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrationUrl]);

  const handleAnalysisToggle = () => {
    if (!narrationUrl) return;
    if (playingAudioSrc === narrationUrl) {
      pauseAudio();
    } else {
      playAudio(narrationUrl);
    }
  };

  const handlePhoto = (dataUrl: string) => {
    unlockAudio();
    setImageDataUrl(dataUrl);
    setSessionKey(crypto.randomUUID());
    analyze(dataUrl);
  };

  const handleCloseRedesign = useCallback(() => {
    pauseAudio();
    setSelectedStyle(null);
  }, [pauseAudio]);

  const handleReset = () => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute('src');
      a.load();
    }
    setPlayingAudioSrc(null);
    setImageDataUrl(null);
    setSessionKey('');
    setSelectedStyle(null);
    resetAnalysis();
  };

  const completedItems: RedesignItem[] = styleResults
    .filter((r): r is StyleResult & { imageDataUrl: string } => !!r.imageDataUrl)
    .map((r) => ({
      style: r.style,
      afterImage: r.imageDataUrl,
      description: descriptionsByStyle[r.style]?.description,
      audioDataUrl: descriptionsByStyle[r.style]?.audioDataUrl,
    }));

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
              isNarrationPlaying={
                !!narrationUrl && playingAudioSrc === narrationUrl
              }
              hasNarration={!!narrationUrl}
              onToggleNarration={handleAnalysisToggle}
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
        onPlay={() => setPlayingAudioSrc(audioRef.current?.src ?? null)}
        onPause={() => setPlayingAudioSrc(null)}
        onEnded={() => setPlayingAudioSrc(null)}
        preload="auto"
        hidden
      />

      {showRedesignView && imageDataUrl && selectedStyle && (
        <RedesignView
          items={completedItems}
          initialStyle={selectedStyle}
          beforeImage={imageDataUrl}
          onBack={handleCloseRedesign}
          onPlayAudio={playAudio}
          onPauseAudio={pauseAudio}
          playingAudioSrc={playingAudioSrc}
          isLoadingDescriptions={descriptionsQuery.isFetching}
        />
      )}
    </SectionContainer>
  );
}

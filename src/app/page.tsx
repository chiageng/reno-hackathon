"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Skeleton, Space, Tag } from 'antd';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import SectionContainer from '@/components/SectionContainer';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';
import { useMessage } from '@/utils/common';
import PhotoUpload from './PhotoUpload';
import AnalysisPanel from './AnalysisPanel';
import StyleGrid, { type StyleResult } from './StyleGrid';
import RedesignView, { type RedesignItem } from './RedesignView';
import IterationInput from './IterationInput';
import type { RoomAnalysis } from '@/lib/openai';
import { STYLE_KEYS, STYLE_LABELS, type StyleKey } from '@/lib/styles';

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

interface IterateApiResponse {
  imageDataUrl: string;
}

// 36-byte silent WAV used to capture the iOS gesture for later autoplay.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export default function Home() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<StyleKey | null>(null);
  // Latest iterated version per style (overrides original gpt-image-1 generation
  // when present). New edits stack on whatever is current here.
  const [iteratedImages, setIteratedImages] = useState<
    Partial<Record<StyleKey, string>>
  >({});
  // Set of styles currently mid-edit. While non-empty, the input is disabled
  // and each affected tile shows an "Updating…" overlay.
  const [iteratingStyles, setIteratingStyles] = useState<Set<StyleKey>>(
    new Set(),
  );
  // Chronological log of every prompt the user has submitted this session —
  // simple text record, no navigation. Cleared on Start over.
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

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

  // Fire 3 parallel /api/iterate calls — one per completed style. Each tile
  // updates as its call lands. allSettled so a single failure doesn't kill
  // the others.
  const iterateAcrossStyles = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (iteratingStyles.size > 0) return;

    const eligible = STYLE_KEYS.filter(
      (style) => !!styleQueries[STYLE_KEYS.indexOf(style)]?.data?.imageDataUrl,
    );
    if (eligible.length === 0) return;

    setPromptHistory((prev) => [...prev, trimmed]);
    setIteratingStyles(new Set(eligible));

    await Promise.allSettled(
      eligible.map(async (style) => {
        const baseImage =
          iteratedImages[style] ??
          styleQueries[STYLE_KEYS.indexOf(style)].data?.imageDataUrl;
        if (!baseImage) return;

        try {
          const res = await fetch('/api/iterate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageDataUrl: baseImage,
              editInstruction: trimmed,
            }),
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(data.error ?? 'Edit failed');
          }
          const result = (await res.json()) as IterateApiResponse;
          setIteratedImages((prev) => ({
            ...prev,
            [style]: result.imageDataUrl,
          }));
        } catch (err) {
          console.error(`[iterate ${style}]`, err);
          displayErrorMessage(err, `Could not edit ${STYLE_LABELS[style]}`);
        } finally {
          setIteratingStyles((prev) => {
            const next = new Set(prev);
            next.delete(style);
            return next;
          });
        }
      }),
    );
  };

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
      imageDataUrl: iteratedImages[style] ?? q.data?.imageDataUrl ?? null,
      isLoading: q.isFetching,
      isIterating: iteratingStyles.has(style),
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
    setIteratedImages({});
    setIteratingStyles(new Set());
    setPromptHistory([]);
    resetAnalysis();
  };

  const completedItems: RedesignItem[] = styleResults
    .filter((r): r is StyleResult & { imageDataUrl: string } => !!r.imageDataUrl)
    .map((r) => ({
      style: r.style,
      afterImage: r.imageDataUrl,
      description: descriptionsByStyle[r.style]?.description,
      audioDataUrl: descriptionsByStyle[r.style]?.audioDataUrl,
      isIterating: r.isIterating,
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

          {analysis &&
            imageDataUrl &&
            styleResults.some((r) => r.imageDataUrl) && (
              <Card styles={{ body: { padding: 16 } }}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <PText
                    variant="small"
                    style={{ color: colorConfig.textSecondary, margin: 0 }}
                  >
                    Tweak all three designs at once. e.g.{' '}
                    <em>&ldquo;make the sofa green and add a tall plant&rdquo;</em>
                  </PText>
                  <IterationInput
                    isLoading={iteratingStyles.size > 0}
                    disabled={iteratingStyles.size > 0}
                    onSubmit={iterateAcrossStyles}
                  />
                  {promptHistory.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        alignItems: 'center',
                      }}
                    >
                      <PText
                        variant="small"
                        style={{
                          color: colorConfig.textMuted,
                          margin: 0,
                          marginRight: 4,
                        }}
                      >
                        Edits applied:
                      </PText>
                      {promptHistory.map((p, i) => (
                        <Tag
                          key={`${i}-${p}`}
                          style={{
                            borderRadius: 999,
                            padding: '2px 10px',
                            margin: 0,
                            background: colorConfig.secondaryColor,
                            borderColor: colorConfig.borderColor,
                            color: colorConfig.textPrimary,
                          }}
                        >
                          {i + 1}. {p}
                        </Tag>
                      ))}
                    </div>
                  )}
                </Space>
              </Card>
            )}

          {imageDataUrl && !isAnalyzing && (
            <div style={{ textAlign: 'center' }}>
              <Button
                type="link"
                onClick={handleReset}
                disabled={iteratingStyles.size > 0}
              >
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

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  LeftOutlined,
  PauseOutlined,
  RightOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';
import ComparisonSlider from './ComparisonSlider';
import WalkthroughPlayer from './WalkthroughPlayer';
import { STYLE_LABELS, STYLE_TAGLINES, type StyleKey } from '@/lib/styles';

export interface RedesignItem {
  style: StyleKey;
  afterImage: string;
  description?: string;
  audioDataUrl?: string;
  isIterating?: boolean;
}

interface RedesignViewProps {
  items: RedesignItem[];
  initialStyle: StyleKey;
  beforeImage: string;
  onBack: () => void;
  /** Centralized audio handlers — see page.tsx for the shared <audio> element */
  onPlayAudio: (audioDataUrl: string) => void;
  onPauseAudio: () => void;
  /** Source of the audio that's currently playing, or null if paused/stopped */
  playingAudioSrc: string | null;
  isLoadingDescriptions?: boolean;
  /** Per-style walkthrough cache and setter, owned by page.tsx */
  walkthroughCache: Partial<Record<StyleKey, string>>;
  onCacheWalkthrough: (style: StyleKey, videoUrl: string) => void;
}

export default function RedesignView({
  items,
  initialStyle,
  beforeImage,
  onBack,
  onPlayAudio,
  onPauseAudio,
  playingAudioSrc,
  isLoadingDescriptions,
  walkthroughCache,
  onCacheWalkthrough,
}: RedesignViewProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const initialIndex = Math.max(
    0,
    items.findIndex((it) => it.style === initialStyle),
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Lock body scroll while open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Jump scroller to the initially selected style on mount.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: initialIndex * el.clientWidth, behavior: 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = items[activeIndex];
  const activeAudio = active?.audioDataUrl;

  // Track which styles have been narrated during this view session — auto-play
  // each style once on first encounter, stay silent on revisits.
  const playedStylesRef = useRef<Set<StyleKey>>(new Set());
  const lastStyleRef = useRef<StyleKey | null>(null);

  useEffect(() => {
    if (!active) return;

    const styleChanged = lastStyleRef.current !== active.style;
    lastStyleRef.current = active.style;

    if (styleChanged) {
      onPauseAudio();
    }

    if (!active.audioDataUrl) return;
    if (playedStylesRef.current.has(active.style)) return;
    playedStylesRef.current.add(active.style);
    onPlayAudio(active.audioDataUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.style, active?.audioDataUrl]);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const scrollToIndex = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  };

  const hasMany = items.length > 1;
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;
  const isThisAudioPlaying = !!activeAudio && playingAudioSrc === activeAudio;

  const handleToggleAudio = () => {
    if (!activeAudio || !active) return;
    if (isThisAudioPlaying) {
      onPauseAudio();
    } else {
      playedStylesRef.current.add(active.style);
      onPlayAudio(activeAudio);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: colorConfig.backgroundColor,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${colorConfig.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: colorConfig.backgroundColor,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          aria-label="Back"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <HText variant="h5" style={{ margin: 0 }}>
            {active ? STYLE_LABELS[active.style] : ''}
          </HText>
          <PText
            variant="small"
            style={{ color: colorConfig.textSecondary, margin: 0 }}
          >
            {active ? STYLE_TAGLINES[active.style] : ''}
          </PText>
        </div>
        {hasMany && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              type="text"
              size="small"
              icon={<LeftOutlined />}
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={!canPrev}
              aria-label="Previous design"
            />
            <div style={{ display: 'flex', gap: 6 }}>
              {items.map((it, i) => (
                <button
                  key={it.style}
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Go to design ${i + 1}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background:
                      i === activeIndex
                        ? colorConfig.brandAccent
                        : colorConfig.borderColor,
                    transition: 'background 150ms ease',
                  }}
                />
              ))}
            </div>
            <Button
              type="text"
              size="small"
              icon={<RightOutlined />}
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={!canNext}
              aria-label="Next design"
            />
          </div>
        )}
      </div>

      {/* Horizontal scroll-snap pager */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          background: colorConfig.backgroundSecondary,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((item) => (
          <div
            key={item.style}
            style={{
              flex: '0 0 100%',
              width: '100%',
              height: '100%',
              scrollSnapAlign: 'center',
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <ComparisonSlider
              beforeImage={beforeImage}
              afterImage={item.afterImage}
            />
            {item.isIterating && (
              <div
                style={{
                  position: 'absolute',
                  inset: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(45, 41, 42, 0.7)',
                  color: 'white',
                  gap: 12,
                  borderRadius: 12,
                  zIndex: 5,
                  pointerEvents: 'none',
                }}
              >
                <Spin size="large" />
                <PText
                  variant="normal"
                  style={{ color: 'white', margin: 0, fontWeight: 600 }}
                >
                  Updating this design…
                </PText>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Walkthrough action + designer commentary + audio toggle */}
      <div
        style={{
          padding: '12px 16px 14px',
          borderTop: `1px solid ${colorConfig.borderColor}`,
          background: colorConfig.backgroundColor,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Cinematic walkthrough hidden — Veo 3 model unavailable. Plumbing kept for re-enable. */}
        {false && active && (
          <div style={{ display: 'flex' }}>
            <WalkthroughPlayer
              style={active.style}
              imageDataUrl={active.afterImage}
              cachedVideoUrl={walkthroughCache[active.style]}
              onCached={onCacheWalkthrough}
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Button
            type="primary"
            shape="circle"
            size="small"
            icon={isThisAudioPlaying ? <PauseOutlined /> : <SoundOutlined />}
            onClick={handleToggleAudio}
            disabled={!activeAudio}
            loading={!activeAudio && isLoadingDescriptions}
            aria-label={isThisAudioPlaying ? 'Pause narration' : 'Play narration'}
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <PText
            variant="small"
            style={{
              margin: 0,
              flex: 1,
              color: colorConfig.textPrimary,
              lineHeight: 1.5,
            }}
          >
            {active?.description ??
              (isLoadingDescriptions
                ? 'Loading designer commentary…'
                : 'No commentary yet — drag the handle to compare before / after.')}
          </PText>
        </div>
      </div>
    </div>
  );
}

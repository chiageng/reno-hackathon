"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
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
import { STYLE_LABELS, STYLE_TAGLINES, type StyleKey } from '@/lib/styles';

export interface RedesignItem {
  style: StyleKey;
  afterImage: string;
  description?: string;
  audioDataUrl?: string;
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

  // Track which styles have been narrated (auto OR manual) during this view
  // session. We auto-play each style once on first encounter, then stay silent
  // on revisits. The manual button is the replay path.
  const playedStylesRef = useRef<Set<StyleKey>>(new Set());
  // Tracks the previously-handled active style across renders. Lets us
  // distinguish a real swipe from a Strict-Mode re-run of this effect, so we
  // don't pause audio that was just started on the same render cycle.
  const lastStyleRef = useRef<StyleKey | null>(null);

  // On real style changes: pause prior audio. On every active-style render
  // where audio is available and the style hasn't been played yet: auto-play.
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

  // Pause-on-close is handled by the parent's onBack handler — keeping it out
  // of an unmount-cleanup effect avoids React Strict Mode (dev) double-running
  // it and killing the first auto-play.

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
      // Mark as played so the auto-play effect won't re-fire on swipe-away/back.
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
            }}
          >
            <ComparisonSlider
              beforeImage={beforeImage}
              afterImage={item.afterImage}
            />
          </div>
        ))}
      </div>

      {/* Designer commentary + audio toggle */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: `1px solid ${colorConfig.borderColor}`,
          background: colorConfig.backgroundColor,
        }}
      >
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

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';
import ComparisonSlider from './ComparisonSlider';
import { STYLE_LABELS, STYLE_TAGLINES, type StyleKey } from '@/lib/styles';

export interface RedesignItem {
  style: StyleKey;
  afterImage: string;
}

interface RedesignViewProps {
  items: RedesignItem[];
  initialStyle: StyleKey;
  beforeImage: string;
  onBack: () => void;
}

export default function RedesignView({
  items,
  initialStyle,
  beforeImage,
  onBack,
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
    // We only want this once — initialIndex is captured at first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const active = items[activeIndex];
  const hasMany = items.length > 1;
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;

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

      {/* Horizontal scroll-snap pager — one panel per design */}
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

      {/* Footer hint */}
      <div
        style={{
          padding: '10px 16px',
          textAlign: 'center',
          borderTop: `1px solid ${colorConfig.borderColor}`,
        }}
      >
        <PText
          variant="small"
          style={{ color: colorConfig.textMuted, margin: 0 }}
        >
          {hasMany
            ? 'Drag the handle to compare · swipe or use ‹ › for the next style'
            : 'Drag the handle to compare'}
        </PText>
      </div>
    </div>
  );
}

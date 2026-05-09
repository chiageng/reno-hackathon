"use client";

import React, { useCallback, useRef, useState } from 'react';
import { colorConfig } from '@/config/colors';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  initialPercent?: number;
}

const HANDLE_HIT_WIDTH = 44; // wide enough to grab on touch
const HANDLE_KNOB_SIZE = 36;

export default function ComparisonSlider({
  beforeImage,
  afterImage,
  initialPercent = 50,
}: ComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [percent, setPercent] = useState(initialPercent);
  const draggingRef = useRef(false);

  const updateFromPointer = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPercent(pct);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    handleRef.current?.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    updateFromPointer(e.clientX);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    handleRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 1024,
        aspectRatio: '1 / 1',
        overflow: 'hidden',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(45, 41, 42, 0.18)',
        background: colorConfig.backgroundColor,
        userSelect: 'none',
      }}
    >
      {/* Before — full-size base layer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={beforeImage}
        alt="Before"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />
      {/* After — overlay clipped from the left up to slider position */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterImage}
        alt="After"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          clipPath: `inset(0 0 0 ${percent}%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Corner labels */}
      <div style={labelStyle('left')}>Before</div>
      <div style={labelStyle('right')}>After</div>

      {/* Drag handle (line + knob), wide invisible hit area */}
      <div
        ref={handleRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${percent}%`,
          width: HANDLE_HIT_WIDTH,
          transform: `translateX(-${HANDLE_HIT_WIDTH / 2}px)`,
          cursor: 'ew-resize',
          touchAction: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Vertical splitter line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: 2,
            background: 'white',
            boxShadow: '0 0 6px rgba(0, 0, 0, 0.4)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />
        {/* Knob */}
        <div
          style={{
            position: 'relative',
            width: HANDLE_KNOB_SIZE,
            height: HANDLE_KNOB_SIZE,
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colorConfig.textPrimary,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: -1,
            pointerEvents: 'none',
          }}
        >
          ⇄
        </div>
      </div>
    </div>
  );
}

function labelStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: 12,
    [side]: 12,
    background: 'rgba(45, 41, 42, 0.72)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    pointerEvents: 'none',
  };
}

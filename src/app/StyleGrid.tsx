"use client";

import React from 'react';
import { Card, Skeleton, Spin, Tag } from 'antd';
import { LoadingOutlined, RightOutlined, WarningOutlined } from '@ant-design/icons';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';
import { STYLE_KEYS, STYLE_LABELS, STYLE_TAGLINES, type StyleKey } from '@/lib/styles';

export interface StyleResult {
  style: StyleKey;
  imageDataUrl: string | null;
  isLoading: boolean;
  isIterating: boolean;
  error: string | null;
}

interface StyleGridProps {
  results: StyleResult[];
  onSelect: (style: StyleKey) => void;
}

const TILE_ASPECT = '4 / 3';

export default function StyleGrid({ results, onSelect }: StyleGridProps) {
  // Render in a fixed order regardless of completion order, so the layout doesn't jump.
  const ordered = STYLE_KEYS.map(
    (s) =>
      results.find((r) => r.style === s) ?? {
        style: s,
        imageDataUrl: null,
        isLoading: true,
        isIterating: false,
        error: null,
      },
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <HText variant="h5" style={{ margin: 0 }}>
        Three reimaginings
      </HText>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {ordered.map((r) => {
          const ready = !!r.imageDataUrl && !r.isIterating;
          return (
            <Card
              key={r.style}
              hoverable={ready}
              onClick={() => ready && onSelect(r.style)}
              styles={{ body: { padding: 16 } }}
              cover={
                <div
                  style={{
                    aspectRatio: TILE_ASPECT,
                    background: colorConfig.backgroundSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {r.imageDataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={r.imageDataUrl}
                      alt={STYLE_LABELS[r.style]}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : r.error ? (
                    <div
                      style={{
                        color: colorConfig.dangerColor,
                        textAlign: 'center',
                        padding: 16,
                      }}
                    >
                      <WarningOutlined style={{ fontSize: 24 }} />
                      <PText variant="small" style={{ marginTop: 8, color: colorConfig.dangerColor }}>
                        {r.error}
                      </PText>
                    </div>
                  ) : (
                    <div style={{ width: '100%', padding: 24 }}>
                      <Skeleton.Image active style={{ width: '100%', height: '100%' }} />
                    </div>
                  )}
                  {r.isIterating && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(45, 41, 42, 0.65)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        color: 'white',
                      }}
                    >
                      <Spin size="large" />
                      <PText
                        variant="small"
                        style={{ color: 'white', margin: 0, fontWeight: 500 }}
                      >
                        Updating…
                      </PText>
                    </div>
                  )}
                </div>
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <HText variant="h5" style={{ margin: 0 }}>
                    {STYLE_LABELS[r.style]}
                  </HText>
                  <PText variant="small" style={{ color: colorConfig.textSecondary, margin: 0 }}>
                    {STYLE_TAGLINES[r.style]}
                  </PText>
                </div>
                {r.isLoading ? (
                  <Tag icon={<LoadingOutlined />} color="processing">
                    Generating
                  </Tag>
                ) : ready ? (
                  <RightOutlined style={{ color: colorConfig.brandAccent }} />
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

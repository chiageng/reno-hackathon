"use client";

import React from 'react';
import { Card, Tag, Space } from 'antd';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';
import type { RoomAnalysis } from '@/lib/openai';

interface AnalysisPanelProps {
  analysis: RoomAnalysis;
}

const tagStyle: React.CSSProperties = {
  borderColor: colorConfig.brandAccent,
  color: colorConfig.brandAccent,
  background: colorConfig.backgroundColor,
};

export default function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  return (
    <Card title={<HText variant="h5">What I see</HText>} style={{ width: '100%' }}>
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <PText variant="normal" style={{ fontStyle: 'italic', color: colorConfig.textPrimary }}>
          &ldquo;{analysis.narrationText}&rdquo;
        </PText>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Tag style={tagStyle}>{analysis.roomType}</Tag>
          <Tag style={tagStyle}>{analysis.estimatedSizeM2} m²</Tag>
          <Tag style={tagStyle}>{analysis.lighting}</Tag>
        </div>

        <PText variant="small" style={{ color: colorConfig.textSecondary }}>
          <strong>Style:</strong> {analysis.currentStyle}
        </PText>

        <PText variant="small" style={{ color: colorConfig.textSecondary }}>
          <strong>Key items:</strong> {analysis.keyElements.join(', ')}
        </PText>

        <PText variant="small" style={{ color: colorConfig.textMuted }}>
          <strong>Fixed elements (preserved in redesigns):</strong>{' '}
          {analysis.fixedElements.join(', ')}
        </PText>
      </Space>
    </Card>
  );
}

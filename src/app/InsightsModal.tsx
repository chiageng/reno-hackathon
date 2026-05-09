"use client";

import React from 'react';
import { Alert, Modal, Skeleton, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';
import type {
  ActionStepCategory,
  RenovationInsights,
  RoomAnalysis,
} from '@/lib/openai';

interface InsightsModalProps {
  open: boolean;
  onClose: () => void;
  analysis: RoomAnalysis | null;
  sessionKey: string;
}

const SGD = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  maximumFractionDigits: 0,
});

const CATEGORY_LABEL: Record<ActionStepCategory, string> = {
  preparation: 'Prep',
  walls: 'Walls',
  flooring: 'Floors',
  lighting: 'Lighting',
  carpentry: 'Carpentry',
  furniture: 'Furniture',
  decor: 'Decor',
  electrical: 'Electrical',
  other: 'Other',
};

export default function InsightsModal({
  open,
  onClose,
  analysis,
  sessionKey,
}: InsightsModalProps) {
  const query = useQuery({
    queryKey: ['insights', sessionKey],
    enabled: open && !!analysis && !!sessionKey,
    staleTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<RenovationInsights> => {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Insights failed');
      }
      return res.json() as Promise<RenovationInsights>;
    },
  });

  const insights = query.data;

  return (
    <Modal
      title={<HText variant="h4" style={{ margin: 0 }}>Renovation insights</HText>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      styles={{ body: { padding: '12px 0' } }}
    >
      {query.isFetching && !insights && (
        <div style={{ padding: '8px 0' }}>
          <Skeleton active paragraph={{ rows: 3 }} />
          <div style={{ height: 16 }} />
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      )}

      {query.error && !query.isFetching && (
        <Alert
          type="error"
          message="Could not load insights"
          description={(query.error as Error).message}
          showIcon
        />
      )}

      {insights && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Summary */}
          <PText
            variant="normal"
            style={{ color: colorConfig.textPrimary, margin: 0 }}
          >
            {insights.summary}
          </PText>

          {/* Cost summary card */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: colorConfig.backgroundSecondary,
              border: `1px solid ${colorConfig.borderColor}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <PText variant="small" style={{ margin: 0, color: colorConfig.textSecondary }}>
                  Estimated renovation cost
                </PText>
                <HText variant="h3" style={{ margin: 0, color: colorConfig.brandAccent }}>
                  {SGD.format(insights.totalLowSGD)} – {SGD.format(insights.totalHighSGD)}
                </HText>
              </div>
              <div style={{ textAlign: 'right' }}>
                <PText variant="small" style={{ margin: 0, color: colorConfig.textSecondary }}>
                  Timeline
                </PText>
                <HText variant="h5" style={{ margin: 0 }}>
                  {insights.timelineLowWeeks}–{insights.timelineHighWeeks} weeks
                </HText>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.costs.map((c, i) => (
                <div
                  key={`${i}-${c.category}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 12,
                    paddingTop: i === 0 ? 0 : 8,
                    borderTop:
                      i === 0 ? 'none' : `1px solid ${colorConfig.borderColor}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <PText
                      variant="small"
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        color: colorConfig.textPrimary,
                      }}
                    >
                      {c.category}
                    </PText>
                    <PText
                      variant="small"
                      style={{
                        margin: 0,
                        color: colorConfig.textSecondary,
                        fontSize: 12,
                      }}
                    >
                      {c.description}
                    </PText>
                  </div>
                  <PText
                    variant="small"
                    style={{
                      margin: 0,
                      color: colorConfig.brandAccent,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {SGD.format(c.lowSGD)}
                    {c.highSGD !== c.lowSGD && (
                      <> – {SGD.format(c.highSGD)}</>
                    )}
                  </PText>
                </div>
              ))}
            </div>

            <PText
              variant="small"
              style={{
                margin: 0,
                color: colorConfig.textMuted,
                fontSize: 11,
                fontStyle: 'italic',
              }}
            >
              Furniture is shown separately in the shopping list.
            </PText>
          </div>

          {/* Action plan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <HText variant="h5" style={{ margin: 0 }}>
              How to get there · {insights.actionPlan.length} steps
            </HText>
            <ol
              style={{
                margin: 0,
                paddingLeft: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {insights.actionPlan.map((s) => (
                <li
                  key={s.step}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: colorConfig.brandAccent,
                      color: colorConfig.primaryForegroundColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {s.step}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <PText
                        variant="small"
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          color: colorConfig.textPrimary,
                        }}
                      >
                        {s.title}
                      </PText>
                      <Tag
                        style={{
                          margin: 0,
                          fontSize: 10,
                          padding: '0 6px',
                          background: colorConfig.secondaryColor,
                          borderColor: colorConfig.borderColor,
                          color: colorConfig.brandAccent,
                        }}
                      >
                        {CATEGORY_LABEL[s.category]}
                      </Tag>
                    </div>
                    <PText
                      variant="small"
                      style={{
                        margin: 0,
                        color: colorConfig.textSecondary,
                        lineHeight: 1.5,
                      }}
                    >
                      {s.description}
                    </PText>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Modal>
  );
}

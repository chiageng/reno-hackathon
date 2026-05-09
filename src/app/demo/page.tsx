"use client";

import React from 'react';
import { Alert, Card, Space } from 'antd';
import SectionContainer from '@/components/SectionContainer';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';

// Canonical pre-seeded demo — bulletproof fallback for the on-stage moment.
// Fill in real data + assets in src/lib/demo-data.ts and public/demo/* before
// the hackathon. See reno-execution-plan.md § "Hour 6.5–7" for the contract.
export default function DemoPage() {
  return (
    <SectionContainer maxWidth="960px">
      <div style={{ padding: '32px 24px 48px' }}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <div>
            <HText variant="h2" style={{ color: colorConfig.textPrimary, margin: 0 }}>
              Canonical demo
            </HText>
            <PText variant="normal" style={{ color: colorConfig.textSecondary }}>
              A pre-seeded run of the full Reno flow. Always works, even if every
              live API is down.
            </PText>
          </div>

          <Alert
            type="info"
            showIcon
            message="Placeholder"
            description={
              <PText variant="small">
                Wire this page to the canonical session in{' '}
                <code>src/lib/demo-data.ts</code> and the pre-rendered assets in{' '}
                <code>public/demo/</code>. See <code>reno-execution-plan.md</code>{' '}
                for the full demo script.
              </PText>
            }
          />

          <Card title={<HText variant="h5">What will live here</HText>}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <PText variant="small">1. Original room photo (canonical)</PText>
              <PText variant="small">
                2. Vision analysis JSON + ElevenLabs narration (auto-play)
              </PText>
              <PText variant="small">
                3. Three pre-cached redesigns (Scandi, Japandi, Industrial)
              </PText>
              <PText variant="small">
                4. Voice-iteration replay (sofa green + plant)
              </PText>
              <PText variant="small">5. Shoppable strip + cost summary</PText>
              <PText variant="small">
                6. Pre-rendered Veo 3 walk-through (
                <code>/demo/canonical-walkthrough.mp4</code>)
              </PText>
            </Space>
          </Card>
        </Space>
      </div>
    </SectionContainer>
  );
}

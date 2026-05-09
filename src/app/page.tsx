"use client";

import React from 'react';
import { Button, Space } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import Link from 'next/link';
import SectionContainer from '@/components/SectionContainer';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';

export default function Home() {
  return (
    <SectionContainer maxWidth="640px">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '64px 24px 48px',
          gap: 24,
        }}
      >
        <HText variant="h1" style={{ color: colorConfig.textPrimary, margin: 0 }}>
          Reimagine any room in 30 seconds
        </HText>
        <PText
          variant="normal"
          style={{ color: colorConfig.textSecondary, maxWidth: 480 }}
        >
          Take one photo. Get three photorealistic redesigns. Iterate by voice. See
          every visible item shoppable in Singapore.
        </PText>

        <Space direction="vertical" size={12} style={{ width: '100%', maxWidth: 320 }}>
          {/* TODO(hackathon): wire up to <PhotoUpload /> + /api/analyze */}
          <Button
            type="primary"
            size="large"
            icon={<CameraOutlined />}
            block
            disabled
          >
            Take a photo
          </Button>
          <Link href="/demo" style={{ width: '100%' }}>
            <Button size="large" block>
              See the demo
            </Button>
          </Link>
        </Space>

        <PText
          variant="small"
          style={{ color: colorConfig.textMuted, marginTop: 24 }}
        >
          Built for the AI Engineer Singapore Hackathon · 2026
        </PText>
      </div>
    </SectionContainer>
  );
}

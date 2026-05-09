"use client";

import React from 'react';
import { Layout } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colorConfig } from '@/config/colors';
import { HText, PText } from './MyText';

const { Header, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const HEADER_HEIGHT = 64;

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isDemo = pathname?.startsWith('/demo');

  return (
    <Layout style={{ minHeight: '100vh', background: colorConfig.backgroundColor }}>
      <Header
        style={{
          height: HEADER_HEIGHT,
          background: colorConfig.backgroundColor,
          borderBottom: `1px solid ${colorConfig.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <HText variant="h4" style={{ color: colorConfig.brandAccent, margin: 0 }}>
            Reno
          </HText>
          <PText
            variant="small"
            style={{ color: colorConfig.textSecondary, margin: 0 }}
          >
            reimagine any room
          </PText>
        </Link>
        <Link
          href={isDemo ? '/' : '/demo'}
          style={{
            color: colorConfig.textSecondary,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {isDemo ? 'Try yours' : 'See demo'}
        </Link>
      </Header>
      <Content style={{ background: colorConfig.backgroundColor }}>
        {children}
      </Content>
    </Layout>
  );
}

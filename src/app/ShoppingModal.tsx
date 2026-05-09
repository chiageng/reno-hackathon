"use client";

import React from 'react';
import { Modal } from 'antd';
import { HText, PText } from '@/components/MyText';
import { colorConfig } from '@/config/colors';
import { STYLE_KEYS, STYLE_LABELS, type StyleKey } from '@/lib/styles';
import {
  getCatalogForStyle,
  totalPriceSGD,
  type CatalogItem,
} from '@/lib/catalog';

interface ShoppingModalProps {
  open: boolean;
  onClose: () => void;
}

const SGD = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  maximumFractionDigits: 0,
});

function ItemCard({ item }: { item: CatalogItem }) {
  return (
    <a
      href={item.productUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        flexShrink: 0,
        width: 132,
        padding: 10,
        border: `1px solid ${colorConfig.borderColor}`,
        borderRadius: 10,
        background: colorConfig.backgroundColor,
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 8,
          background: colorConfig.secondaryColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
        }}
        aria-hidden
      >
        {item.emoji}
      </div>
      <PText
        variant="small"
        style={{
          margin: 0,
          fontWeight: 600,
          color: colorConfig.textPrimary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: 12,
        }}
      >
        {item.name}
      </PText>
      <PText
        variant="small"
        style={{
          margin: 0,
          color: colorConfig.brandAccent,
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {SGD.format(item.priceSGD)}
      </PText>
    </a>
  );
}

function StyleSection({ style }: { style: StyleKey }) {
  const items = getCatalogForStyle(style);
  const total = totalPriceSGD(items);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <HText variant="h5" style={{ margin: 0 }}>
          {STYLE_LABELS[style]}
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              fontWeight: 400,
              color: colorConfig.textMuted,
            }}
          >
            {items.length} items
          </span>
        </HText>
        <HText
          variant="h5"
          style={{
            color: colorConfig.brandAccent,
            margin: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {SGD.format(total)}
        </HText>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 4,
        }}
      >
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function ShoppingModal({ open, onClose }: ShoppingModalProps) {
  const totals = STYLE_KEYS.map((s) => totalPriceSGD(getCatalogForStyle(s)));
  const min = Math.min(...totals);
  const max = Math.max(...totals);

  return (
    <Modal
      title={<HText variant="h4" style={{ margin: 0 }}>Shop your design</HText>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      styles={{ body: { padding: '12px 0' } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: colorConfig.backgroundSecondary,
            border: `1px solid ${colorConfig.borderColor}`,
          }}
        >
          <PText
            variant="small"
            style={{ margin: 0, color: colorConfig.textSecondary }}
          >
            Estimated budget across the three styles
          </PText>
          <HText
            variant="h3"
            style={{ margin: 0, color: colorConfig.brandAccent }}
          >
            {SGD.format(min)} – {SGD.format(max)}
          </HText>
          <PText
            variant="small"
            style={{ margin: '6px 0 0', color: colorConfig.textMuted }}
          >
            Each look is a curated 6-piece set from IKEA Singapore. Tap any
            item to open the product on ikea.com.sg.
          </PText>
        </div>

        {STYLE_KEYS.map((style) => (
          <StyleSection key={style} style={style} />
        ))}
      </div>
    </Modal>
  );
}

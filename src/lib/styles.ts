// Shared style constants — safe to import from both client and server code.

export type StyleKey = 'scandi' | 'japandi' | 'industrial';

export const STYLE_KEYS: readonly StyleKey[] = ['scandi', 'japandi', 'industrial'] as const;

export const STYLE_LABELS: Record<StyleKey, string> = {
  scandi: 'Scandi',
  japandi: 'Japandi',
  industrial: 'Industrial',
};

export const STYLE_TAGLINES: Record<StyleKey, string> = {
  scandi: 'Light, airy, Nordic warmth',
  japandi: 'Calm, minimal, natural fibres',
  industrial: 'Exposed brick, leather, edison bulbs',
};

// Hardcoded IKEA Singapore catalog — 6 items per style. Prices are
// approximations to keep the demo total realistic (~S$1,400–S$2,200 per look).
// Replace with real product imagery + URLs before any non-demo use.
import type { StyleKey } from './styles';

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  emoji: string;
  priceSGD: number;
  productUrl: string;
}

const ikeaSearch = (query: string): string =>
  `https://www.ikea.com/sg/en/search/products/?q=${encodeURIComponent(query)}`;

const SCANDI: CatalogItem[] = [
  { id: 'scandi-1', name: 'KIVIK 3-Seat Sofa', category: 'Sofa', emoji: '🛋️', priceSGD: 799, productUrl: ikeaSearch('KIVIK') },
  { id: 'scandi-2', name: 'LISABO Coffee Table', category: 'Table', emoji: '🪵', priceSGD: 179, productUrl: ikeaSearch('LISABO') },
  { id: 'scandi-3', name: 'LERSTA Floor Lamp', category: 'Lighting', emoji: '💡', priceSGD: 39, productUrl: ikeaSearch('LERSTA') },
  { id: 'scandi-4', name: 'POÄNG Armchair (birch)', category: 'Chair', emoji: '🪑', priceSGD: 179, productUrl: ikeaSearch('POANG') },
  { id: 'scandi-5', name: 'LOHALS Jute Rug', category: 'Rug', emoji: '🟫', priceSGD: 199, productUrl: ikeaSearch('LOHALS') },
  { id: 'scandi-6', name: 'FEJKA Potted Plant', category: 'Plant', emoji: '🪴', priceSGD: 25, productUrl: ikeaSearch('FEJKA') },
];

const JAPANDI: CatalogItem[] = [
  { id: 'japandi-1', name: 'LANDSKRONA 3-Seat Sofa', category: 'Sofa', emoji: '🛋️', priceSGD: 1099, productUrl: ikeaSearch('LANDSKRONA') },
  { id: 'japandi-2', name: 'LACK Side Table (oak)', category: 'Table', emoji: '🪵', priceSGD: 49, productUrl: ikeaSearch('LACK oak') },
  { id: 'japandi-3', name: 'SINNERLIG Pendant Lamp', category: 'Lighting', emoji: '🪔', priceSGD: 159, productUrl: ikeaSearch('SINNERLIG') },
  { id: 'japandi-4', name: 'POÄNG Armchair (light beige)', category: 'Chair', emoji: '🪑', priceSGD: 179, productUrl: ikeaSearch('POANG beige') },
  { id: 'japandi-5', name: 'TÅNUM Cotton Rug', category: 'Rug', emoji: '🟫', priceSGD: 89, productUrl: ikeaSearch('TANUM') },
  { id: 'japandi-6', name: 'FEJKA Bonsai Plant', category: 'Plant', emoji: '🪴', priceSGD: 35, productUrl: ikeaSearch('FEJKA bonsai') },
];

const INDUSTRIAL: CatalogItem[] = [
  { id: 'industrial-1', name: 'LANDSKRONA Leather Sofa', category: 'Sofa', emoji: '🛋️', priceSGD: 1499, productUrl: ikeaSearch('LANDSKRONA leather') },
  { id: 'industrial-2', name: 'KRAGSTA Coffee Table (black)', category: 'Table', emoji: '⬛', priceSGD: 179, productUrl: ikeaSearch('KRAGSTA black') },
  { id: 'industrial-3', name: 'NÄVLINGE LED Floor Lamp', category: 'Lighting', emoji: '💡', priceSGD: 49, productUrl: ikeaSearch('NAVLINGE') },
  { id: 'industrial-4', name: 'KALLAX Shelf (black-brown)', category: 'Storage', emoji: '🗄️', priceSGD: 129, productUrl: ikeaSearch('KALLAX black-brown') },
  { id: 'industrial-5', name: 'KILDIS Wool Rug', category: 'Rug', emoji: '🟫', priceSGD: 249, productUrl: ikeaSearch('KILDIS') },
  { id: 'industrial-6', name: 'NÄVLINGE Pendant Lamp', category: 'Lighting', emoji: '🔌', priceSGD: 79, productUrl: ikeaSearch('NAVLINGE pendant') },
];

export const CATALOG_BY_STYLE: Record<StyleKey, CatalogItem[]> = {
  scandi: SCANDI,
  japandi: JAPANDI,
  industrial: INDUSTRIAL,
};

export function getCatalogForStyle(style: StyleKey): CatalogItem[] {
  return CATALOG_BY_STYLE[style];
}

export function totalPriceSGD(items: CatalogItem[]): number {
  return items.reduce((sum, item) => sum + item.priceSGD, 0);
}

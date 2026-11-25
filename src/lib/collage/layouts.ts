import { CollageLayoutTemplate } from '../../types/collage';

export const COLLAGE_GRADIENTS: { id: string; label: string; css: string; stops: [string, string] }[] = [
  { id: 'slate-mist', label: 'Slate Mist', css: 'linear-gradient(135deg, #F8FAFD 0%, #E8F0FE 100%)', stops: ['#F8FAFD', '#E8F0FE'] },
  { id: 'warm-paper', label: 'Warm Paper', css: 'linear-gradient(135deg, #FAF6F0 0%, #EFE5D8 100%)', stops: ['#FAF6F0', '#EFE5D8'] },
  { id: 'ocean-breeze', label: 'Ocean Breeze', css: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)', stops: ['#E0F2FE', '#BAE6FD'] },
  { id: 'sunset-silk', label: 'Sunset Silk', css: 'linear-gradient(135deg, #FEF3C7 0%, #FECDD3 100%)', stops: ['#FEF3C7', '#FECDD3'] },
  { id: 'midnight-ink', label: 'Midnight Ink', css: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', stops: ['#1E293B', '#0F172A'] },
  { id: 'studio-charcoal', label: 'Charcoal', css: 'linear-gradient(135deg, #27272A 0%, #18181B 100%)', stops: ['#27272A', '#18181B'] },
  { id: 'sage-linen', label: 'Sage Linen', css: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', stops: ['#ECFDF5', '#D1FAE5'] },
  { id: 'cobalt-wash', label: 'Cobalt Wash', css: 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)', stops: ['#DBEAFE', '#93C5FD'] },
];

export const COLLAGE_LAYOUTS: CollageLayoutTemplate[] = [
  // 2-photo layouts
  {
    id: '2-split-vertical',
    name: 'Split Vertical',
    photoCount: 2,
    category: '2-photo',
    styleTag: 'Grid',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.5, h: 1 },
      { id: 's2', x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: '2-split-horizontal',
    name: 'Split Horizontal',
    photoCount: 2,
    category: '2-photo',
    styleTag: 'Grid',
    slots: [
      { id: 's1', x: 0, y: 0, w: 1, h: 0.5 },
      { id: 's2', x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: '2-asymmetric',
    name: 'Asymmetric Duo',
    photoCount: 2,
    category: '2-photo',
    styleTag: 'Asymmetric',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.64, h: 1 },
      { id: 's2', x: 0.64, y: 0.14, w: 0.36, h: 0.72 },
    ],
  },

  // 3-photo layouts
  {
    id: '3-hero-left',
    name: 'Hero Left Stack',
    photoCount: 3,
    category: '3-photo',
    styleTag: 'Asymmetric',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.6, h: 1 },
      { id: 's2', x: 0.6, y: 0, w: 0.4, h: 0.5 },
      { id: 's3', x: 0.6, y: 0.5, w: 0.4, h: 0.5 },
    ],
  },
  {
    id: '3-triptych',
    name: 'Classic Triptych',
    photoCount: 3,
    category: '3-photo',
    styleTag: 'Grid',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.3333, h: 1 },
      { id: 's2', x: 0.3333, y: 0, w: 0.3334, h: 1 },
      { id: 's3', x: 0.6667, y: 0, w: 0.3333, h: 1 },
    ],
  },
  {
    id: '3-magazine',
    name: 'Magazine Feature',
    photoCount: 3,
    category: 'editorial',
    styleTag: 'Magazine',
    defaultMargin: 36,
    defaultSpacing: 16,
    slots: [
      { id: 's1', x: 0.04, y: 0.03, w: 0.92, h: 0.56 },
      { id: 's2', x: 0.04, y: 0.61, w: 0.45, h: 0.36 },
      { id: 's3', x: 0.51, y: 0.61, w: 0.45, h: 0.36 },
    ],
  },

  // 4-photo layouts
  {
    id: '4-grid-2x2',
    name: '2 × 2 Grid',
    photoCount: 4,
    category: '4-photo',
    styleTag: 'Grid',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.5, h: 0.5 },
      { id: 's2', x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { id: 's3', x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { id: 's4', x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: '4-polaroid-scatter',
    name: 'Polaroid Scatter',
    photoCount: 4,
    category: 'editorial',
    styleTag: 'Polaroid',
    defaultMargin: 32,
    defaultSpacing: 0,
    defaultRadius: 4,
    slots: [
      { id: 's1', x: 0.05, y: 0.06, w: 0.44, h: 0.44, rotation: -4, polaroidFrame: true, zIndex: 1 },
      { id: 's2', x: 0.5, y: 0.04, w: 0.44, h: 0.44, rotation: 3.5, polaroidFrame: true, zIndex: 2 },
      { id: 's3', x: 0.08, y: 0.51, w: 0.44, h: 0.44, rotation: 2.5, polaroidFrame: true, zIndex: 3 },
      { id: 's4', x: 0.49, y: 0.5, w: 0.44, h: 0.44, rotation: -3, polaroidFrame: true, zIndex: 4 },
    ],
  },
  {
    id: '4-mosaic-asymmetric',
    name: 'Mosaic Asymmetric',
    photoCount: 4,
    category: '4-photo',
    styleTag: 'Asymmetric',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.65, h: 0.58 },
      { id: 's2', x: 0.65, y: 0, w: 0.35, h: 0.38 },
      { id: 's3', x: 0, y: 0.58, w: 0.45, h: 0.42 },
      { id: 's4', x: 0.45, y: 0.58, w: 0.55, h: 0.42 },
    ],
  },

  // 5-photo layouts
  {
    id: '5-pinterest-board',
    name: 'Pinterest Board',
    photoCount: 5,
    category: '5-photo',
    styleTag: 'Pinterest',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.5, h: 0.6 },
      { id: 's2', x: 0.5, y: 0, w: 0.5, h: 0.36 },
      { id: 's3', x: 0, y: 0.6, w: 0.5, h: 0.4 },
      { id: 's4', x: 0.5, y: 0.36, w: 0.5, h: 0.34 },
      { id: 's5', x: 0.5, y: 0.7, w: 0.5, h: 0.3 },
    ],
  },
  {
    id: '5-focus-center',
    name: 'Editorial 5-Grid',
    photoCount: 5,
    category: '5-photo',
    styleTag: 'Magazine',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.5, h: 0.5 },
      { id: 's2', x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { id: 's3', x: 0, y: 0.5, w: 0.3333, h: 0.5 },
      { id: 's4', x: 0.3333, y: 0.5, w: 0.3334, h: 0.5 },
      { id: 's5', x: 0.6667, y: 0.5, w: 0.3333, h: 0.5 },
    ],
  },

  // 6-photo layouts
  {
    id: '6-gallery-3x2',
    name: '3 × 2 Gallery',
    photoCount: 6,
    category: '6-photo',
    styleTag: 'Grid',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.3333, h: 0.5 },
      { id: 's2', x: 0.3333, y: 0, w: 0.3334, h: 0.5 },
      { id: 's3', x: 0.6667, y: 0, w: 0.3333, h: 0.5 },
      { id: 's4', x: 0, y: 0.5, w: 0.3333, h: 0.5 },
      { id: 's5', x: 0.3333, y: 0.5, w: 0.3334, h: 0.5 },
      { id: 's6', x: 0.6667, y: 0.5, w: 0.3333, h: 0.5 },
    ],
  },
  {
    id: '6-scrapbook',
    name: 'Scrapbook Journal',
    photoCount: 6,
    category: 'editorial',
    styleTag: 'Scrapbook',
    defaultMargin: 28,
    defaultSpacing: 4,
    defaultRadius: 8,
    slots: [
      { id: 's1', x: 0.02, y: 0.03, w: 0.38, h: 0.34, rotation: -2.5, polaroidFrame: true, zIndex: 1 },
      { id: 's2', x: 0.36, y: 0.02, w: 0.32, h: 0.32, rotation: 1.5, polaroidFrame: true, zIndex: 2 },
      { id: 's3', x: 0.64, y: 0.05, w: 0.34, h: 0.36, rotation: 3, polaroidFrame: true, zIndex: 3 },
      { id: 's4', x: 0.03, y: 0.44, w: 0.34, h: 0.5, rotation: 2, polaroidFrame: true, zIndex: 4 },
      { id: 's5', x: 0.35, y: 0.42, w: 0.33, h: 0.52, rotation: -1.5, polaroidFrame: true, zIndex: 5 },
      { id: 's6', x: 0.65, y: 0.46, w: 0.32, h: 0.48, rotation: -2.8, polaroidFrame: true, zIndex: 6 },
    ],
  },

  // 8-photo layouts
  {
    id: '8-contact-sheet',
    name: '8-Frame Sheet',
    photoCount: 8,
    category: '8-photo',
    styleTag: 'Grid',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.25, h: 0.5 },
      { id: 's2', x: 0.25, y: 0, w: 0.25, h: 0.5 },
      { id: 's3', x: 0.5, y: 0, w: 0.25, h: 0.5 },
      { id: 's4', x: 0.75, y: 0, w: 0.25, h: 0.5 },
      { id: 's5', x: 0, y: 0.5, w: 0.25, h: 0.5 },
      { id: 's6', x: 0.25, y: 0.5, w: 0.25, h: 0.5 },
      { id: 's7', x: 0.5, y: 0.5, w: 0.25, h: 0.5 },
      { id: 's8', x: 0.75, y: 0.5, w: 0.25, h: 0.5 },
    ],
  },

  // 9-photo layouts
  {
    id: '9-grid-3x3',
    name: '3 × 3 Grid',
    photoCount: 9,
    category: '9-photo',
    styleTag: 'Grid',
    slots: [
      { id: 's1', x: 0, y: 0, w: 0.3333, h: 0.3333 },
      { id: 's2', x: 0.3333, y: 0, w: 0.3334, h: 0.3333 },
      { id: 's3', x: 0.6667, y: 0, w: 0.3333, h: 0.3333 },
      { id: 's4', x: 0, y: 0.3333, w: 0.3333, h: 0.3334 },
      { id: 's5', x: 0.3333, y: 0.3333, w: 0.3334, h: 0.3334 },
      { id: 's6', x: 0.6667, y: 0.3333, w: 0.3333, h: 0.3334 },
      { id: 's7', x: 0, y: 0.6667, w: 0.3333, h: 0.3333 },
      { id: 's8', x: 0.3333, y: 0.6667, w: 0.3334, h: 0.3333 },
      { id: 's9', x: 0.6667, y: 0.6667, w: 0.3333, h: 0.3333 },
    ],
  },
];

export function getCollageLayoutById(id: string): CollageLayoutTemplate {
  return COLLAGE_LAYOUTS.find((l) => l.id === id) ?? COLLAGE_LAYOUTS[0];
}

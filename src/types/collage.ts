export type CollageLayoutCategory =
  | '2-photo'
  | '3-photo'
  | '4-photo'
  | '5-photo'
  | '6-photo'
  | '8-photo'
  | '9-photo'
  | 'editorial';

export interface CollageSlotRect {
  id: string;
  /** Normalized 0..1 positions inside the inner padded stage */
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number; // subtle polaroid/scrapbook tilt in degrees
  polaroidFrame?: boolean;
  zIndex?: number;
}

export interface CollageLayoutTemplate {
  id: string;
  name: string;
  photoCount: number;
  category: CollageLayoutCategory;
  styleTag: string;
  slots: CollageSlotRect[];
  defaultSpacing?: number;
  defaultMargin?: number;
  defaultRadius?: number;
}

export interface CollageSlotContent {
  slotId: string;
  imageUrl: string | null;
  imageName?: string;
  zoom: number; // 1..3
  offsetX: number; // -1..1
  offsetY: number; // -1..1
}

export interface CollageCanvasSizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export interface CollageTextLayer {
  id: string;
  text: string;
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  fontSize: number; // relative to 1080px reference width
  color: string;
  fontFamily: 'Plus Jakarta Sans' | 'DM Sans' | 'Georgia' | 'JetBrains Mono';
  fontWeight: '400' | '600' | '700';
  align: 'left' | 'center' | 'right';
}

export type CollageStickerKind =
  | 'star-burst'
  | 'corner-frame'
  | 'film-strip'
  | 'tape-strip'
  | 'circle-stamp'
  | 'spark-diamond';

export interface CollageStickerLayer {
  id: string;
  kind: CollageStickerKind;
  x: number; // 0..1
  y: number; // 0..1
  size: number; // relative px at 1080px width
  color: string;
  rotation: number;
}

export type CollageBackgroundType = 'solid' | 'gradient';

export interface CollageState {
  templateId: string;
  canvasSizeId: string;
  customWidth: number;
  customHeight: number;
  spacing: number; // 0..48
  outerMargin: number; // 0..80
  borderRadius: number; // 0..48
  shadowIntensity: number; // 0..100
  backgroundType: CollageBackgroundType;
  backgroundColor: string;
  backgroundGradient: string;
  slots: CollageSlotContent[];
  /** Allows per-slot frame scale adjustments from default template */
  customSlotRects: Record<string, CollageSlotRect>;
  texts: CollageTextLayer[];
  stickers: CollageStickerLayer[];
}

export const COLLAGE_CANVAS_PRESETS: CollageCanvasSizePreset[] = [
  { id: 'ig-post', label: 'Instagram Post (1080 × 1080)', width: 1080, height: 1080 },
  { id: 'ig-portrait', label: 'Instagram Portrait (1080 × 1350)', width: 1080, height: 1350 },
  { id: 'ig-story', label: 'Instagram Story (1080 × 1920)', width: 1080, height: 1920 },
  { id: 'pinterest-pin', label: 'Pinterest Pin (1000 × 1500)', width: 1000, height: 1500 },
  { id: 'fb-post', label: 'Facebook Post (1200 × 630)', width: 1200, height: 630 },
  { id: 'custom', label: 'Custom Dimensions', width: 1200, height: 1200 },
];

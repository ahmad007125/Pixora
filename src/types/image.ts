export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

export type AspectRatioPresetId =
  | 'original'
  | 'freeform'
  | '1:1'
  | '4:5'
  | '3:4'
  | '16:9'
  | '9:16'
  | '3:2';

export interface AspectRatioPreset {
  id: AspectRatioPresetId;
  label: string;
  ratio: number | null;
}

export interface CropRect {
  /** Normalized 0..1 coordinates relative to transformed canvas */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageAdjustments {
  brightness: number; // -100..100
  contrast: number; // -100..100
  saturation: number; // -100..100
  exposure: number; // -100..100
  temperature: number; // -100..100
  tint: number; // -100..100
  highlights: number; // -100..100
  shadows: number; // -100..100
  sharpness: number; // 0..100
  blur: number; // 0..100
  vignette: number; // 0..100
  hue: number; // -180..180
  gamma: number; // 0.4..2.2 (default 1.0)
}

export interface TransformState {
  rotate90: 0 | 90 | 180 | 270;
  straighten: number; // -45..45 degrees
  flipH: boolean;
  flipV: boolean;
  crop: CropRect;
  aspectRatio: AspectRatioPresetId;
  resizeWidth: number | null;
  resizeHeight: number | null;
  lockResizeAspect: boolean;
}

export interface LoadedImage {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  objectUrl: string;
  previewDataUrl?: string;
  isAnimated?: boolean;
  warningMessage?: string;
}

export interface FormatSupportInfo {
  png: boolean;
  jpeg: boolean;
  webp: boolean;
  avif: boolean;
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  blur: 0,
  vignette: 0,
  hue: 0,
  gamma: 1.0,
};

export const DEFAULT_TRANSFORM: TransformState = {
  rotate90: 0,
  straighten: 0,
  flipH: false,
  flipV: false,
  crop: { x: 0, y: 0, width: 1, height: 1 },
  aspectRatio: 'original',
  resizeWidth: null,
  resizeHeight: null,
  lockResizeAspect: true,
};

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { id: 'original', label: 'Original', ratio: null },
  { id: 'freeform', label: 'Freeform', ratio: null },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '3:4', label: '3:4', ratio: 3 / 4 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
];

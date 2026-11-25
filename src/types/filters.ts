import { ImageAdjustments } from './image';

export type FilterCategory = 'all' | 'cinematic' | 'vintage' | 'film' | 'creative' | 'custom';

export interface FilterGradeSettings {
  adjustments?: Partial<ImageAdjustments>;
  /** Lifted black point 0..45 (out of 255) for matte/film fade */
  fadedBlacks?: number;
  /** RGB tint added to dark luminance values [-40..40] */
  splitToneShadows?: [number, number, number];
  /** RGB tint added to bright luminance values [-40..40] */
  splitToneHighlights?: [number, number, number];
  /** Seeded film grain intensity 0..100 */
  grain?: number;
  /** Sepia tone mix 0..100 */
  sepia?: number;
  /** Monochrome B&W luminance mix 0..100 */
  monochrome?: number;
  /** Soft dreamy highlight bloom 0..100 */
  glow?: number;
  /** Invert color channels 0..100 (for Film Negative) */
  negative?: number;
  /** Subtle warm/cool radial dust or vignette lift */
  vignetteColor?: 'dark' | 'warm';
}

export interface FilterPreset {
  id: string;
  name: string;
  category: Exclude<FilterCategory, 'all' | 'custom'>;
  description: string;
  grade: FilterGradeSettings;
}

export interface ActiveFilterState {
  filterId: string | null;
  intensity: number; // 0..100
  extraGrain: number; // 0..100
  extraFade: number; // 0..100
  extraVignette: number; // 0..100
  secondaryFilterId: string | null;
  secondaryIntensity: number; // 0..100
}

export interface SavedCustomFilter {
  id: string;
  name: string;
  createdAt: number;
  state: ActiveFilterState;
  adjustments: Partial<ImageAdjustments>;
}

export const DEFAULT_ACTIVE_FILTER: ActiveFilterState = {
  filterId: null,
  intensity: 100,
  extraGrain: 0,
  extraFade: 0,
  extraVignette: 0,
  secondaryFilterId: null,
  secondaryIntensity: 50,
};

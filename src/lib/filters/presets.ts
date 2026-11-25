import { ActiveFilterState, FilterGradeSettings, FilterPreset } from '../../types/filters';
import { ImageAdjustments } from '../../types/image';

export const FILTER_PRESETS: FilterPreset[] = [
  // A. Cinematic (8)
  {
    id: 'cinematic-blue',
    name: 'Cinematic Blue',
    category: 'cinematic',
    description: 'Deep cobalt shadows with crisp neutral highlights.',
    grade: {
      adjustments: { contrast: 14, temperature: -24, saturation: -8, shadows: -10, highlights: 6 },
      splitToneShadows: [-14, -2, 22],
      splitToneHighlights: [6, 8, 12],
      fadedBlacks: 8,
      vignette: 24,
    } as FilterGradeSettings & { vignette?: number },
  },
  {
    id: 'teal-orange',
    name: 'Teal & Orange',
    category: 'cinematic',
    description: 'Blockbuster complementary split-tone color separation.',
    grade: {
      adjustments: { contrast: 18, saturation: 14, temperature: 10, highlights: 8, shadows: -12 },
      splitToneShadows: [-20, 10, 22],
      splitToneHighlights: [24, 10, -14],
      fadedBlacks: 5,
    },
  },
  {
    id: 'moody-film',
    name: 'Moody Film',
    category: 'cinematic',
    description: 'Subdued greens, muted midtones, and atmospheric depth.',
    grade: {
      adjustments: { exposure: -8, contrast: 16, saturation: -24, shadows: -16, temperature: -8 },
      splitToneShadows: [-6, 4, 8],
      fadedBlacks: 16,
      grain: 18,
    },
  },
  {
    id: 'dark-cinema',
    name: 'Dark Cinema',
    category: 'cinematic',
    description: 'Low-key theatrical contrast with rich shadowed blacks.',
    grade: {
      adjustments: { exposure: -14, contrast: 28, saturation: -18, highlights: -10, shadows: -20 },
      splitToneShadows: [-8, -4, 6],
      splitToneHighlights: [10, 6, -4],
    },
  },
  {
    id: 'hollywood-warm',
    name: 'Hollywood Warm',
    category: 'cinematic',
    description: 'Golden studio highlights with balanced skin luminance.',
    grade: {
      adjustments: { contrast: 12, temperature: 22, tint: 6, saturation: 8, highlights: 12 },
      splitToneShadows: [-8, 2, 10],
      splitToneHighlights: [20, 12, -8],
      fadedBlacks: 6,
    },
  },
  {
    id: 'cool-shadows',
    name: 'Cool Shadows',
    category: 'cinematic',
    description: 'Steel-blue lowlights balanced against clean daylight whites.',
    grade: {
      adjustments: { contrast: 10, temperature: -16, tint: -4, saturation: -6, shadows: 8 },
      splitToneShadows: [-16, 4, 20],
      splitToneHighlights: [8, 6, 0],
    },
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    category: 'cinematic',
    description: 'Sun-drenched amber warmth and radiant soft highlights.',
    grade: {
      adjustments: { exposure: 8, temperature: 34, tint: 8, saturation: 18, shadows: 14, highlights: -6 },
      splitToneShadows: [10, 2, -8],
      splitToneHighlights: [26, 14, -12],
      glow: 18,
    },
  },
  {
    id: 'dramatic-contrast',
    name: 'Dramatic Contrast',
    category: 'cinematic',
    description: 'Crisp micro-contrast with bold shadow and highlight punch.',
    grade: {
      adjustments: { contrast: 38, sharpness: 24, saturation: -10, highlights: 14, shadows: -18 },
      splitToneShadows: [-6, -4, 4],
    },
  },

  // B. Vintage (8)
  {
    id: 'vintage-1970s',
    name: 'Vintage 1970s',
    category: 'vintage',
    description: 'Sun-bleached amber fade with soft mustard highlights.',
    grade: {
      adjustments: { temperature: 24, tint: 10, contrast: -10, saturation: -14, exposure: 4 },
      splitToneShadows: [10, 6, -12],
      splitToneHighlights: [22, 18, -14],
      fadedBlacks: 24,
      grain: 22,
    },
  },
  {
    id: 'retro-1980s',
    name: 'Retro 1980s',
    category: 'vintage',
    description: 'Vibrant magenta-cyan consumer print color shift.',
    grade: {
      adjustments: { contrast: 14, saturation: 18, tint: 18, temperature: -10 },
      splitToneShadows: [-10, 6, 18],
      splitToneHighlights: [18, -4, 14],
      fadedBlacks: 14,
      grain: 20,
    },
  },
  {
    id: 'old-film',
    name: 'Old Film',
    category: 'vintage',
    description: 'Aged emulsion tone with lifted blacks and organic grain.',
    grade: {
      adjustments: { contrast: -6, saturation: -32, temperature: 14, highlights: -10 },
      sepia: 28,
      fadedBlacks: 26,
      grain: 38,
    },
  },
  {
    id: 'faded-memories',
    name: 'Faded Memories',
    category: 'vintage',
    description: 'Airy pastel lift with soft matte shadows and gentle warmth.',
    grade: {
      adjustments: { exposure: 8, contrast: -18, saturation: -22, temperature: 10, shadows: 18 },
      fadedBlacks: 32,
      splitToneHighlights: [12, 8, -4],
      grain: 14,
    },
  },
  {
    id: 'kodak-warmth',
    name: 'Kodak-inspired Warmth',
    category: 'vintage',
    description: 'Rich golden yellows, warm reds, and crisp daylight greens.',
    grade: {
      adjustments: { contrast: 12, temperature: 18, saturation: 16, shadows: 6 },
      splitToneShadows: [6, 4, -8],
      splitToneHighlights: [20, 14, -10],
      fadedBlacks: 8,
      grain: 16,
    },
  },
  {
    id: 'classic-portra',
    name: 'Classic Portra-inspired',
    category: 'vintage',
    description: 'Flattering natural skin tones with creamy pastel highlights.',
    grade: {
      adjustments: { exposure: 6, contrast: -4, saturation: -6, temperature: 10, tint: 8, shadows: 14 },
      splitToneShadows: [4, 6, 8],
      splitToneHighlights: [14, 10, -2],
      fadedBlacks: 12,
      grain: 14,
    },
  },
  {
    id: 'vintage-brown',
    name: 'Vintage Brown',
    category: 'vintage',
    description: 'Deep espresso shadows with warm parchment midtones.',
    grade: {
      adjustments: { contrast: 8, saturation: -36, temperature: 22, exposure: -4 },
      sepia: 42,
      splitToneShadows: [14, 4, -12],
      fadedBlacks: 18,
      grain: 20,
    },
  },
  {
    id: 'sepia-memories',
    name: 'Sepia Memories',
    category: 'vintage',
    description: 'Archival warm monochrome sepia print aesthetic.',
    grade: {
      adjustments: { contrast: 10, temperature: 16, highlights: -6 },
      sepia: 85,
      fadedBlacks: 14,
      grain: 24,
    },
  },

  // C. Film (6)
  {
    id: 'analog-film',
    name: 'Analog Film',
    category: 'film',
    description: 'Balanced 120mm medium format film curve with fine grain.',
    grade: {
      adjustments: { contrast: 10, saturation: -4, temperature: 6, shadows: 8, highlights: -8 },
      fadedBlacks: 12,
      grain: 22,
      splitToneShadows: [-4, 4, 8],
    },
  },
  {
    id: '35mm-film',
    name: '35mm Film',
    category: 'film',
    description: 'Punchy street photography stock with subtle emerald shadows.',
    grade: {
      adjustments: { contrast: 16, saturation: 6, sharpness: 12, shadows: -6 },
      splitToneShadows: [-8, 10, 4],
      splitToneHighlights: [12, 8, -6],
      fadedBlacks: 10,
      grain: 28,
    },
  },
  {
    id: 'grainy-film',
    name: 'Grainy Film',
    category: 'film',
    description: 'High-ISO pushed film texture with gritty contrast.',
    grade: {
      adjustments: { contrast: 22, saturation: -16, sharpness: 16 },
      fadedBlacks: 16,
      grain: 62,
    },
  },
  {
    id: 'soft-film',
    name: 'Soft Film',
    category: 'film',
    description: 'Diffused halation glow with gentle contrast and airy shadows.',
    grade: {
      adjustments: { exposure: 6, contrast: -12, saturation: -8, highlights: -12, shadows: 16 },
      fadedBlacks: 18,
      glow: 26,
      grain: 14,
    },
  },
  {
    id: 'dusty-film',
    name: 'Dusty Film',
    category: 'film',
    description: 'Desaturated warm archive look with raised matte blacks.',
    grade: {
      adjustments: { contrast: -8, saturation: -30, temperature: 12, tint: 4 },
      fadedBlacks: 30,
      sepia: 18,
      grain: 34,
    },
  },
  {
    id: 'film-negative',
    name: 'Film Negative',
    category: 'film',
    description: 'Inverted color negative film strip reversal effect.',
    grade: {
      adjustments: { contrast: 10 },
      negative: 100,
      grain: 16,
    },
  },

  // D. Creative (8)
  {
    id: 'dreamy-glow',
    name: 'Dreamy Glow',
    category: 'creative',
    description: 'Luminous highlight bloom with soft ethereal contrast.',
    grade: {
      adjustments: { exposure: 10, contrast: -10, saturation: 8, shadows: 18, highlights: 12 },
      glow: 48,
      splitToneHighlights: [14, 10, 14],
    },
  },
  {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    category: 'creative',
    description: 'Delicate lifted whites with gentle rose-lavender toning.',
    grade: {
      adjustments: { exposure: 12, contrast: -16, saturation: -14, tint: 14, shadows: 22 },
      fadedBlacks: 20,
      splitToneHighlights: [14, 6, 16],
    },
  },
  {
    id: 'matte-look',
    name: 'Matte Look',
    category: 'creative',
    description: 'Modern editorial flat black curve with clean neutral tones.',
    grade: {
      adjustments: { contrast: -12, saturation: -10, highlights: -14, shadows: 12 },
      fadedBlacks: 34,
    },
  },
  {
    id: 'black-and-white',
    name: 'Black & White',
    category: 'creative',
    description: 'Classic panchromatic silver gelatin monochrome.',
    grade: {
      adjustments: { contrast: 16, highlights: 6, shadows: -6 },
      monochrome: 100,
      grain: 12,
    },
  },
  {
    id: 'high-contrast-mono',
    name: 'High Contrast Mono',
    category: 'creative',
    description: 'Stark Ansel-inspired deep blacks and crisp bright whites.',
    grade: {
      adjustments: { contrast: 46, sharpness: 24, highlights: 18, shadows: -24 },
      monochrome: 100,
      grain: 18,
    },
  },
  {
    id: 'warm-portrait',
    name: 'Warm Portrait',
    category: 'creative',
    description: 'Soft golden skin warmth with gentle shadow recovery.',
    grade: {
      adjustments: { exposure: 6, temperature: 16, tint: 8, shadows: 18, highlights: -8, saturation: 6 },
      glow: 14,
      splitToneHighlights: [14, 8, -4],
    },
  },
  {
    id: 'cold-winter',
    name: 'Cold Winter',
    category: 'creative',
    description: 'Crisp arctic blue cast with icy bright highlights.',
    grade: {
      adjustments: { exposure: 6, contrast: 12, temperature: -34, tint: -6, saturation: -14 },
      splitToneShadows: [-16, 4, 24],
      splitToneHighlights: [-6, 6, 18],
    },
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    category: 'creative',
    description: 'Rich coral-amber twilight gradient warmth.',
    grade: {
      adjustments: { contrast: 14, temperature: 32, tint: 22, saturation: 22, shadows: -6 },
      splitToneShadows: [14, -4, 18],
      splitToneHighlights: [28, 10, -8],
      glow: 22,
    },
  },
];

export function getFilterPresetById(id: string | null): FilterPreset | undefined {
  if (!id) return undefined;
  return FILTER_PRESETS.find((f) => f.id === id);
}

/**
 * Combines base image adjustments with up to two blended filter presets
 * and extra user grain/fade/vignette controls into a unified effective grade.
 */
export function resolveCombinedGrade(
  baseAdjustments: ImageAdjustments,
  filterState: ActiveFilterState
): {
  adjustments: ImageAdjustments;
  fadedBlacks: number;
  splitToneShadows: [number, number, number];
  splitToneHighlights: [number, number, number];
  grain: number;
  sepia: number;
  monochrome: number;
  glow: number;
  negative: number;
} {
  const effectiveAdj: ImageAdjustments = { ...baseAdjustments };
  let fadedBlacks = 0;
  const splitToneShadows: [number, number, number] = [0, 0, 0];
  const splitToneHighlights: [number, number, number] = [0, 0, 0];
  let grain = 0;
  let sepia = 0;
  let monochrome = 0;
  let glow = 0;
  let negative = 0;

  const applyLayer = (presetId: string | null, intensityPct: number) => {
    const preset = getFilterPresetById(presetId);
    if (!preset || intensityPct <= 0) return;
    const weight = Math.max(0, Math.min(1, intensityPct / 100));
    const g = preset.grade;

    if (g.adjustments) {
      for (const key of Object.keys(g.adjustments) as (keyof ImageAdjustments)[]) {
        const val = g.adjustments[key];
        if (typeof val === 'number') {
          if (key === 'gamma') {
            effectiveAdj.gamma += (val - 1) * weight;
          } else {
            effectiveAdj[key] += val * weight;
          }
        }
      }
    }

    if (g.fadedBlacks) fadedBlacks += g.fadedBlacks * weight;
    if (g.splitToneShadows) {
      splitToneShadows[0] += g.splitToneShadows[0] * weight;
      splitToneShadows[1] += g.splitToneShadows[1] * weight;
      splitToneShadows[2] += g.splitToneShadows[2] * weight;
    }
    if (g.splitToneHighlights) {
      splitToneHighlights[0] += g.splitToneHighlights[0] * weight;
      splitToneHighlights[1] += g.splitToneHighlights[1] * weight;
      splitToneHighlights[2] += g.splitToneHighlights[2] * weight;
    }
    if (g.grain) grain += g.grain * weight;
    if (g.sepia) sepia += g.sepia * weight;
    if (g.monochrome) monochrome += g.monochrome * weight;
    if (g.glow) glow += g.glow * weight;
    if (g.negative) negative += g.negative * weight;
  };

  applyLayer(filterState.filterId, filterState.intensity);
  applyLayer(filterState.secondaryFilterId, filterState.secondaryIntensity);

  grain = Math.min(100, grain + filterState.extraGrain);
  fadedBlacks = Math.min(50, fadedBlacks + filterState.extraFade * 0.42);
  effectiveAdj.vignette = Math.min(100, effectiveAdj.vignette + filterState.extraVignette);

  return {
    adjustments: effectiveAdj,
    fadedBlacks,
    splitToneShadows,
    splitToneHighlights,
    grain,
    sepia: Math.min(100, sepia),
    monochrome: Math.min(100, monochrome),
    glow: Math.min(100, glow),
    negative: Math.min(100, negative),
  };
}

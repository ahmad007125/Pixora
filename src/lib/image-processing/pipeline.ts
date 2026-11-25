import { ActiveFilterState } from '../../types/filters';
import { ExportFormat, ImageAdjustments, TransformState } from '../../types/image';
import { resolveCombinedGrade } from '../filters/presets';

export interface RenderOptions {
  /** Max output edge during live preview for high-FPS responsiveness; null for full-res export */
  maxDimension?: number | null;
  /** Skip crop during interactive crop overlay editing so user sees full transformed frame */
  ignoreCrop?: boolean;
  /** Skip adjustments & filters for instant "Before" comparison */
  originalOnly?: boolean;
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

/**
 * Applies 3x3 unsharp-mask convolution kernel when sharpness > 0.
 */
function applySharpness(data: Uint8ClampedArray, width: number, height: number, amount: number): void {
  const strength = (amount / 100) * 1.4;
  if (strength <= 0.01) return;

  const copy = new Uint8ClampedArray(data);
  const stride = width * 4;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * stride + x * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const neighbors =
          copy[idx - 4 + c] +
          copy[idx + 4 + c] +
          copy[idx - stride + c] +
          copy[idx + stride + c];
        const detail = center * 4 - neighbors;
        data[idx + c] = clampByte(center + detail * strength * 0.35);
      }
    }
  }
}

/**
 * Deterministic fast hash for film grain so frames don't strobe between renders.
 */
function grainNoise(x: number, y: number): number {
  let n = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) & 0xff) / 255 - 0.5;
}

/**
 * Builds an RGB hue-rotation matrix using standard luminance-preserving coefficients.
 */
function buildHueMatrix(degrees: number): [number, number, number, number, number, number, number, number, number] {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const lumR = 0.213;
  const lumG = 0.715;
  const lumB = 0.072;

  return [
    lumR + cos * (1 - lumR) + sin * -lumR,
    lumG + cos * -lumG + sin * -lumG,
    lumB + cos * -lumB + sin * (1 - lumB),

    lumR + cos * -lumR + sin * 0.143,
    lumG + cos * (1 - lumG) + sin * 0.14,
    lumB + cos * -lumB + sin * -0.283,

    lumR + cos * -lumR + sin * -(1 - lumR),
    lumG + cos * -lumG + sin * lumG,
    lumB + cos * (1 - lumB) + sin * lumB,
  ];
}

/**
 * Renders the source image through transforms, pixel-level color/tone pipeline,
 * filter grading, blur, sharpness, glow, and vignette onto a destination canvas.
 */
export function renderProcessedCanvas(
  source: HTMLImageElement | HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  adjustments: ImageAdjustments,
  transform: TransformState,
  filterState: ActiveFilterState,
  options: RenderOptions = {}
): { width: number; height: number } {
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height;
  if (!srcW || !srcH) return { width: 0, height: 0 };

  // Step 1: Compute transformed dimensions (rotation 90/270 swaps W/H)
  const swapAxes = transform.rotate90 === 90 || transform.rotate90 === 270;
  const rotatedW = swapAxes ? srcH : srcW;
  const rotatedH = swapAxes ? srcW : srcH;

  // Compute resize or preview scale
  let outFullW = rotatedW;
  let outFullH = rotatedH;
  if (!options.ignoreCrop) {
    outFullW = Math.max(1, Math.round(rotatedW * transform.crop.width));
    outFullH = Math.max(1, Math.round(rotatedH * transform.crop.height));
  }

  if (transform.resizeWidth && transform.resizeHeight && !options.ignoreCrop) {
    outFullW = Math.max(1, transform.resizeWidth);
    outFullH = Math.max(1, transform.resizeHeight);
  }

  let scale = 1;
  if (options.maxDimension && Math.max(outFullW, outFullH) > options.maxDimension) {
    scale = options.maxDimension / Math.max(outFullW, outFullH);
  }

  const canvasW = Math.max(1, Math.round(outFullW * scale));
  const canvasH = Math.max(1, Math.round(outFullH * scale));

  // Intermediate transformed stage (before crop) at matching scale
  const stageW = Math.max(1, Math.round(rotatedW * scale));
  const stageH = Math.max(1, Math.round(rotatedH * scale));

  const stageCanvas = document.createElement('canvas');
  stageCanvas.width = stageW;
  stageCanvas.height = stageH;
  const stageCtx = stageCanvas.getContext('2d', { willReadFrequently: true });
  if (!stageCtx) return { width: canvasW, height: canvasH };

  // Draw source with rotate90, straighten, and flipH/V
  stageCtx.save();
  stageCtx.translate(stageW / 2, stageH / 2);

  const totalAngleRad = ((transform.rotate90 + transform.straighten) * Math.PI) / 180;
  stageCtx.rotate(totalAngleRad);

  // Auto-zoom slightly when straightening so corners stay filled
  if (Math.abs(transform.straighten) > 0.05) {
    const absRad = (Math.abs(transform.straighten) * Math.PI) / 180;
    const straightenScale = Math.cos(absRad) + Math.sin(absRad) * Math.max(stageW / stageH, stageH / stageW);
    stageCtx.scale(straightenScale, straightenScale);
  }

  stageCtx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);

  const drawW = srcW * scale;
  const drawH = srcH * scale;

  const grade = options.originalOnly
    ? null
    : resolveCombinedGrade(adjustments, filterState);

  // Use native canvas blur filter during draw when blur > 0 for smooth hardware-accelerated Gaussian blur
  if (grade && grade.adjustments.blur > 0.5) {
    const blurPx = (grade.adjustments.blur / 100) * 14 * Math.max(0.4, scale);
    stageCtx.filter = `blur(${blurPx.toFixed(2)}px)`;
  }

  stageCtx.drawImage(source, -drawW / 2, -drawH / 2, drawW, drawH);
  stageCtx.restore();

  // Step 2: Crop stage -> targetCanvas
  targetCanvas.width = canvasW;
  targetCanvas.height = canvasH;
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { width: canvasW, height: canvasH };

  ctx.clearRect(0, 0, canvasW, canvasH);
  if (options.ignoreCrop) {
    ctx.drawImage(stageCanvas, 0, 0, canvasW, canvasH);
  } else {
    const sx = transform.crop.x * stageW;
    const sy = transform.crop.y * stageH;
    const sw = Math.max(1, transform.crop.width * stageW);
    const sh = Math.max(1, transform.crop.height * stageH);
    ctx.drawImage(stageCanvas, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
  }

  if (options.originalOnly || !grade) {
    return { width: canvasW, height: canvasH };
  }

  // Step 3: Per-pixel color, tone, split-toning, sepia, mono, fade, grain, negative
  const adj = grade.adjustments;
  const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
  const data = imgData.data;

  const exposureMult = Math.pow(2, adj.exposure / 55);
  const brightnessOffset = (adj.brightness / 100) * 110;
  const contrastFactor = Math.pow((adj.contrast + 100) / 100, 1.8);
  const satMult = Math.max(0, 1 + adj.saturation / 100);
  const tempShift = (adj.temperature / 100) * 48;
  const tintShift = (adj.tint / 100) * 38;
  const highlightsAdj = (adj.highlights / 100) * 70;
  const shadowsAdj = (adj.shadows / 100) * 70;
  const gammaInv = 1 / Math.max(0.3, Math.min(2.5, adj.gamma));
  const useGamma = Math.abs(adj.gamma - 1) > 0.01;
  const useHue = Math.abs(adj.hue) > 0.5;
  const hueM = useHue ? buildHueMatrix(adj.hue) : null;

  const fadeFloor = grade.fadedBlacks;
  const fadeRange = (255 - fadeFloor) / 255;
  const shadowTone = grade.splitToneShadows;
  const highlightTone = grade.splitToneHighlights;
  const hasSplitShadow =
    Math.abs(shadowTone[0]) > 0.2 || Math.abs(shadowTone[1]) > 0.2 || Math.abs(shadowTone[2]) > 0.2;
  const hasSplitHigh =
    Math.abs(highlightTone[0]) > 0.2 || Math.abs(highlightTone[1]) > 0.2 || Math.abs(highlightTone[2]) > 0.2;

  const monoMix = grade.monochrome / 100;
  const sepiaMix = grade.sepia / 100;
  const negMix = grade.negative / 100;
  const grainStrength = grade.grain * 0.72;

  for (let y = 0; y < canvasH; y++) {
    const rowOffset = y * canvasW * 4;
    for (let x = 0; x < canvasW; x++) {
      const i = rowOffset + x * 4;
      if (data[i + 3] === 0) continue;

      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Exposure
      if (adj.exposure !== 0) {
        r *= exposureMult;
        g *= exposureMult;
        b *= exposureMult;
      }

      // Brightness
      if (brightnessOffset !== 0) {
        r += brightnessOffset;
        g += brightnessOffset;
        b += brightnessOffset;
      }

      // Temperature (warm R+/B-) & Tint (G-/R+B+)
      if (tempShift !== 0 || tintShift !== 0) {
        r += tempShift + tintShift * 0.35;
        g -= tintShift * 0.7;
        b -= tempShift - tintShift * 0.35;
      }

      // Highlights & Shadows weighted by pixel luminance
      if (highlightsAdj !== 0 || shadowsAdj !== 0) {
        const lumNorm = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const clampedLum = lumNorm < 0 ? 0 : lumNorm > 1 ? 1 : lumNorm;
        const shadowWeight = Math.pow(1 - clampedLum, 2);
        const highlightWeight = Math.pow(clampedLum, 2);
        const delta = shadowsAdj * shadowWeight + highlightsAdj * highlightWeight;
        r += delta;
        g += delta;
        b += delta;
      }

      // Contrast around mid-gray
      if (adj.contrast !== 0) {
        r = (r - 127.5) * contrastFactor + 127.5;
        g = (g - 127.5) * contrastFactor + 127.5;
        b = (b - 127.5) * contrastFactor + 127.5;
      }

      // Gamma power curve
      if (useGamma) {
        r = 255 * Math.pow(Math.max(0, Math.min(1, r / 255)), gammaInv);
        g = 255 * Math.pow(Math.max(0, Math.min(1, g / 255)), gammaInv);
        b = 255 * Math.pow(Math.max(0, Math.min(1, b / 255)), gammaInv);
      }

      // Hue rotation
      if (hueM) {
        const nr = r * hueM[0] + g * hueM[1] + b * hueM[2];
        const ng = r * hueM[3] + g * hueM[4] + b * hueM[5];
        const nb = r * hueM[6] + g * hueM[7] + b * hueM[8];
        r = nr;
        g = ng;
        b = nb;
      }

      // Saturation
      if (adj.saturation !== 0) {
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = gray + (r - gray) * satMult;
        g = gray + (g - gray) * satMult;
        b = gray + (b - gray) * satMult;
      }

      // Split toning
      if (hasSplitShadow || hasSplitHigh) {
        const lum = Math.max(0, Math.min(1, (0.299 * r + 0.587 * g + 0.114 * b) / 255));
        if (hasSplitShadow) {
          const sw = 1 - lum;
          r += shadowTone[0] * sw;
          g += shadowTone[1] * sw;
          b += shadowTone[2] * sw;
        }
        if (hasSplitHigh) {
          r += highlightTone[0] * lum;
          g += highlightTone[1] * lum;
          b += highlightTone[2] * lum;
        }
      }

      // Monochrome mix
      if (monoMix > 0) {
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        r = r + (luma - r) * monoMix;
        g = g + (luma - g) * monoMix;
        b = b + (luma - b) * monoMix;
      }

      // Sepia mix
      if (sepiaMix > 0) {
        const sr = r * 0.393 + g * 0.769 + b * 0.189;
        const sg = r * 0.349 + g * 0.686 + b * 0.168;
        const sb = r * 0.272 + g * 0.534 + b * 0.131;
        r = r + (sr - r) * sepiaMix;
        g = g + (sg - g) * sepiaMix;
        b = b + (sb - b) * sepiaMix;
      }

      // Faded blacks matte lift
      if (fadeFloor > 0.2) {
        r = fadeFloor + Math.max(0, r) * fadeRange;
        g = fadeFloor + Math.max(0, g) * fadeRange;
        b = fadeFloor + Math.max(0, b) * fadeRange;
      }

      // Film negative inversion
      if (negMix > 0) {
        r = r + (255 - r - r) * negMix;
        g = g + (255 - g - g) * negMix;
        b = b + (255 - b - b) * negMix;
      }

      // Film grain
      if (grainStrength > 0.2) {
        const n = grainNoise(x, y) * grainStrength;
        r += n;
        g += n;
        b += n;
      }

      data[i] = clampByte(r);
      data[i + 1] = clampByte(g);
      data[i + 2] = clampByte(b);
    }
  }

  // Sharpness convolution
  if (adj.sharpness > 0.5) {
    applySharpness(data, canvasW, canvasH, adj.sharpness);
  }

  ctx.putImageData(imgData, 0, 0);

  // Step 4: Soft dreamy glow bloom overlay
  if (grade.glow > 1) {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = Math.max(1, Math.round(canvasW * 0.35));
    glowCanvas.height = Math.max(1, Math.round(canvasH * 0.35));
    const gCtx = glowCanvas.getContext('2d');
    if (gCtx) {
      gCtx.filter = `blur(${Math.max(4, Math.round(canvasW * 0.014))}px)`;
      gCtx.drawImage(targetCanvas, 0, 0, glowCanvas.width, glowCanvas.height);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.min(0.55, (grade.glow / 100) * 0.55);
      ctx.drawImage(glowCanvas, 0, 0, canvasW, canvasH);
      ctx.restore();
    }
  }

  // Step 5: Radial Vignette
  if (adj.vignette > 0.5) {
    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const outerRadius = Math.sqrt(cx * cx + cy * cy);
    const innerRadius = outerRadius * (0.48 - (adj.vignette / 100) * 0.18);
    const gradient = ctx.createRadialGradient(cx, cy, Math.max(1, innerRadius), cx, cy, outerRadius);
    const alpha = Math.min(0.85, (adj.vignette / 100) * 0.78);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.65, `rgba(0,0,0,${(alpha * 0.35).toFixed(3)})`);
    gradient.addColorStop(1, `rgba(0,0,0,${alpha.toFixed(3)})`);
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  }

  return { width: canvasW, height: canvasH };
}

/**
 * Exports a processed full-resolution image to a downloadable Blob.
 */
export async function exportProcessedImage(
  source: HTMLImageElement,
  adjustments: ImageAdjustments,
  transform: TransformState,
  filterState: ActiveFilterState,
  format: ExportFormat,
  qualityPct: number
): Promise<Blob> {
  const exportCanvas = document.createElement('canvas');
  renderProcessedCanvas(source, exportCanvas, adjustments, transform, filterState, {
    maxDimension: null,
    ignoreCrop: false,
    originalOnly: false,
  });

  // Fill white matte when exporting JPEG (since JPEG has no alpha channel)
  if (format === 'image/jpeg') {
    const matte = document.createElement('canvas');
    matte.width = exportCanvas.width;
    matte.height = exportCanvas.height;
    const mCtx = matte.getContext('2d');
    if (mCtx) {
      mCtx.fillStyle = '#FFFFFF';
      mCtx.fillRect(0, 0, matte.width, matte.height);
      mCtx.drawImage(exportCanvas, 0, 0);
      return new Promise((resolve, reject) => {
        matte.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode JPEG image.'))),
          'image/jpeg',
          Math.max(0.05, Math.min(1, qualityPct / 100))
        );
      });
    }
  }

  return new Promise((resolve, reject) => {
    exportCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`Failed to encode ${format} image.`))),
      format,
      Math.max(0.05, Math.min(1, qualityPct / 100))
    );
  });
}

/**
 * Generates a small thumbnail DataURL for IndexedDB project previews or filter cards.
 */
export function renderFilterThumbnail(
  source: HTMLImageElement,
  filterId: string | null,
  width = 160
): string {
  const aspect = (source.naturalHeight || 1) / (source.naturalWidth || 1);
  const height = Math.max(80, Math.round(width * aspect));
  const canvas = document.createElement('canvas');
  const dummyTransform: TransformState = {
    rotate90: 0,
    straighten: 0,
    flipH: false,
    flipV: false,
    crop: { x: 0, y: 0, width: 1, height: 1 },
    aspectRatio: 'original',
    resizeWidth: width,
    resizeHeight: height,
    lockResizeAspect: true,
  };
  const baseAdj: ImageAdjustments = {
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
    gamma: 1,
  };
  renderProcessedCanvas(
    source,
    canvas,
    baseAdj,
    dummyTransform,
    {
      filterId,
      intensity: 100,
      extraGrain: 0,
      extraFade: 0,
      extraVignette: 0,
      secondaryFilterId: null,
      secondaryIntensity: 0,
    },
    { maxDimension: width }
  );
  return canvas.toDataURL('image/jpeg', 0.82);
}

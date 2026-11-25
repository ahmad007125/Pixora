import JSZip from 'jszip';
import { loadImageElement } from '../file-handling/imageLoader';
import { extensionForMime, stripExtension } from '../utilities/format';

export type CompressionFormat = 'image/jpeg' | 'image/webp' | 'image/png' | 'image/avif';

export interface CompressionOptions {
  format: CompressionFormat;
  quality: number; // 1..100
  maxWidth: number | null;
  maxHeight: number | null;
  maintainAspectRatio: boolean;
  targetSizeKb: number | null;
}

export interface CompressedResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
  appliedQuality: number;
  warning?: string;
}

export const COMPRESSION_PRESETS: {
  id: string;
  label: string;
  quality: number;
  description: string;
}[] = [
  { id: 'high', label: 'High Quality', quality: 92, description: 'Near-lossless visual fidelity' },
  { id: 'balanced', label: 'Balanced', quality: 78, description: 'Ideal for web & sharing' },
  { id: 'small', label: 'Small Size', quality: 56, description: 'Compact file size' },
  { id: 'max', label: 'Maximum Compression', quality: 34, description: 'Smallest possible payload' },
];

function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: CompressionFormat,
  quality01: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Browser encoder failed for ${format}.`));
          return;
        }
        resolve(blob);
      },
      format,
      Math.max(0.01, Math.min(1, quality01))
    );
  });
}

export async function compressImageSource(
  sourceUrl: string,
  options: CompressionOptions
): Promise<CompressedResult> {
  const img = await loadImageElement(sourceUrl);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  let outW = srcW;
  let outH = srcH;

  if (options.maxWidth || options.maxHeight) {
    if (options.maintainAspectRatio) {
      const scaleW = options.maxWidth ? options.maxWidth / srcW : 1;
      const scaleH = options.maxHeight ? options.maxHeight / srcH : 1;
      const scale = Math.min(1, scaleW, scaleH);
      outW = Math.max(1, Math.round(srcW * scale));
      outH = Math.max(1, Math.round(srcH * scale));
    } else {
      outW = options.maxWidth ? Math.max(1, Math.min(srcW, options.maxWidth)) : srcW;
      outH = options.maxHeight ? Math.max(1, Math.min(srcH, options.maxHeight)) : srcH;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize 2D compression canvas.');

  if (options.format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outW, outH);
  }
  ctx.drawImage(img, 0, 0, outW, outH);

  let warning: string | undefined;
  let appliedQuality = options.quality;
  let blob = await encodeCanvas(canvas, options.format, appliedQuality / 100);

  // Check if browser silently fell back to PNG when AVIF isn't supported
  if (options.format === 'image/avif' && blob.type !== 'image/avif') {
    throw new Error(
      'AVIF encoding is not supported by this browser. Switch output format to WEBP or JPEG.'
    );
  }

  if (options.format === 'image/png' && options.targetSizeKb) {
    warning =
      'PNG uses lossless compression, so quality/target-KB sliders cannot reduce PNG bytes without resizing dimensions or switching to WEBP/JPEG.';
  } else if (options.targetSizeKb && options.targetSizeKb > 0 && options.format !== 'image/png') {
    const targetBytes = options.targetSizeKb * 1024;
    if (blob.size > targetBytes) {
      let low = 0.05;
      let high = Math.max(0.08, appliedQuality / 100);
      let bestBlob = blob;
      let bestQ = appliedQuality;

      for (let step = 0; step < 7; step++) {
        const mid = (low + high) / 2;
        const candidate = await encodeCanvas(canvas, options.format, mid);
        if (candidate.size <= targetBytes) {
          bestBlob = candidate;
          bestQ = Math.round(mid * 100);
          low = mid;
        } else {
          high = mid;
        }
      }

      if (bestBlob.size > targetBytes) {
        const minBlob = await encodeCanvas(canvas, options.format, 0.04);
        if (minBlob.size < bestBlob.size) {
          bestBlob = minBlob;
          bestQ = 4;
        }
        if (bestBlob.size > targetBytes) {
          warning = `Reached lowest quality (${bestQ}%) at ${Math.round(bestBlob.size / 1024)} KB. Lower dimensions to shrink further.`;
        }
      }
      blob = bestBlob;
      appliedQuality = bestQ;
    }
  }

  const url = URL.createObjectURL(blob);
  return {
    blob,
    url,
    width: outW,
    height: outH,
    sizeBytes: blob.size,
    appliedQuality,
    warning,
  };
}

export async function bundleCompressedZip(
  items: { originalName: string; blob: Blob; format: CompressionFormat }[]
): Promise<Blob> {
  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  for (const item of items) {
    const base = stripExtension(item.originalName);
    const ext = extensionForMime(item.format);
    let candidate = `${base}-compressed.${ext}`;
    const count = usedNames.get(candidate) ?? 0;
    if (count > 0) {
      candidate = `${base}-compressed-${count + 1}.${ext}`;
    }
    usedNames.set(`${base}-compressed.${ext}`, count + 1);
    zip.file(candidate, item.blob);
  }

  return zip.generateAsync({ type: 'blob' });
}

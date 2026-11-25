export interface BgRemovalProgress {
  stage: 'loading-model' | 'processing' | 'finalizing';
  progressPct: number;
  detail: string;
}

export type BgReplacementConfig =
  | { type: 'transparent' }
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; angleDeg: number }
  | { type: 'image'; imageElement: HTMLImageElement };

/**
 * Runs client-side AI background segmentation via @imgly/background-removal (ONNX/WASM).
 * Dynamically imports the runtime so it only loads when the user invokes Background Remover.
 */
export async function runClientBackgroundRemoval(
  inputSource: File | Blob | string,
  onProgress?: (info: BgRemovalProgress) => void
): Promise<Blob> {
  onProgress?.({
    stage: 'loading-model',
    progressPct: 8,
    detail: 'Initializing local WebAssembly segmentation engine…',
  });

  const { removeBackground } = await import('@imgly/background-removal');

  let inputBlob: Blob;
  if (typeof inputSource === 'string') {
    const resp = await fetch(inputSource);
    if (!resp.ok) {
      throw new Error('Could not read source image for background removal.');
    }
    inputBlob = await resp.blob();
  } else {
    inputBlob = inputSource;
  }

  const resultBlob = await removeBackground(inputBlob, {
    model: 'isnet_quint8',
    output: {
      format: 'image/png',
      quality: 1,
    },
    progress: (key: string, current: number, total: number) => {
      const ratio = total > 0 ? Math.min(1, current / total) : 0;
      const pct = Math.max(10, Math.min(98, Math.round(ratio * 100)));
      const isFetch = key.toLowerCase().includes('fetch');
      onProgress?.({
        stage: isFetch ? 'loading-model' : 'processing',
        progressPct: pct,
        detail: isFetch
          ? `Downloading local AI model (${pct}%)…`
          : `Segmenting foreground subject (${pct}%)…`,
      });
    },
  });

  onProgress?.({
    stage: 'finalizing',
    progressPct: 100,
    detail: 'Transparent PNG cutout ready.',
  });

  return resultBlob;
}

/**
 * Composites a transparent cutout image over transparent, solid color, gradient, or custom photo background.
 */
export function renderCutoutComposite(
  foreground: HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  replacement: BgReplacementConfig,
  edgeFeatherPx = 0
): void {
  const width = foreground.naturalWidth || foreground.width;
  const height = foreground.naturalHeight || foreground.height;
  if (!width || !height) return;

  targetCanvas.width = width;
  targetCanvas.height = height;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  if (replacement.type === 'solid') {
    ctx.fillStyle = replacement.color;
    ctx.fillRect(0, 0, width, height);
  } else if (replacement.type === 'gradient') {
    const rad = ((replacement.angleDeg ?? 135) * Math.PI) / 180;
    const dx = Math.cos(rad) * width * 0.5;
    const dy = Math.sin(rad) * height * 0.5;
    const grad = ctx.createLinearGradient(
      width / 2 - dx,
      height / 2 - dy,
      width / 2 + dx,
      height / 2 + dy
    );
    grad.addColorStop(0, replacement.from);
    grad.addColorStop(1, replacement.to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (replacement.type === 'image') {
    const bg = replacement.imageElement;
    const bgW = bg.naturalWidth || bg.width;
    const bgH = bg.naturalHeight || bg.height;
    const scale = Math.max(width / bgW, height / bgH);
    const drawW = bgW * scale;
    const drawH = bgH * scale;
    ctx.drawImage(bg, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
  }

  ctx.save();
  if (edgeFeatherPx > 0) {
    ctx.filter = `blur(${(edgeFeatherPx * 0.35).toFixed(2)}px)`;
  }
  ctx.drawImage(foreground, 0, 0, width, height);
  ctx.restore();
}

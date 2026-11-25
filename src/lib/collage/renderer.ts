import {
  COLLAGE_CANVAS_PRESETS,
  CollageStickerLayer,
  CollageState,
} from '../../types/collage';
import { loadImageElement } from '../file-handling/imageLoader';
import { COLLAGE_GRADIENTS, getCollageLayoutById } from './layouts';

export function resolveCollageDimensions(state: CollageState): { width: number; height: number } {
  if (state.canvasSizeId === 'custom') {
    return {
      width: Math.max(200, Math.min(4096, Math.round(state.customWidth || 1080))),
      height: Math.max(200, Math.min(4096, Math.round(state.customHeight || 1080))),
    };
  }
  const preset = COLLAGE_CANVAS_PRESETS.find((p) => p.id === state.canvasSizeId);
  return preset ? { width: preset.width, height: preset.height } : { width: 1080, height: 1080 };
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawStickerOnCanvas(
  ctx: CanvasRenderingContext2D,
  sticker: CollageStickerLayer,
  canvasW: number,
  canvasH: number
): void {
  const scaleFactor = canvasW / 1080;
  const cx = sticker.x * canvasW;
  const cy = sticker.y * canvasH;
  const sz = sticker.size * scaleFactor;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((sticker.rotation * Math.PI) / 180);
  ctx.fillStyle = sticker.color;
  ctx.strokeStyle = sticker.color;

  switch (sticker.kind) {
    case 'star-burst': {
      const spikes = 12;
      const outer = sz * 0.5;
      const inner = sz * 0.28;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? outer : inner;
        const ang = (i * Math.PI) / spikes;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'spark-diamond': {
      const r = sz * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.quadraticCurveTo(0, 0, 0, r);
      ctx.quadraticCurveTo(0, 0, -r, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'tape-strip': {
      ctx.globalAlpha = 0.72;
      ctx.fillRect(-sz * 0.65, -sz * 0.22, sz * 1.3, sz * 0.44);
      break;
    }
    case 'circle-stamp': {
      ctx.lineWidth = Math.max(2, sz * 0.06);
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.34, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, sz * 0.025);
      ctx.stroke();
      break;
    }
    case 'corner-frame': {
      const half = sz * 0.45;
      const arm = sz * 0.24;
      ctx.lineWidth = Math.max(2, sz * 0.07);
      ctx.beginPath();
      ctx.moveTo(-half, -half + arm);
      ctx.lineTo(-half, -half);
      ctx.lineTo(-half + arm, -half);
      ctx.moveTo(half - arm, -half);
      ctx.lineTo(half, -half);
      ctx.lineTo(half, -half + arm);
      ctx.moveTo(-half, half - arm);
      ctx.lineTo(-half, half);
      ctx.lineTo(-half + arm, half);
      ctx.moveTo(half - arm, half);
      ctx.lineTo(half, half);
      ctx.lineTo(half, half - arm);
      ctx.stroke();
      break;
    }
    case 'film-strip': {
      const w = sz * 1.1;
      const h = sz * 0.6;
      ctx.lineWidth = Math.max(2, sz * 0.05);
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      const holeW = w * 0.12;
      const holeH = h * 0.14;
      for (let i = 0; i < 4; i++) {
        const hx = -w / 2 + w * 0.1 + i * w * 0.22;
        ctx.fillRect(hx, -h / 2 + h * 0.1, holeW, holeH);
        ctx.fillRect(hx, h / 2 - h * 0.1 - holeH, holeW, holeH);
      }
      break;
    }
  }

  ctx.restore();
}

/**
 * Renders the full CollageState onto a high-resolution offscreen canvas and
 * encodes it into a downloadable image Blob.
 */
export async function exportCollageToBlob(
  state: CollageState,
  format: 'image/png' | 'image/jpeg' | 'image/webp',
  qualityPct: number
): Promise<Blob> {
  const { width, height } = resolveCollageDimensions(state);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  // 1. Background
  if (state.backgroundType === 'gradient') {
    const gradDef = COLLAGE_GRADIENTS.find((g) => g.css === state.backgroundGradient);
    const stops = gradDef?.stops ?? ['#F8FAFD', '#E8F0FE'];
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, stops[0]);
    grad.addColorStop(1, stops[1]);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = state.backgroundColor || '#FFFFFF';
  }
  ctx.fillRect(0, 0, width, height);

  // 2. Layout slots
  const layout = getCollageLayoutById(state.templateId);
  const scaleFactor = width / 1080;
  const margin = state.outerMargin * scaleFactor;
  const gap = state.spacing * scaleFactor;
  const radius = state.borderRadius * scaleFactor;
  const stageW = Math.max(40, width - margin * 2);
  const stageH = Math.max(40, height - margin * 2);

  // Preload all assigned images in parallel
  const loadedEntries = await Promise.all(
    layout.slots.map(async (rectDef) => {
      const slotContent = state.slots.find((s) => s.slotId === rectDef.id);
      if (!slotContent?.imageUrl) return { rectDef, slotContent, img: null };
      try {
        const img = await loadImageElement(slotContent.imageUrl);
        return { rectDef, slotContent, img };
      } catch {
        return { rectDef, slotContent, img: null };
      }
    })
  );

  const sortedEntries = [...loadedEntries].sort(
    (a, b) => (a.rectDef.zIndex ?? 0) - (b.rectDef.zIndex ?? 0)
  );

  for (const entry of sortedEntries) {
    const rect = state.customSlotRects[entry.rectDef.id] ?? entry.rectDef;
    const rawX = margin + rect.x * stageW + gap / 2;
    const rawY = margin + rect.y * stageH + gap / 2;
    const rawW = Math.max(10, rect.w * stageW - gap);
    const rawH = Math.max(10, rect.h * stageH - gap);

    ctx.save();
    const cx = rawX + rawW / 2;
    const cy = rawY + rawH / 2;
    ctx.translate(cx, cy);
    if (rect.rotation) {
      ctx.rotate((rect.rotation * Math.PI) / 180);
    }

    // Shadow
    if (state.shadowIntensity > 0) {
      ctx.shadowColor = `rgba(15, 23, 42, ${((state.shadowIntensity / 100) * 0.28).toFixed(3)})`;
      ctx.shadowBlur = (state.shadowIntensity / 100) * 32 * scaleFactor;
      ctx.shadowOffsetY = (state.shadowIntensity / 100) * 10 * scaleFactor;
    }

    const x = -rawW / 2;
    const y = -rawH / 2;

    if (rect.polaroidFrame) {
      drawRoundedRectPath(ctx, x, y, rawW, rawH, Math.min(8 * scaleFactor, radius + 4));
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.shadowColor = 'transparent';
    }

    const padSide = rect.polaroidFrame ? rawW * 0.055 : 0;
    const padTop = rect.polaroidFrame ? rawW * 0.055 : 0;
    const padBottom = rect.polaroidFrame ? rawH * 0.16 : 0;

    const innerX = x + padSide;
    const innerY = y + padTop;
    const innerW = Math.max(8, rawW - padSide * 2);
    const innerH = Math.max(8, rawH - padTop - padBottom);

    ctx.save();
    drawRoundedRectPath(ctx, innerX, innerY, innerW, innerH, rect.polaroidFrame ? 2 : radius);
    ctx.clip();

    if (entry.img && entry.slotContent) {
      const img = entry.img;
      const imgW = img.naturalWidth || img.width;
      const imgH = img.naturalHeight || img.height;
      const coverScale = Math.max(innerW / imgW, innerH / imgH) * (entry.slotContent.zoom || 1);
      const drawW = imgW * coverScale;
      const drawH = imgH * coverScale;
      const maxOffsetX = Math.max(0, (drawW - innerW) / 2);
      const maxOffsetY = Math.max(0, (drawH - innerH) / 2);
      const dx = innerX + (innerW - drawW) / 2 + (entry.slotContent.offsetX || 0) * maxOffsetX;
      const dy = innerY + (innerH - drawH) / 2 + (entry.slotContent.offsetY || 0) * maxOffsetY;
      ctx.drawImage(img, dx, dy, drawW, drawH);
    } else {
      ctx.fillStyle = '#E8EAED';
      ctx.fillRect(innerX, innerY, innerW, innerH);
    }
    ctx.restore();
    ctx.restore();
  }

  // 3. Stickers
  for (const sticker of state.stickers) {
    drawStickerOnCanvas(ctx, sticker, width, height);
  }

  // 4. Text layers
  for (const layer of state.texts) {
    const px = layer.x * width;
    const py = layer.y * height;
    const fontSize = Math.round(layer.fontSize * scaleFactor);
    ctx.save();
    ctx.font = `${layer.fontWeight} ${fontSize}px "${layer.fontFamily}", sans-serif`;
    ctx.fillStyle = layer.color;
    ctx.textAlign = layer.align;
    ctx.textBaseline = 'middle';
    ctx.fillText(layer.text, px, py);
    ctx.restore();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to render collage file.'))),
      format,
      Math.max(0.1, Math.min(1, qualityPct / 100))
    );
  });
}

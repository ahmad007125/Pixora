import { FormatSupportInfo, LoadedImage } from '../../types/image';
import { createId } from '../utilities/format';

export const ACCEPTED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.tiff',
  '.tif',
  '.avif',
  '.svg',
];

export const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/x-ms-bmp',
  'image/tiff',
  'image/avif',
  'image/svg+xml',
]);

let cachedFormatSupport: FormatSupportInfo | null = null;

export function detectSupportedExportFormats(): FormatSupportInfo {
  if (cachedFormatSupport) return cachedFormatSupport;
  if (typeof document === 'undefined') {
    return { png: true, jpeg: true, webp: true, avif: false };
  }
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;

  const testMime = (mime: string): boolean => {
    try {
      const dataUrl = canvas.toDataURL(mime);
      return dataUrl.startsWith(`data:${mime}`);
    } catch {
      return false;
    }
  };

  cachedFormatSupport = {
    png: true,
    jpeg: true,
    webp: testMime('image/webp'),
    avif: testMime('image/avif'),
  };
  return cachedFormatSupport;
}

/**
 * Sanitizes SVG markup before converting to a Blob URL so no scripts or active
 * event handlers execute or taint rendering.
 */
export function sanitizeSvgText(svgText: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('The uploaded SVG file contains malformed XML markup.');
  }

  const forbiddenTags = ['script', 'foreignObject', 'iframe', 'object', 'embed'];
  for (const tag of forbiddenTags) {
    doc.querySelectorAll(tag).forEach((el) => el.remove());
  }

  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      } else if (
        (name === 'href' || name === 'xlink:href' || name === 'src') &&
        (value.startsWith('javascript:') || value.startsWith('data:text/html'))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });

  const svgRoot = doc.documentElement;
  if (!svgRoot.getAttribute('width') && !svgRoot.getAttribute('height')) {
    const viewBox = svgRoot.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        svgRoot.setAttribute('width', String(parts[2]));
        svgRoot.setAttribute('height', String(parts[3]));
      }
    } else {
      svgRoot.setAttribute('width', '1024');
      svgRoot.setAttribute('height', '1024');
    }
  }

  return new XMLSerializer().serializeToString(doc);
}

/**
 * Checks whether a GIF buffer contains multiple Graphic Control Extension blocks,
 * or whether a WEBP buffer contains the ANIM chunk.
 */
async function detectAnimation(file: File): Promise<boolean> {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (mime === 'image/gif' || name.endsWith('.gif')) {
    const buf = new Uint8Array(await file.slice(0, 262144).arrayBuffer());
    let gceCount = 0;
    for (let i = 0; i < buf.length - 2; i++) {
      if (buf[i] === 0x21 && buf[i + 1] === 0xf9 && buf[i + 2] === 0x04) {
        gceCount++;
        if (gceCount > 1) return true;
      }
    }
  }
  if (mime === 'image/webp' || name.endsWith('.webp')) {
    const text = new TextDecoder('ascii').decode(await file.slice(0, 256).arrayBuffer());
    if (text.includes('ANIM')) return true;
  }
  return false;
}

export function isSupportedFile(file: File): boolean {
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  return ACCEPTED_MIME_TYPES.has(file.type.toLowerCase()) || ACCEPTED_EXTENSIONS.includes(ext);
}

export async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This browser could not decode the selected image format.'));
    img.src = src;
  });
}

export async function loadImageFromFile(file: File): Promise<{
  image: LoadedImage;
  element: HTMLImageElement;
}> {
  if (!isSupportedFile(file)) {
    throw new Error(
      `Unsupported file format "${file.name}". Please upload JPG, PNG, WEBP, GIF, BMP, TIFF, AVIF, or SVG.`
    );
  }

  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  const isSvg = file.type === 'image/svg+xml' || ext === '.svg';
  const isTiff = file.type === 'image/tiff' || ext === '.tif' || ext === '.tiff';
  const isAvif = file.type === 'image/avif' || ext === '.avif';

  let blobForUrl: Blob = file;
  let warningMessage: string | undefined;

  if (isSvg) {
    const rawText = await file.text();
    const cleanSvg = sanitizeSvgText(rawText);
    blobForUrl = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
  }

  const isAnimated = await detectAnimation(file);
  if (isAnimated) {
    warningMessage =
      'Animated image detected. Editing and exporting will flatten the image to its first frame.';
  }

  const objectUrl = URL.createObjectURL(blobForUrl);

  try {
    const element = await loadImageElement(objectUrl);
    const width = element.naturalWidth || element.width || 1024;
    const height = element.naturalHeight || element.height || 1024;

    if (width === 0 || height === 0) {
      throw new Error('Decoded image has zero dimensions.');
    }

    return {
      image: {
        id: createId('img'),
        name: file.name,
        mimeType: file.type || (isSvg ? 'image/svg+xml' : 'image/png'),
        sizeBytes: file.size,
        width,
        height,
        objectUrl,
        isAnimated,
        warningMessage,
      },
      element,
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    if (isTiff) {
      throw new Error(
        'TIFF decoding is not natively supported by this browser. Try converting to PNG, JPG, or WEBP first.'
      );
    }
    if (isAvif) {
      throw new Error(
        'AVIF decoding is not supported in this browser version. Try PNG, JPG, or WEBP.'
      );
    }
    throw err instanceof Error
      ? err
      : new Error(`Failed to open "${file.name}". The file may be corrupted.`);
  }
}

export async function loadImageFromUrl(
  url: string,
  name = 'studio-photo.jpg'
): Promise<{
  image: LoadedImage;
  element: HTMLImageElement;
}> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load image asset (${response.status}).`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const element = await loadImageElement(objectUrl);
    return {
      image: {
        id: createId('img'),
        name,
        mimeType: blob.type || 'image/jpeg',
        sizeBytes: blob.size,
        width: element.naturalWidth || element.width,
        height: element.naturalHeight || element.height,
        objectUrl,
      },
      element,
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

export async function elementToDataUrl(
  element: HTMLImageElement,
  maxDimension = 1800,
  mime = 'image/jpeg',
  quality = 0.9
): Promise<string> {
  const w = element.naturalWidth || element.width;
  const h = element.naturalHeight || element.height;
  const scale = Math.min(1, maxDimension / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(mime, quality);
}

export function revokeLoadedImage(image?: LoadedImage | null): void {
  if (image?.objectUrl && image.objectUrl.startsWith('blob:')) {
    URL.revokeObjectURL(image.objectUrl);
  }
}

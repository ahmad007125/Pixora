export const SITE_NAME = 'Pixora';

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw && /^https?:\/\//i.test(raw)) {
    return raw.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

export const SITE_URL = resolveSiteUrl();

export const SITE_TITLE = 'Pixora — Modern Photo Editing Studio';

export const SITE_DESCRIPTION =
  'Make every photo a masterpiece. A private, browser-based photo editor, collage maker, cinematic filter lab, background remover, and image compressor.';

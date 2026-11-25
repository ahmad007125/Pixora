import type { Metadata } from 'next';
import { CollagePageClient } from '../../../components/pages/CollagePageClient';

export const metadata: Metadata = {
  title: 'Collage Maker',
  description:
    'Build multi-photo collages with grids, Polaroid and scrapbook layouts, custom spacing, gradients, and text—entirely in your browser.',
  alternates: { canonical: '/collage' },
};

export default function CollagePage() {
  return <CollagePageClient />;
}

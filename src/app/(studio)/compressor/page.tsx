import type { Metadata } from 'next';
import { CompressorPageClient } from '../../../components/pages/CompressorPageClient';

export const metadata: Metadata = {
  title: 'Image Compressor',
  description:
    'Batch compress JPG, WebP, PNG, and AVIF with target sizes, resizing, and ZIP download. Processing stays in your browser.',
  alternates: { canonical: '/compressor' },
};

export default function CompressorPage() {
  return <CompressorPageClient />;
}

import type { Metadata } from 'next';
import { BackgroundRemoverPageClient } from '../../../components/pages/BackgroundRemoverPageClient';

export const metadata: Metadata = {
  title: 'Background Remover',
  description:
    'Remove photo backgrounds with on-device AI segmentation. Export transparent PNGs or swap backdrops without uploading files.',
  alternates: { canonical: '/background-remover' },
};

export default function BackgroundRemoverPage() {
  return <BackgroundRemoverPageClient />;
}

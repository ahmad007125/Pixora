'use client';

import dynamic from 'next/dynamic';
import { ViewFallback } from '../shared/ViewFallback';

const ImageCompressorView = dynamic(
  () =>
    import('../compressor/ImageCompressorView').then((m) => ({
      default: m.ImageCompressorView,
    })),
  { ssr: false, loading: () => <ViewFallback /> }
);

export function CompressorPageClient() {
  return <ImageCompressorView />;
}

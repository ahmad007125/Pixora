'use client';

import dynamic from 'next/dynamic';
import { ViewFallback } from '../shared/ViewFallback';

const BackgroundRemoverView = dynamic(
  () =>
    import('../background-remover/BackgroundRemoverView').then((m) => ({
      default: m.BackgroundRemoverView,
    })),
  { ssr: false, loading: () => <ViewFallback /> }
);

export function BackgroundRemoverPageClient() {
  return <BackgroundRemoverView />;
}

import type { Metadata } from 'next';
import { EditorPageClient } from '../../../components/pages/EditorPageClient';

export const metadata: Metadata = {
  title: 'Photo Editor',
  description:
    'Non-destructive browser photo editor with exposure, color, crop, straighten, sharpening, and before/after comparison. Images stay on your device.',
  alternates: { canonical: '/editor' },
};

export default function EditorPage() {
  return <EditorPageClient />;
}

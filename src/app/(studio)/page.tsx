import type { Metadata } from 'next';
import { HomePageClient } from '../../components/pages/HomePageClient';

export const metadata: Metadata = {
  title: { absolute: 'Pixora — Modern Photo Editing Studio' },
  description:
    'Private browser photo studio for editing, cinematic grades, collages, background removal, and image compression—with no server uploads.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <HomePageClient />;
}

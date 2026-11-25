import type { Metadata } from 'next';
import { SettingsPageClient } from '../../../components/pages/SettingsPageClient';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Theme, export defaults, auto-save, and local storage controls for the Pixora photo studio.',
  alternates: { canonical: '/settings' },
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}

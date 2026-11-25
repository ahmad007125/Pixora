import type { Metadata } from 'next';
import { FiltersPageClient } from '../../../components/pages/FiltersPageClient';

export const metadata: Metadata = {
  title: 'Cinematic Filters',
  description:
    'Apply 30 calibrated film, vintage, and cinema grades with live previews, intensity blending, grain, and saved custom stacks.',
  alternates: { canonical: '/filters' },
};

export default function FiltersPage() {
  return <FiltersPageClient />;
}

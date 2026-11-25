import type { Metadata } from 'next';
import { ProjectsPageClient } from '../../../components/pages/ProjectsPageClient';

export const metadata: Metadata = {
  title: 'My Projects',
  description: 'Reopen photo edits and collages saved locally in your browser with Pixora IndexedDB storage.',
  alternates: { canonical: '/projects' },
  robots: { index: false, follow: true },
};

export default function ProjectsPage() {
  return <ProjectsPageClient />;
}

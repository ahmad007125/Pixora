'use client';

import dynamic from 'next/dynamic';
import { ViewFallback } from '../shared/ViewFallback';
import { useStudio } from '../studio/StudioProvider';

const CollageMakerView = dynamic(
  () => import('../collage/CollageMakerView').then((m) => ({ default: m.CollageMakerView })),
  { ssr: false, loading: () => <ViewFallback /> }
);

export function CollagePageClient() {
  const { restoredCollage, settings, localProjects } = useStudio();

  return (
    <CollageMakerView
      key={restoredCollage?.key ?? 'default'}
      initialState={restoredCollage?.state}
      initialProjectId={restoredCollage?.id}
      initialProjectName={restoredCollage?.name}
      autoSaveEnabled={settings.autoSaveEnabled}
      defaultExportFormat={settings.defaultExportFormat}
      defaultExportQuality={settings.defaultExportQuality}
      onSaveProject={async (proj) => {
        await localProjects.upsertProject(proj);
        try {
          sessionStorage.setItem('pixora_session_project_v1', proj.id);
        } catch {
          // Ignore
        }
      }}
    />
  );
}

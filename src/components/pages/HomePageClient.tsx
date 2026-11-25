'use client';

import { HomeView } from '../home/HomeView';
import { useStudio } from '../studio/StudioProvider';

export function HomePageClient() {
  const {
    settings,
    localProjects,
    upload,
    handleUploadToEditor,
    handleSelectSample,
    handleOpenSavedProject,
  } = useStudio();

  return (
    <HomeView
      recentTools={settings.recentTools}
      recentProjects={localProjects.projects}
      isLoadingUpload={upload.isLoading}
      uploadError={upload.error}
      uploadWarning={upload.warning}
      onFilesUploaded={(files) => void handleUploadToEditor(files, true)}
      onSamplePicked={(sample) => void handleSelectSample(sample, 'editor')}
      onOpenProject={(proj) => void handleOpenSavedProject(proj)}
    />
  );
}

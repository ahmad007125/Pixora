'use client';

import { CinematicFiltersView } from '../filters/CinematicFiltersView';
import { useStudio } from '../studio/StudioProvider';

export function FiltersPageClient() {
  const {
    editor,
    localProjects,
    upload,
    settings,
    handleUploadToEditor,
    handleSelectSample,
    handleNavigate,
  } = useStudio();

  return (
    <CinematicFiltersView
      editor={editor}
      customFilters={localProjects.customFilters}
      isLoadingUpload={upload.isLoading}
      uploadError={upload.error}
      uploadWarning={upload.warning}
      defaultExportFormat={settings.defaultExportFormat}
      defaultExportQuality={settings.defaultExportQuality}
      onUploadFiles={(files) => handleUploadToEditor(files, false)}
      onSelectSample={(sample) => handleSelectSample(sample, 'filters')}
      onSaveCustomFilter={localProjects.addCustomFilter}
      onDeleteCustomFilter={localProjects.removeCustomFilter}
      onOpenInEditor={() => handleNavigate('editor')}
    />
  );
}

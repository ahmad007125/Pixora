'use client';

import { PhotoEditorView } from '../editor/PhotoEditorView';
import { useStudio } from '../studio/StudioProvider';

export function EditorPageClient() {
  const {
    editor,
    imageQueue,
    upload,
    settings,
    handleUploadToEditor,
    handleSelectSample,
    handleNavigate,
    localProjects,
    setImageQueue,
  } = useStudio();

  return (
    <PhotoEditorView
      editor={editor}
      imageQueue={imageQueue}
      isLoadingUpload={upload.isLoading}
      uploadError={upload.error}
      uploadWarning={upload.warning}
      defaultExportFormat={settings.defaultExportFormat}
      defaultExportQuality={settings.defaultExportQuality}
      onUploadFiles={(files) => handleUploadToEditor(files, false)}
      onSelectSample={(sample) => handleSelectSample(sample, 'editor')}
      onSelectQueueItem={(bundle) => editor.openImage(bundle.image, bundle.element)}
      onRemoveQueueItem={(id) =>
        setImageQueue((prev) => prev.filter((item) => item.image.id !== id))
      }
      onSaveProject={localProjects.upsertProject}
      onOpenInFilters={() => handleNavigate('filters')}
    />
  );
}

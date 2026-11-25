import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { StudioShell } from './components/layout/StudioShell';
import { HomeView } from './components/home/HomeView';
import { PhotoEditorView } from './components/editor/PhotoEditorView';
import { CinematicFiltersView } from './components/filters/CinematicFiltersView';
import { ProjectsView } from './components/projects/ProjectsView';
import { SettingsView } from './components/settings/SettingsView';
import { useImageEditor } from './hooks/useImageEditor';
import { UploadedImageBundle, useImageUpload } from './hooks/useImageUpload';
import { useLocalProjects } from './hooks/useLocalProjects';
import { loadImageElement } from './lib/file-handling/imageLoader';
import { loadUserSettings, recordRecentTool, saveUserSettings } from './lib/storage/settings';
import { SamplePhotoItem } from './lib/utilities/samples';
import { CollageState } from './types/collage';
import { PixoraProject, StudioView, UserSettings } from './types/project';

const CollageMakerView = lazy(() =>
  import('./components/collage/CollageMakerView').then((m) => ({ default: m.CollageMakerView }))
);
const BackgroundRemoverView = lazy(() =>
  import('./components/background-remover/BackgroundRemoverView').then((m) => ({
    default: m.BackgroundRemoverView,
  }))
);
const ImageCompressorView = lazy(() =>
  import('./components/compressor/ImageCompressorView').then((m) => ({
    default: m.ImageCompressorView,
  }))
);

function ViewFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="flex items-center gap-3 text-sm text-[#5F6368] dark:text-[#9AA0A6]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#4285F4] border-t-transparent" />
        <span>Loading studio workspace…</span>
      </div>
    </div>
  );
}

const SESSION_VIEW_KEY = 'pixora_session_view_v1';
const SESSION_PROJECT_KEY = 'pixora_session_project_v1';

export default function App() {
  const [activeView, setActiveView] = useState<StudioView>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_VIEW_KEY) as StudioView | null;
      return saved ?? 'home';
    } catch {
      return 'home';
    }
  });
  const [settings, setSettings] = useState<UserSettings>(() => loadUserSettings());
  const [imageQueue, setImageQueue] = useState<UploadedImageBundle[]>([]);
  const [restoredCollage, setRestoredCollage] = useState<{
    id: string;
    name: string;
    state: CollageState;
    key: number;
  } | null>(null);
  const [didRestoreSession, setDidRestoreSession] = useState(false);

  const upload = useImageUpload();
  const localProjects = useLocalProjects();

  const editor = useImageEditor({
    autoSaveEnabled: settings.autoSaveEnabled,
    onAutoSave: async (proj) => {
      await localProjects.upsertProject(proj);
      try {
        sessionStorage.setItem(SESSION_PROJECT_KEY, proj.id);
      } catch {
        // Ignore storage restrictions
      }
    },
  });

  // Sync Tailwind v4 `.dark` class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleNavigate = useCallback((view: StudioView) => {
    setActiveView(view);
    try {
      sessionStorage.setItem(SESSION_VIEW_KEY, view);
    } catch {
      // Ignore storage restrictions
    }
    setSettings((curr) => recordRecentTool(curr, view));
  }, []);

  const handleUpdateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettings((curr) => {
      const next = { ...curr, ...patch };
      saveUserSettings(next);
      return next;
    });
  }, []);

  const handleUploadToEditor = useCallback(
    async (files: FileList, navigateToEditor = true) => {
      const bundles = await upload.processFiles(files);
      if (bundles.length === 0) return;

      setImageQueue((prev) => [...prev, ...bundles]);
      editor.openImage(bundles[0].image, bundles[0].element);
      if (navigateToEditor) {
        handleNavigate('editor');
      }
    },
    [upload, editor, handleNavigate]
  );

  const handleSelectSample = useCallback(
    async (sample: SamplePhotoItem, targetView?: StudioView) => {
      const bundle = await upload.processSampleUrl(sample.url, `${sample.id}.jpg`);
      if (!bundle) return;
      setImageQueue((prev) => [...prev, bundle]);
      editor.openImage(bundle.image, bundle.element, { projectName: sample.title });
      handleNavigate(targetView ?? (activeView === 'filters' ? 'filters' : 'editor'));
    },
    [upload, editor, handleNavigate, activeView]
  );

  const handleOpenSavedProject = useCallback(
    async (project: PixoraProject, targetViewOverride?: StudioView) => {
      try {
        sessionStorage.setItem(SESSION_PROJECT_KEY, project.id);
      } catch {
        // Ignore storage restrictions
      }

      if (project.type === 'collage' && project.collageData) {
        setRestoredCollage({
          id: project.id,
          name: project.name,
          state: project.collageData.collage,
          key: Date.now(),
        });
        handleNavigate(targetViewOverride ?? 'collage');
        return;
      }

      if (project.editorData) {
        try {
          const el = await loadImageElement(project.editorData.imageDataUrl);
          editor.openImage(
            {
              id: `restored_${project.id}`,
              name: project.editorData.imageName,
              mimeType: project.editorData.imageMimeType,
              sizeBytes: project.editorData.imageSizeBytes,
              width: project.editorData.imageWidth || el.naturalWidth,
              height: project.editorData.imageHeight || el.naturalHeight,
              objectUrl: project.editorData.imageDataUrl,
            },
            el,
            {
              projectId: project.id,
              projectName: project.name,
              createdAt: project.createdAt,
              state: {
                adjustments: project.editorData.adjustments,
                transform: project.editorData.transform,
                filter: project.editorData.filter,
              },
            }
          );
          handleNavigate(targetViewOverride ?? 'editor');
        } catch {
          upload.setError('Could not restore saved project image.');
        }
      }
    },
    [editor, handleNavigate, upload]
  );

  // Restore last active project from IndexedDB after page refresh
  useEffect(() => {
    if (didRestoreSession || localProjects.isLoading) return;
    setDidRestoreSession(true);
    try {
      const savedProjId = sessionStorage.getItem(SESSION_PROJECT_KEY);
      if (!savedProjId) return;
      const match = localProjects.projects.find((p) => p.id === savedProjId);
      if (!match) return;
      if (activeView === 'editor' || activeView === 'filters') {
        if (match.editorData) {
          void handleOpenSavedProject(match, activeView);
        }
      } else if (activeView === 'collage' && match.collageData) {
        void handleOpenSavedProject(match, 'collage');
      }
    } catch {
      // Ignore storage errors
    }
  }, [didRestoreSession, localProjects.isLoading, localProjects.projects, activeView, handleOpenSavedProject]);

  return (
    <StudioShell
      activeView={activeView}
      theme={settings.theme}
      projectCount={localProjects.projects.length}
      onNavigate={handleNavigate}
      onToggleTheme={() =>
        handleUpdateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })
      }
    >
      {activeView === 'home' && (
        <HomeView
          recentTools={settings.recentTools}
          recentProjects={localProjects.projects}
          isLoadingUpload={upload.isLoading}
          uploadError={upload.error}
          uploadWarning={upload.warning}
          onFilesUploaded={(files) => void handleUploadToEditor(files, true)}
          onSamplePicked={(sample) => void handleSelectSample(sample, 'editor')}
          onNavigate={handleNavigate}
          onOpenProject={(proj) => void handleOpenSavedProject(proj)}
        />
      )}

      {activeView === 'editor' && (
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
      )}

      {activeView === 'filters' && (
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
      )}

      {activeView === 'collage' && (
        <Suspense fallback={<ViewFallback />}>
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
                sessionStorage.setItem(SESSION_PROJECT_KEY, proj.id);
              } catch {
                // Ignore
              }
            }}
          />
        </Suspense>
      )}

      {activeView === 'background-remover' && (
        <Suspense fallback={<ViewFallback />}>
          <BackgroundRemoverView />
        </Suspense>
      )}

      {activeView === 'compressor' && (
        <Suspense fallback={<ViewFallback />}>
          <ImageCompressorView />
        </Suspense>
      )}

      {activeView === 'projects' && (
        <ProjectsView
          projects={localProjects.projects}
          storageStats={localProjects.storageStats}
          isLoading={localProjects.isLoading}
          storageError={localProjects.storageError}
          onOpenProject={(proj) => void handleOpenSavedProject(proj)}
          onRenameProject={localProjects.renameProject}
          onDeleteProject={localProjects.removeProject}
          onClearAllProjects={localProjects.wipeProjects}
          onCreateNew={(target) => {
            if (target === 'collage') {
              setRestoredCollage(null);
            } else if (target === 'editor') {
              editor.clearImage();
            }
            handleNavigate(target);
          }}
        />
      )}

      {activeView === 'settings' && (
        <SettingsView
          settings={settings}
          storageStats={localProjects.storageStats}
          onUpdateSettings={handleUpdateSettings}
          onClearAllProjects={localProjects.wipeProjects}
        />
      )}
    </StudioShell>
  );
}

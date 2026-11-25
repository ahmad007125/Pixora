'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useImageEditor } from '../../hooks/useImageEditor';
import { UploadedImageBundle, useImageUpload } from '../../hooks/useImageUpload';
import { useLocalProjects } from '../../hooks/useLocalProjects';
import { pathToView, VIEW_PATHS } from '../../lib/navigation';
import { loadImageElement } from '../../lib/file-handling/imageLoader';
import { loadUserSettings, recordRecentTool, saveUserSettings } from '../../lib/storage/settings';
import { SamplePhotoItem } from '../../lib/utilities/samples';
import { CollageState } from '../../types/collage';
import { DEFAULT_USER_SETTINGS, PixoraProject, StudioView, UserSettings } from '../../types/project';
import { StudioShell } from '../layout/StudioShell';

const SESSION_PROJECT_KEY = 'pixora_session_project_v1';

interface StudioContextValue {
  activeView: StudioView;
  settings: UserSettings;
  imageQueue: UploadedImageBundle[];
  restoredCollage: {
    id: string;
    name: string;
    state: CollageState;
    key: number;
  } | null;
  upload: ReturnType<typeof useImageUpload>;
  localProjects: ReturnType<typeof useLocalProjects>;
  editor: ReturnType<typeof useImageEditor>;
  handleNavigate: (view: StudioView) => void;
  handleUpdateSettings: (patch: Partial<UserSettings>) => void;
  handleUploadToEditor: (files: FileList, navigateToEditor?: boolean) => Promise<void>;
  handleSelectSample: (sample: SamplePhotoItem, targetView?: StudioView) => Promise<void>;
  handleOpenSavedProject: (
    project: PixoraProject,
    targetViewOverride?: StudioView
  ) => Promise<void>;
  setImageQueue: React.Dispatch<React.SetStateAction<UploadedImageBundle[]>>;
  setRestoredCollage: React.Dispatch<
    React.SetStateAction<{
      id: string;
      name: string;
      state: CollageState;
      key: number;
    } | null>
  >;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error('useStudio must be used inside StudioProvider');
  }
  return ctx;
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeView = pathToView(pathname);

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [imageQueue, setImageQueue] = useState<UploadedImageBundle[]>([]);
  const [restoredCollage, setRestoredCollage] = useState<{
    id: string;
    name: string;
    state: CollageState;
    key: number;
  } | null>(null);
  const [didRestoreSession, setDidRestoreSession] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);

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

  useEffect(() => {
    setSettings(loadUserSettings());
    setSettingsReady(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    if (!settingsReady) return;
    setSettings((curr) => recordRecentTool(curr, activeView));
  }, [activeView, settingsReady]);

  const handleNavigate = useCallback(
    (view: StudioView) => {
      router.push(VIEW_PATHS[view]);
    },
    [router]
  );

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
  }, [
    didRestoreSession,
    localProjects.isLoading,
    localProjects.projects,
    activeView,
    handleOpenSavedProject,
  ]);

  const value = useMemo<StudioContextValue>(
    () => ({
      activeView,
      settings,
      imageQueue,
      restoredCollage,
      upload,
      localProjects,
      editor,
      handleNavigate,
      handleUpdateSettings,
      handleUploadToEditor,
      handleSelectSample,
      handleOpenSavedProject,
      setImageQueue,
      setRestoredCollage,
    }),
    [
      activeView,
      settings,
      imageQueue,
      restoredCollage,
      upload,
      localProjects,
      editor,
      handleNavigate,
      handleUpdateSettings,
      handleUploadToEditor,
      handleSelectSample,
      handleOpenSavedProject,
    ]
  );

  return (
    <StudioContext.Provider value={value}>
      <StudioShell
        activeView={activeView}
        theme={settings.theme}
        projectCount={localProjects.projects.length}
        onToggleTheme={() =>
          handleUpdateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })
        }
      >
        {children}
      </StudioShell>
    </StudioContext.Provider>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { elementToDataUrl, revokeLoadedImage } from '../lib/file-handling/imageLoader';
import { renderProcessedCanvas } from '../lib/image-processing/pipeline';
import { createId } from '../lib/utilities/format';
import { ActiveFilterState, DEFAULT_ACTIVE_FILTER } from '../types/filters';
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_TRANSFORM,
  ImageAdjustments,
  LoadedImage,
  TransformState,
} from '../types/image';
import { PixoraProject } from '../types/project';
import { useCanvasHistory } from './useCanvasHistory';

export interface EditorDocumentState {
  adjustments: ImageAdjustments;
  transform: TransformState;
  filter: ActiveFilterState;
}

const INITIAL_EDITOR_STATE: EditorDocumentState = {
  adjustments: DEFAULT_ADJUSTMENTS,
  transform: DEFAULT_TRANSFORM,
  filter: DEFAULT_ACTIVE_FILTER,
};

export function useImageEditor(options?: {
  autoSaveEnabled?: boolean;
  onAutoSave?: (project: PixoraProject) => Promise<void>;
}) {
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [projectId, setProjectId] = useState<string>(() => createId('proj'));
  const [projectName, setProjectName] = useState<string>('Untitled Photo');
  const [createdAt, setCreatedAt] = useState<number>(() => Date.now());
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const beforeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<LoadedImage | null>(null);
  const renderTimerRef = useRef<number | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  const {
    state: docState,
    canUndo,
    canRedo,
    pushState,
    replacePresent,
    undo,
    redo,
    resetHistory,
  } = useCanvasHistory<EditorDocumentState>(INITIAL_EDITOR_STATE);

  useEffect(() => {
    loadedImageRef.current = loadedImage;
  }, [loadedImage]);

  useEffect(() => {
    return () => {
      revokeLoadedImage(loadedImageRef.current);
      if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  const openImage = useCallback(
    (
      image: LoadedImage,
      element: HTMLImageElement,
      restore?: {
        projectId?: string;
        projectName?: string;
        createdAt?: number;
        state?: EditorDocumentState;
      }
    ) => {
      if (loadedImageRef.current && loadedImageRef.current.objectUrl !== image.objectUrl) {
        revokeLoadedImage(loadedImageRef.current);
      }
      setLoadedImage(image);
      setImageElement(element);
      setProjectId(restore?.projectId ?? createId('proj'));
      setProjectName(
        restore?.projectName ?? image.name.replace(/\.[^.]+$/, '') ?? 'Untitled Photo'
      );
      setCreatedAt(restore?.createdAt ?? Date.now());
      setIsCropping(false);
      resetHistory(
        restore?.state ?? {
          adjustments: { ...DEFAULT_ADJUSTMENTS },
          transform: { ...DEFAULT_TRANSFORM },
          filter: { ...DEFAULT_ACTIVE_FILTER },
        }
      );
    },
    [resetHistory]
  );

  const clearImage = useCallback(() => {
    revokeLoadedImage(loadedImageRef.current);
    setLoadedImage(null);
    setImageElement(null);
    setIsCropping(false);
    resetHistory(INITIAL_EDITOR_STATE);
  }, [resetHistory]);

  const updateAdjustment = useCallback(
    (key: keyof ImageAdjustments, value: number, commit = false) => {
      const updater = (prev: EditorDocumentState): EditorDocumentState => ({
        ...prev,
        adjustments: { ...prev.adjustments, [key]: value },
      });
      if (commit) pushState(updater);
      else replacePresent(updater);
    },
    [pushState, replacePresent]
  );

  const [renderRevision, setRenderRevision] = useState(0);

  const requestRender = useCallback(() => {
    setRenderRevision((r) => r + 1);
  }, []);

  const commitAdjustmentSnapshot = useCallback(() => {
    pushState((prev) => ({
      adjustments: { ...prev.adjustments },
      transform: { ...prev.transform },
      filter: { ...prev.filter },
    }));
  }, [pushState]);

  const resetSingleAdjustment = useCallback(
    (key: keyof ImageAdjustments) => {
      pushState((prev) => ({
        ...prev,
        adjustments: {
          ...prev.adjustments,
          [key]: DEFAULT_ADJUSTMENTS[key],
        },
      }));
    },
    [pushState]
  );

  const updateTransform = useCallback(
    (updaterFn: (prev: TransformState) => TransformState, commit = true) => {
      const updater = (prev: EditorDocumentState): EditorDocumentState => ({
        ...prev,
        transform: updaterFn(prev.transform),
      });
      if (commit) pushState(updater);
      else replacePresent(updater);
    },
    [pushState, replacePresent]
  );

  const updateFilter = useCallback(
    (updaterFn: (prev: ActiveFilterState) => ActiveFilterState, commit = true) => {
      const updater = (prev: EditorDocumentState): EditorDocumentState => ({
        ...prev,
        filter: updaterFn(prev.filter),
      });
      if (commit) pushState(updater);
      else replacePresent(updater);
    },
    [pushState, replacePresent]
  );

  const resetAll = useCallback(() => {
    pushState({
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      transform: { ...DEFAULT_TRANSFORM },
      filter: { ...DEFAULT_ACTIVE_FILTER },
    });
  }, [pushState]);

  // Debounced preview canvas rendering
  useEffect(() => {
    if (!imageElement) return;
    if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);

    renderTimerRef.current = window.setTimeout(() => {
      if (previewCanvasRef.current) {
        renderProcessedCanvas(
          imageElement,
          previewCanvasRef.current,
          docState.adjustments,
          docState.transform,
          docState.filter,
          { maxDimension: 1400, ignoreCrop: isCropping, originalOnly: false }
        );
      }
      if (beforeCanvasRef.current) {
        renderProcessedCanvas(
          imageElement,
          beforeCanvasRef.current,
          docState.adjustments,
          docState.transform,
          docState.filter,
          { maxDimension: 1400, ignoreCrop: isCropping, originalOnly: true }
        );
      }
    }, 18);

    return () => {
      if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
    };
  }, [imageElement, docState, isCropping, renderRevision]);

  const buildProjectSnapshot = useCallback(async (): Promise<PixoraProject | null> => {
    if (!loadedImage || !imageElement) return null;
    const thumbCanvas = document.createElement('canvas');
    renderProcessedCanvas(
      imageElement,
      thumbCanvas,
      docState.adjustments,
      docState.transform,
      docState.filter,
      { maxDimension: 360 }
    );
    const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);
    const imageDataUrl = await elementToDataUrl(imageElement, 1600, 'image/jpeg', 0.9);
    const now = Date.now();
    return {
      id: projectId,
      name: projectName,
      type: 'photo-edit',
      createdAt,
      updatedAt: now,
      thumbnailDataUrl,
      editorData: {
        imageName: loadedImage.name,
        imageMimeType: loadedImage.mimeType,
        imageWidth: loadedImage.width,
        imageHeight: loadedImage.height,
        imageSizeBytes: loadedImage.sizeBytes,
        imageDataUrl,
        adjustments: docState.adjustments,
        transform: docState.transform,
        filter: docState.filter,
      },
    };
  }, [loadedImage, imageElement, docState, projectId, projectName, createdAt]);

  // Autosave to IndexedDB when enabled
  useEffect(() => {
    if (!options?.autoSaveEnabled || !options.onAutoSave || !loadedImage || !imageElement) return;
    if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = window.setTimeout(async () => {
      try {
        const snapshot = await buildProjectSnapshot();
        if (snapshot) {
          await options.onAutoSave!(snapshot);
          setLastSavedAt(Date.now());
        }
      } catch {
        // Ignore autosave quota errors silently; manual save shows explicit feedback
      }
    }, 1800);

    return () => {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    };
  }, [docState, projectName, loadedImage, imageElement, options, buildProjectSnapshot]);

  return {
    loadedImage,
    imageElement,
    projectId,
    projectName,
    setProjectName,
    lastSavedAt,
    setLastSavedAt,
    isCropping,
    setIsCropping,
    previewCanvasRef,
    beforeCanvasRef,
    docState,
    canUndo,
    canRedo,
    undo,
    redo,
    openImage,
    clearImage,
    updateAdjustment,
    commitAdjustmentSnapshot,
    resetSingleAdjustment,
    updateTransform,
    updateFilter,
    resetAll,
    buildProjectSnapshot,
    requestRender,
  };
}

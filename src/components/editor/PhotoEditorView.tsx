'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Aperture,
  Check,
  Columns2,
  Crop,
  Download,
  FlipHorizontal2,
  FlipVertical2,
  ImagePlus,
  Maximize2,
  Minimize2,
  Plus,
  Redo2,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Save,
  SlidersHorizontal,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { UploadedImageBundle } from '../../hooks/useImageUpload';
import { exportProcessedImage } from '../../lib/image-processing/pipeline';
import { extensionForMime, formatBytes, stripExtension, triggerBlobDownload } from '../../lib/utilities/format';
import { SamplePhotoItem } from '../../lib/utilities/samples';
import {
  ASPECT_RATIO_PRESETS,
  AspectRatioPresetId,
  CropRect,
  DEFAULT_ADJUSTMENTS,
  ExportFormat,
  ImageAdjustments,
} from '../../types/image';
import { PixoraProject } from '../../types/project';
import { useImageEditor } from '../../hooks/useImageEditor';
import { ComparisonSliderOverlay } from '../shared/ComparisonSlider';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { DropzoneUpload } from '../shared/DropzoneUpload';
import { ExportModal } from '../shared/ExportModal';

interface PhotoEditorViewProps {
  editor: ReturnType<typeof useImageEditor>;
  imageQueue: UploadedImageBundle[];
  isLoadingUpload: boolean;
  uploadError: string | null;
  uploadWarning: string | null;
  defaultExportFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  defaultExportQuality: number;
  onUploadFiles: (files: FileList) => Promise<void>;
  onSelectSample: (sample: SamplePhotoItem) => Promise<void>;
  onSelectQueueItem: (bundle: UploadedImageBundle) => void;
  onRemoveQueueItem: (id: string) => void;
  onSaveProject: (project: PixoraProject) => Promise<void>;
  onOpenInFilters: () => void;
}

interface SliderSpec {
  key: keyof ImageAdjustments;
  label: string;
  min: number;
  max: number;
  step?: number;
}

const ADJUSTMENT_GROUPS: { title: string; items: SliderSpec[] }[] = [
  {
    title: 'Light & Exposure',
    items: [
      { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
      { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
      { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
      { key: 'highlights', label: 'Highlights', min: -100, max: 100 },
      { key: 'shadows', label: 'Shadows', min: -100, max: 100 },
      { key: 'gamma', label: 'Gamma', min: 0.4, max: 2.2, step: 0.05 },
    ],
  },
  {
    title: 'Color & Tone',
    items: [
      { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
      { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
      { key: 'tint', label: 'Tint', min: -100, max: 100 },
      { key: 'hue', label: 'Hue', min: -180, max: 180 },
    ],
  },
  {
    title: 'Detail & Optics',
    items: [
      { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
      { key: 'blur', label: 'Blur', min: 0, max: 100 },
      { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
    ],
  },
];

export function PhotoEditorView({
  editor,
  imageQueue,
  isLoadingUpload,
  uploadError,
  uploadWarning,
  defaultExportFormat,
  defaultExportQuality,
  onUploadFiles,
  onSelectSample,
  onSelectQueueItem,
  onRemoveQueueItem,
  onSaveProject,
  onOpenInFilters,
}: PhotoEditorViewProps) {
  const [rightTab, setRightTab] = useState<'adjust' | 'transform'>('adjust');
  const [compareMode, setCompareMode] = useState(false);
  const [comparePos, setComparePos] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [draftCrop, setDraftCrop] = useState<CropRect>(editor.docState.transform.crop);
  const [cropDragState, setCropDragState] = useState<{
    mode: 'move' | 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    initial: CropRect;
  } | null>(null);

  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const addMoreInputRef = useRef<HTMLInputElement | null>(null);
  const cropStageRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const { loadedImage, imageElement, docState } = editor;

  useEffect(() => {
    editor.requestRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync draft crop when entering crop mode
  useEffect(() => {
    setDraftCrop(docState.transform.crop);
  }, [docState.transform.crop, editor.isCropping]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!loadedImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) editor.redo();
        else editor.undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        editor.redo();
      } else if (e.key === '=' || e.key === '+') {
        setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)));
      } else if (e.key === '-') {
        setZoom((z) => Math.max(0.25, +(z - 0.2).toFixed(2)));
      } else if (e.key === '0') {
        setZoom(1);
      } else if (e.key === '\\') {
        setCompareMode((v) => !v);
      } else if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        setIsFullscreen((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadedImage, editor]);

  const computeEffectiveDimensions = () => {
    if (!loadedImage) return { width: 0, height: 0 };
    const swap = docState.transform.rotate90 === 90 || docState.transform.rotate90 === 270;
    const baseW = swap ? loadedImage.height : loadedImage.width;
    const baseH = swap ? loadedImage.width : loadedImage.height;
    const croppedW = Math.round(baseW * docState.transform.crop.width);
    const croppedH = Math.round(baseH * docState.transform.crop.height);
    return {
      width: docState.transform.resizeWidth || croppedW,
      height: docState.transform.resizeHeight || croppedH,
    };
  };

  const handleApplyAspectPreset = (presetId: AspectRatioPresetId) => {
    const preset = ASPECT_RATIO_PRESETS.find((p) => p.id === presetId);
    if (!loadedImage) return;
    const swap = docState.transform.rotate90 === 90 || docState.transform.rotate90 === 270;
    const stageW = swap ? loadedImage.height : loadedImage.width;
    const stageH = swap ? loadedImage.width : loadedImage.height;

    let nextCrop: CropRect = { x: 0, y: 0, width: 1, height: 1 };
    if (preset?.ratio) {
      const stageAspect = stageW / stageH;
      if (stageAspect > preset.ratio) {
        const normW = preset.ratio / stageAspect;
        nextCrop = { x: (1 - normW) / 2, y: 0, width: normW, height: 1 };
      } else {
        const normH = stageAspect / preset.ratio;
        nextCrop = { x: 0, y: (1 - normH) / 2, width: 1, height: normH };
      }
    }
    setDraftCrop(nextCrop);
    if (!editor.isCropping) {
      editor.updateTransform((prev) => ({
        ...prev,
        aspectRatio: presetId,
        crop: nextCrop,
        resizeWidth: null,
        resizeHeight: null,
      }));
    } else {
      editor.updateTransform((prev) => ({ ...prev, aspectRatio: presetId }), false);
    }
  };

  const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cropDragState || !cropStageRef.current) return;
    const bounds = cropStageRef.current.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;

    const dx = (e.clientX - cropDragState.startX) / bounds.width;
    const dy = (e.clientY - cropDragState.startY) / bounds.height;
    const init = cropDragState.initial;
    const minSize = 0.08;

    let { x, y, width, height } = init;
    if (cropDragState.mode === 'move') {
      x = Math.max(0, Math.min(1 - width, init.x + dx));
      y = Math.max(0, Math.min(1 - height, init.y + dy));
    } else {
      if (cropDragState.mode.includes('w')) {
        const newX = Math.max(0, Math.min(init.x + init.width - minSize, init.x + dx));
        width = init.width + (init.x - newX);
        x = newX;
      }
      if (cropDragState.mode.includes('e')) {
        width = Math.max(minSize, Math.min(1 - init.x, init.width + dx));
      }
      if (cropDragState.mode.includes('n')) {
        const newY = Math.max(0, Math.min(init.y + init.height - minSize, init.y + dy));
        height = init.height + (init.y - newY);
        y = newY;
      }
      if (cropDragState.mode.includes('s')) {
        height = Math.max(minSize, Math.min(1 - init.y, init.height + dy));
      }

      // Enforce locked aspect ratio if preset has a ratio
      const activePreset = ASPECT_RATIO_PRESETS.find((p) => p.id === docState.transform.aspectRatio);
      if (activePreset?.ratio && loadedImage) {
        const swap = docState.transform.rotate90 === 90 || docState.transform.rotate90 === 270;
        const stageW = swap ? loadedImage.height : loadedImage.width;
        const stageH = swap ? loadedImage.width : loadedImage.height;
        const desiredNormRatio = activePreset.ratio / (stageW / stageH);
        height = Math.min(1 - y, Math.max(minSize, width / desiredNormRatio));
        width = Math.min(1 - x, height * desiredNormRatio);
      }
    }

    setDraftCrop({ x, y, width, height });
  };

  const handleManualSave = async () => {
    const snapshot = await editor.buildProjectSnapshot();
    if (!snapshot) return;
    await onSaveProject(snapshot);
    editor.setLastSavedAt(Date.now());
    setSaveNotice('Saved to My Projects');
    window.setTimeout(() => setSaveNotice(null), 2400);
  };

  const handleExport = async (format: ExportFormat, quality: number, filename: string) => {
    if (!imageElement) return;
    setIsExporting(true);
    try {
      const blob = await exportProcessedImage(
        imageElement,
        docState.adjustments,
        docState.transform,
        docState.filter,
        format,
        quality
      );
      const ext = extensionForMime(format);
      triggerBlobDownload(blob, `${stripExtension(filename)}.${ext}`);
      setExportOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  if (!loadedImage || !imageElement) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-4 py-10 sm:px-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-[#202124] dark:text-[#F1F3F4]">
            Photo Editor
          </h1>
          <p className="mt-1 text-sm text-[#5F6368] dark:text-[#9AA0A6]">
            Upload one or multiple photos to adjust light, color, geometry, and export at full
            resolution.
          </p>
        </div>
        <DropzoneUpload
          multiple
          title="Open photos in the editor"
          subtitle="Non-destructive editing preserves your original image dimensions and files."
          isLoading={isLoadingUpload}
          error={uploadError}
          warning={uploadWarning}
          onFilesSelected={(files) => void onUploadFiles(files)}
          onSampleSelected={(sample) => void onSelectSample(sample)}
        />
      </div>
    );
  }

  const outDims = computeEffectiveDimensions();

  return (
    <div
      ref={workspaceRef}
      className={`flex flex-1 flex-col ${
        isFullscreen ? 'fixed inset-0 z-40 bg-[#F8FAFD] dark:bg-[#0F141C]' : 'min-h-[calc(100vh-3.5rem)] lg:min-h-screen'
      }`}
    >
      {/* Hidden File Inputs for Replace / Add */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,.tif,.tiff,.avif,.svg,.bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void onUploadFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        accept="image/*,.tif,.tiff,.avif,.svg,.bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void onUploadFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Top Studio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DADCE0] bg-white px-4 py-2.5 dark:border-[#2B3340] dark:bg-[#171E29]">
        <div className="flex min-w-0 items-center gap-3">
          <input
            type="text"
            value={editor.projectName}
            onChange={(e) => editor.setProjectName(e.target.value)}
            aria-label="Project title"
            className="w-40 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-sm font-semibold text-[#202124] hover:border-[#DADCE0] focus:border-[#4285F4] focus:bg-[#F8FAFD] focus:outline-none sm:w-56 dark:text-[#F1F3F4] dark:hover:border-[#2B3340] dark:focus:bg-[#0F141C]"
          />
          <span className="hidden font-mono-num text-xs text-[#5F6368] sm:inline dark:text-[#9AA0A6]">
            {outDims.width} × {outDims.height}px · {formatBytes(loadedImage.sizeBytes)}
          </span>
          {saveNotice && (
            <span className="text-xs font-medium text-[#34A853]">{saveNotice}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            disabled={!editor.canUndo}
            onClick={editor.undo}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] disabled:opacity-35 dark:text-[#9AA0A6] dark:hover:bg-[#232B38]"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Shift+Z)"
            disabled={!editor.canRedo}
            onClick={editor.redo}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] disabled:opacity-35 dark:text-[#9AA0A6] dark:hover:bg-[#232B38]"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-[#DADCE0] dark:bg-[#2B3340]" />

          <button
            type="button"
            title="Compare Before / After (\)"
            onClick={() => setCompareMode((v) => !v)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              compareMode
                ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#4285F4]/20 dark:text-[#8AB4F8]'
                : 'text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#232B38]'
            }`}
          >
            <Columns2 className="h-4 w-4" />
            <span className="hidden sm:inline">Compare</span>
          </button>

          <button
            type="button"
            title="Open current photo in Cinematic Filters"
            onClick={onOpenInFilters}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[#5F6368] hover:bg-[#F1F3F4] whitespace-nowrap shrink-0 dark:text-[#9AA0A6] dark:hover:bg-[#232B38]"
          >
            <Aperture className="h-4 w-4" />
            <span className="hidden md:inline">Filters</span>
          </button>

          <button
            type="button"
            title="Replace photo"
            onClick={() => replaceInputRef.current?.click()}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#232B38]"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Remove photo"
            onClick={() => {
              onRemoveQueueItem(loadedImage.id);
              editor.clearImage();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#EA4335]/10 hover:text-[#EA4335] dark:text-[#9AA0A6]"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen mode (F)'}
            onClick={() => setIsFullscreen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#232B38]"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => void handleManualSave()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#DADCE0] bg-white px-3 text-xs font-medium text-[#202124] hover:bg-[#F8FAFD] whitespace-nowrap shrink-0 dark:border-[#2B3340] dark:bg-[#0F141C] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#4285F4] px-3.5 text-xs font-medium text-white shadow-xs hover:bg-[#1A73E8] whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Warning banner for animated formats or upload issues */}
      {(loadedImage.warningMessage || uploadError) && (
        <div className="border-b border-[#FBBC04]/40 bg-[#FBBC04]/10 px-4 py-2 text-xs text-[#7A5900] dark:text-[#FDE293]">
          {uploadError || loadedImage.warningMessage}
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Central Canvas Viewport */}
        <div className="relative flex min-h-[380px] flex-1 flex-col items-center justify-center overflow-hidden bg-[#EFF3F8] p-4 sm:p-8 dark:bg-[#0B0F16]">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
            className="relative flex max-h-full max-w-full items-center justify-center transition-transform duration-150"
          >
            <div ref={cropStageRef} className="relative inline-block overflow-hidden rounded-lg shadow-lg">
              {/* After / Edited Canvas */}
              <canvas
                ref={editor.previewCanvasRef}
                className="block max-h-[62vh] max-w-full object-contain checkerboard-bg"
              />

              {/* Before / Original Canvas clipped by slider */}
              <canvas
                ref={editor.beforeCanvasRef}
                style={{
                  clipPath: `inset(0 ${100 - comparePos}% 0 0)`,
                }}
                className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${
                  compareMode && !editor.isCropping ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {compareMode && !editor.isCropping && (
                <ComparisonSliderOverlay position={comparePos} onChange={setComparePos} />
              )}

              {/* Interactive Freeform / Preset Crop Overlay */}
              {editor.isCropping && (
                <div
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={() => setCropDragState(null)}
                  className="absolute inset-0 z-20 select-none touch-none bg-black/45"
                >
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setCropDragState({
                        mode: 'move',
                        startX: e.clientX,
                        startY: e.clientY,
                        initial: draftCrop,
                      });
                    }}
                    style={{
                      left: `${draftCrop.x * 100}%`,
                      top: `${draftCrop.y * 100}%`,
                      width: `${draftCrop.width * 100}%`,
                      height: `${draftCrop.height * 100}%`,
                    }}
                    className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                  >
                    {/* Rule of thirds grid */}
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {Array.from({ length: 9 }).map((_, idx) => (
                        <div key={idx} className="border border-white/25" />
                      ))}
                    </div>

                    {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
                      <div
                        key={corner}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.currentTarget.setPointerCapture(e.pointerId);
                          setCropDragState({
                            mode: corner,
                            startX: e.clientX,
                            startY: e.clientY,
                            initial: draftCrop,
                          });
                        }}
                        className={`absolute h-4 w-4 rounded-full border-2 border-white bg-[#4285F4] shadow ${
                          corner === 'nw'
                            ? '-top-2 -left-2 cursor-nwse-resize'
                            : corner === 'ne'
                            ? '-top-2 -right-2 cursor-nesw-resize'
                            : corner === 'sw'
                            ? '-bottom-2 -left-2 cursor-nesw-resize'
                            : '-bottom-2 -right-2 cursor-nwse-resize'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating Zoom & Crop Action Pill */}
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#DADCE0] bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-xs dark:border-[#2B3340] dark:bg-[#171E29]/95">
            <button
              type="button"
              title="Zoom out (-)"
              onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.15).toFixed(2)))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#232B38]"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="font-mono-num w-12 text-center text-xs font-medium text-[#202124] dark:text-[#F1F3F4]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              title="Zoom in (+)"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#232B38]"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#232B38]"
            >
              Fit
            </button>
            {editor.isCropping && (
              <>
                <div className="h-4 w-px bg-[#DADCE0] dark:bg-[#2B3340]" />
                <button
                  type="button"
                  onClick={() => {
                    editor.updateTransform((prev) => ({
                      ...prev,
                      crop: draftCrop,
                      resizeWidth: null,
                      resizeHeight: null,
                    }));
                    editor.setIsCropping(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#34A853] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#2B9348]"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Apply crop</span>
                </button>
                <button
                  type="button"
                  onClick={() => editor.setIsCropping(false)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-[#5F6368] hover:bg-[#F1F3F4]"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Multi-image Queue Strip when multiple images are uploaded */}
          {imageQueue.length > 0 && (
            <div className="mt-4 flex max-w-full items-center gap-2 overflow-x-auto rounded-xl border border-[#DADCE0] bg-white px-3 py-2 dark:border-[#2B3340] dark:bg-[#171E29]">
              {imageQueue.map((item) => {
                const active = item.image.id === loadedImage.id;
                return (
                  <button
                    key={item.image.id}
                    type="button"
                    onClick={() => onSelectQueueItem(item)}
                    className={`relative h-11 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      active
                        ? 'border-[#4285F4]'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={item.image.objectUrl}
                      alt={item.image.name}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
              <button
                type="button"
                title="Add more photos"
                onClick={() => addMoreInputRef.current?.click()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#DADCE0] text-[#5F6368] hover:border-[#4285F4] hover:text-[#1A73E8] dark:border-[#2B3340] dark:text-[#9AA0A6]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Properties & Adjustment Panel */}
        <aside className="flex w-full shrink-0 flex-col border-t border-[#DADCE0] bg-white lg:w-84 lg:border-t-0 lg:border-l dark:border-[#2B3340] dark:bg-[#171E29]">
          {/* Panel Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 border-b border-[#DADCE0] p-2 dark:border-[#2B3340]">
            <button
              type="button"
              onClick={() => {
                setRightTab('adjust');
                editor.setIsCropping(false);
              }}
              className={`flex min-h-9 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors ${
                rightTab === 'adjust'
                  ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#4285F4]/18 dark:text-[#8AB4F8]'
                  : 'text-[#5F6368] hover:bg-[#F8FAFD] dark:text-[#9AA0A6] dark:hover:bg-[#1F2735]'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Adjustments</span>
            </button>
            <button
              type="button"
              onClick={() => setRightTab('transform')}
              className={`flex min-h-9 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors ${
                rightTab === 'transform'
                  ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#4285F4]/18 dark:text-[#8AB4F8]'
                  : 'text-[#5F6368] hover:bg-[#F8FAFD] dark:text-[#9AA0A6] dark:hover:bg-[#1F2735]'
              }`}
            >
              <Crop className="h-3.5 w-3.5" />
              <span>Crop & Transform</span>
            </button>
          </div>

          <div className="studio-scroll flex-1 overflow-y-auto p-4">
            {rightTab === 'adjust' ? (
              <div className="space-y-6">
                {ADJUSTMENT_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-3">
                    <h3 className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
                      {group.title}
                    </h3>
                    <div className="space-y-3.5">
                      {group.items.map((item) => {
                        const value = docState.adjustments[item.key];
                        const isModified = value !== DEFAULT_ADJUSTMENTS[item.key];
                        return (
                          <div key={item.key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-[#202124] dark:text-[#F1F3F4]">
                                {item.label}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono-num text-[#5F6368] dark:text-[#9AA0A6]">
                                  {item.step ? value.toFixed(2) : Math.round(value)}
                                </span>
                                {isModified && (
                                  <button
                                    type="button"
                                    title={`Reset ${item.label}`}
                                    onClick={() => editor.resetSingleAdjustment(item.key)}
                                    className="text-[11px] font-medium text-[#1A73E8] hover:underline dark:text-[#8AB4F8]"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>
                            <input
                              type="range"
                              min={item.min}
                              max={item.max}
                              step={item.step ?? 1}
                              value={value}
                              onChange={(e) =>
                                editor.updateAdjustment(item.key, Number(e.target.value), false)
                              }
                              onMouseUp={() => editor.commitAdjustmentSnapshot()}
                              onTouchEnd={() => editor.commitAdjustmentSnapshot()}
                              className="studio-slider w-full"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="border-t border-[#DADCE0] pt-4 dark:border-[#2B3340]">
                  <button
                    type="button"
                    onClick={() => setResetConfirmOpen(true)}
                    className="min-h-10 w-full rounded-xl border border-[#DADCE0] px-4 py-2 text-xs font-medium text-[#5F6368] transition-colors hover:border-[#EA4335]/40 hover:text-[#EA4335] dark:border-[#2B3340] dark:text-[#9AA0A6]"
                  >
                    Reset all adjustments
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Interactive Crop Toggle */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
                      Crop Frame
                    </h3>
                    <button
                      type="button"
                      onClick={() => editor.setIsCropping((v) => !v)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                        editor.isCropping
                          ? 'bg-[#4285F4] text-white'
                          : 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#4285F4]/20 dark:text-[#8AB4F8]'
                      }`}
                    >
                      {editor.isCropping ? 'Editing Crop' : 'Adjust Crop Box'}
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {ASPECT_RATIO_PRESETS.map((preset) => {
                      const active = docState.transform.aspectRatio === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyAspectPreset(preset.id)}
                          className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? 'border-[#4285F4] bg-[#E8F0FE] text-[#1A73E8] dark:border-[#8AB4F8] dark:bg-[#4285F4]/20 dark:text-[#8AB4F8]'
                              : 'border-[#DADCE0] text-[#5F6368] hover:bg-[#F8FAFD] dark:border-[#2B3340] dark:text-[#9AA0A6] dark:hover:bg-[#1F2735]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Orientation & Straighten */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
                    Rotate & Flip
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      title="Rotate 90° left"
                      onClick={() =>
                        editor.updateTransform((prev) => ({
                          ...prev,
                          rotate90: (((prev.rotate90 - 90 + 360) % 360) as 0 | 90 | 180 | 270),
                          resizeWidth: null,
                          resizeHeight: null,
                        }))
                      }
                      className="flex h-10 items-center justify-center rounded-xl border border-[#DADCE0] text-[#202124] hover:bg-[#F8FAFD] dark:border-[#2B3340] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Rotate 90° right"
                      onClick={() =>
                        editor.updateTransform((prev) => ({
                          ...prev,
                          rotate90: (((prev.rotate90 + 90) % 360) as 0 | 90 | 180 | 270),
                          resizeWidth: null,
                          resizeHeight: null,
                        }))
                      }
                      className="flex h-10 items-center justify-center rounded-xl border border-[#DADCE0] text-[#202124] hover:bg-[#F8FAFD] dark:border-[#2B3340] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Flip horizontal"
                      onClick={() =>
                        editor.updateTransform((prev) => ({ ...prev, flipH: !prev.flipH }))
                      }
                      className={`flex h-10 items-center justify-center rounded-xl border transition-colors ${
                        docState.transform.flipH
                          ? 'border-[#4285F4] bg-[#E8F0FE] text-[#1A73E8] dark:border-[#8AB4F8] dark:bg-[#4285F4]/20 dark:text-[#8AB4F8]'
                          : 'border-[#DADCE0] text-[#202124] hover:bg-[#F8FAFD] dark:border-[#2B3340] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]'
                      }`}
                    >
                      <FlipHorizontal2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Flip vertical"
                      onClick={() =>
                        editor.updateTransform((prev) => ({ ...prev, flipV: !prev.flipV }))
                      }
                      className={`flex h-10 items-center justify-center rounded-xl border transition-colors ${
                        docState.transform.flipV
                          ? 'border-[#4285F4] bg-[#E8F0FE] text-[#1A73E8] dark:border-[#8AB4F8] dark:bg-[#4285F4]/20 dark:text-[#8AB4F8]'
                          : 'border-[#DADCE0] text-[#202124] hover:bg-[#F8FAFD] dark:border-[#2B3340] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]'
                      }`}
                    >
                      <FlipVertical2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#202124] dark:text-[#F1F3F4]">
                        Straighten
                      </span>
                      <span className="font-mono-num text-[#5F6368] dark:text-[#9AA0A6]">
                        {docState.transform.straighten > 0 ? '+' : ''}
                        {docState.transform.straighten}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      step={0.5}
                      value={docState.transform.straighten}
                      onChange={(e) =>
                        editor.updateTransform(
                          (prev) => ({ ...prev, straighten: Number(e.target.value) }),
                          false
                        )
                      }
                      onMouseUp={() => editor.commitAdjustmentSnapshot()}
                      onTouchEnd={() => editor.commitAdjustmentSnapshot()}
                      className="studio-slider w-full"
                    />
                  </div>
                </div>

                {/* Resize Output Dimensions */}
                <div className="space-y-3 border-t border-[#DADCE0] pt-4 dark:border-[#2B3340]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
                      Output Dimensions (px)
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        editor.updateTransform((prev) => ({
                          ...prev,
                          lockResizeAspect: !prev.lockResizeAspect,
                        }))
                      }
                      className="text-xs font-medium text-[#1A73E8] dark:text-[#8AB4F8]"
                    >
                      {docState.transform.lockResizeAspect ? 'Aspect locked' : 'Unlocked'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                        Width
                      </label>
                      <input
                        type="number"
                        min={16}
                        max={8000}
                        value={outDims.width}
                        onChange={(e) => {
                          const nextW = Math.max(16, Math.min(8000, Number(e.target.value) || 16));
                          const ratio = outDims.height / Math.max(1, outDims.width);
                          editor.updateTransform((prev) => ({
                            ...prev,
                            resizeWidth: nextW,
                            resizeHeight: prev.lockResizeAspect
                              ? Math.max(16, Math.round(nextW * ratio))
                              : outDims.height,
                          }));
                        }}
                        className="font-mono-num w-full rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-2 text-xs text-[#202124] dark:border-[#2B3340] dark:bg-[#0F141C] dark:text-[#F1F3F4]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                        Height
                      </label>
                      <input
                        type="number"
                        min={16}
                        max={8000}
                        value={outDims.height}
                        onChange={(e) => {
                          const nextH = Math.max(16, Math.min(8000, Number(e.target.value) || 16));
                          const ratio = outDims.width / Math.max(1, outDims.height);
                          editor.updateTransform((prev) => ({
                            ...prev,
                            resizeHeight: nextH,
                            resizeWidth: prev.lockResizeAspect
                              ? Math.max(16, Math.round(nextH * ratio))
                              : outDims.width,
                          }));
                        }}
                        className="font-mono-num w-full rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-2 text-xs text-[#202124] dark:border-[#2B3340] dark:bg-[#0F141C] dark:text-[#F1F3F4]"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Transform */}
                <button
                  type="button"
                  onClick={() =>
                    editor.updateTransform(() => ({
                      rotate90: 0,
                      straighten: 0,
                      flipH: false,
                      flipV: false,
                      crop: { x: 0, y: 0, width: 1, height: 1 },
                      aspectRatio: 'original',
                      resizeWidth: null,
                      resizeHeight: null,
                      lockResizeAspect: true,
                    }))
                  }
                  className="min-h-10 w-full rounded-xl border border-[#DADCE0] px-4 py-2 text-xs font-medium text-[#5F6368] hover:text-[#202124] dark:border-[#2B3340] dark:text-[#9AA0A6]"
                >
                  Reset crop & geometry
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      <ExportModal
        open={exportOpen}
        title="Export edited photo"
        defaultFilename={`${editor.projectName || 'pixora-edit'}`}
        defaultFormat={defaultExportFormat}
        defaultQuality={defaultExportQuality}
        dimensionsLabel={`${outDims.width} × ${outDims.height}px`}
        hasTransparencyNotice={loadedImage.mimeType === 'image/png' || loadedImage.mimeType === 'image/svg+xml'}
        isExporting={isExporting}
        onClose={() => setExportOpen(false)}
        onExport={(fmt, q, name) => void handleExport(fmt, q, name)}
      />

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset all adjustments?"
        description="This will revert all 13 color, light, and optical sliders, plus active filters and crop settings back to the original photo."
        confirmLabel="Reset all"
        destructive
        onConfirm={() => {
          editor.resetAll();
          setResetConfirmOpen(false);
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
}

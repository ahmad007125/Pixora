'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Download,
  GripVertical,
  ImagePlus,
  LayoutGrid,
  Palette,
  Plus,
  Save,
  Shapes,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import { COLLAGE_GRADIENTS, COLLAGE_LAYOUTS, getCollageLayoutById } from '../../lib/collage/layouts';
import { exportCollageToBlob, resolveCollageDimensions } from '../../lib/collage/renderer';
import {
  elementToDataUrl,
  loadImageElement,
  loadImageFromFile,
} from '../../lib/file-handling/imageLoader';
import { createId, extensionForMime, stripExtension, triggerBlobDownload } from '../../lib/utilities/format';
import { SAMPLE_PHOTOS } from '../../lib/utilities/samples';
import {
  COLLAGE_CANVAS_PRESETS,
  CollageLayoutCategory,
  CollageSlotContent,
  CollageState,
  CollageStickerKind,
  CollageStickerLayer,
  CollageTextLayer,
} from '../../types/collage';
import { ExportFormat } from '../../types/image';
import { PixoraProject } from '../../types/project';
import { ExportModal } from '../shared/ExportModal';

interface CollagePhotoPoolItem {
  id: string;
  name: string;
  url: string;
}

interface CollageMakerViewProps {
  initialState?: CollageState;
  initialProjectId?: string;
  initialProjectName?: string;
  autoSaveEnabled?: boolean;
  defaultExportFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  defaultExportQuality: number;
  onSaveProject: (project: PixoraProject) => Promise<void>;
}

const SOLID_BG_SWATCHES = [
  '#FFFFFF',
  '#F8FAFD',
  '#F3EFEA',
  '#E8F0FE',
  '#FCE8E6',
  '#E6F4EA',
  '#202124',
  '#0F141C',
];

const STICKER_KINDS: { kind: CollageStickerKind; label: string }[] = [
  { kind: 'star-burst', label: 'Starburst' },
  { kind: 'spark-diamond', label: 'Spark' },
  { kind: 'tape-strip', label: 'Tape' },
  { kind: 'circle-stamp', label: 'Stamp' },
  { kind: 'corner-frame', label: 'Bracket' },
  { kind: 'film-strip', label: 'Film' },
];

export function createDefaultCollageState(): CollageState {
  const layout = COLLAGE_LAYOUTS[0];
  return {
    templateId: layout.id,
    canvasSizeId: 'ig-post',
    customWidth: 1080,
    customHeight: 1080,
    spacing: 16,
    outerMargin: 24,
    borderRadius: 12,
    shadowIntensity: 20,
    backgroundType: 'solid',
    backgroundColor: '#FFFFFF',
    backgroundGradient: COLLAGE_GRADIENTS[0].css,
    slots: layout.slots.map((s, idx) => ({
      slotId: s.id,
      imageUrl: SAMPLE_PHOTOS[idx % SAMPLE_PHOTOS.length].url,
      imageName: SAMPLE_PHOTOS[idx % SAMPLE_PHOTOS.length].title,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    })),
    customSlotRects: {},
    texts: [],
    stickers: [],
  };
}

export function CollageMakerView({
  initialState,
  initialProjectId,
  initialProjectName,
  autoSaveEnabled = true,
  defaultExportFormat,
  defaultExportQuality,
  onSaveProject,
}: CollageMakerViewProps) {
  const [collage, setCollage] = useState<CollageState>(
    () => initialState ?? createDefaultCollageState()
  );
  const [projectId] = useState(() => initialProjectId ?? createId('collage'));
  const [projectName, setProjectName] = useState(initialProjectName ?? 'Untitled Collage');
  const [createdAt] = useState(() => Date.now());
  const [photoPool, setPhotoPool] = useState<CollagePhotoPoolItem[]>(() => {
    const base = SAMPLE_PHOTOS.map((s) => ({ id: s.id, name: s.title, url: s.url }));
    if (!initialState) return base;
    const extras = initialState.slots
      .filter((s) => s.imageUrl && !base.some((b) => b.url === s.imageUrl))
      .map((s) => ({
        id: createId('pool'),
        name: s.imageName ?? 'Saved photo',
        url: s.imageUrl!,
      }));
    return [...extras, ...base];
  });
  const [activeTab, setActiveTab] = useState<'layouts' | 'style' | 'text' | 'stickers'>('layouts');
  const [layoutFilter, setLayoutFilter] = useState<'all' | CollageLayoutCategory>('all');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('s1');
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [draggedPoolUrl, setDraggedPoolUrl] = useState<{ url: string; name: string } | null>(null);
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const poolFileInputRef = useRef<HTMLInputElement | null>(null);
  const slotReplaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replacingSlotId, setReplacingSlotId] = useState<string | null>(null);

  const [panState, setPanState] = useState<{
    slotId: string;
    startX: number;
    startY: number;
    initOffsetX: number;
    initOffsetY: number;
  } | null>(null);

  const [layerDragState, setLayerDragState] = useState<{
    kind: 'text' | 'sticker';
    id: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

  const activeLayout = useMemo(
    () => getCollageLayoutById(collage.templateId),
    [collage.templateId]
  );

  const dimensions = useMemo(() => resolveCollageDimensions(collage), [collage]);

  const filteredLayouts = useMemo(() => {
    if (layoutFilter === 'all') return COLLAGE_LAYOUTS;
    return COLLAGE_LAYOUTS.filter((l) => l.category === layoutFilter);
  }, [layoutFilter]);

  const selectTemplate = (templateId: string) => {
    const nextLayout = getCollageLayoutById(templateId);
    setCollage((prev) => {
      const existingUrls = prev.slots.filter((s) => s.imageUrl);
      const nextSlots: CollageSlotContent[] = nextLayout.slots.map((rect, idx) => {
        const match = prev.slots.find((s) => s.slotId === rect.id) ?? existingUrls[idx];
        return {
          slotId: rect.id,
          imageUrl: match?.imageUrl ?? photoPool[idx % photoPool.length]?.url ?? null,
          imageName: match?.imageName ?? photoPool[idx % photoPool.length]?.name,
          zoom: match?.zoom ?? 1,
          offsetX: match?.offsetX ?? 0,
          offsetY: match?.offsetY ?? 0,
        };
      });
      return {
        ...prev,
        templateId,
        spacing: nextLayout.defaultSpacing ?? prev.spacing,
        outerMargin: nextLayout.defaultMargin ?? prev.outerMargin,
        borderRadius: nextLayout.defaultRadius ?? prev.borderRadius,
        slots: nextSlots,
        customSlotRects: {},
      };
    });
    setSelectedSlotId(nextLayout.slots[0]?.id ?? 's1');
  };

  const handleUploadPoolFiles = async (files: FileList) => {
    setUploadError(null);
    const added: CollagePhotoPoolItem[] = [];
    for (const file of Array.from(files)) {
      try {
        const { image } = await loadImageFromFile(file);
        added.push({ id: image.id, name: image.name, url: image.objectUrl });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : `Failed to load ${file.name}`);
      }
    }
    if (added.length > 0) {
      setPhotoPool((prev) => [...added, ...prev]);
      // Automatically fill empty slots or selected slot
      setCollage((prev) => {
        let addedIdx = 0;
        const nextSlots = prev.slots.map((slot) => {
          if (!slot.imageUrl && addedIdx < added.length) {
            const pick = added[addedIdx++];
            return { ...slot, imageUrl: pick.url, imageName: pick.name, zoom: 1, offsetX: 0, offsetY: 0 };
          }
          return slot;
        });
        return { ...prev, slots: nextSlots };
      });
    }
  };

  const handleReplaceSingleSlotFile = async (files: FileList) => {
    const file = files[0];
    if (!file || !replacingSlotId) return;
    try {
      const { image } = await loadImageFromFile(file);
      setPhotoPool((prev) => [{ id: image.id, name: image.name, url: image.objectUrl }, ...prev]);
      assignImageToSlot(replacingSlotId, image.objectUrl, image.name);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not load replacement image.');
    } finally {
      setReplacingSlotId(null);
    }
  };

  const assignImageToSlot = (slotId: string, url: string | null, name?: string) => {
    setCollage((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.slotId === slotId ? { ...s, imageUrl: url, imageName: name, zoom: 1, offsetX: 0, offsetY: 0 } : s
      ),
    }));
  };

  const swapSlots = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setCollage((prev) => {
      const src = prev.slots.find((s) => s.slotId === sourceId);
      const tgt = prev.slots.find((s) => s.slotId === targetId);
      if (!src || !tgt) return prev;
      return {
        ...prev,
        slots: prev.slots.map((s) => {
          if (s.slotId === sourceId) {
            return {
              ...s,
              imageUrl: tgt.imageUrl,
              imageName: tgt.imageName,
              zoom: tgt.zoom,
              offsetX: tgt.offsetX,
              offsetY: tgt.offsetY,
            };
          }
          if (s.slotId === targetId) {
            return {
              ...s,
              imageUrl: src.imageUrl,
              imageName: src.imageName,
              zoom: src.zoom,
              offsetX: src.offsetX,
              offsetY: src.offsetY,
            };
          }
          return s;
        }),
      };
    });
  };

  const addTextLayer = () => {
    const next: CollageTextLayer = {
      id: createId('txt'),
      text: 'Summer Notes',
      x: 0.5,
      y: 0.88,
      fontSize: 48,
      color: collage.backgroundColor === '#202124' || collage.backgroundColor === '#0F141C' ? '#FFFFFF' : '#202124',
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: '700',
      align: 'center',
    };
    setCollage((prev) => ({ ...prev, texts: [...prev.texts, next] }));
    setSelectedTextId(next.id);
    setActiveTab('text');
  };

  const addStickerLayer = (kind: CollageStickerKind) => {
    const next: CollageStickerLayer = {
      id: createId('stk'),
      kind,
      x: 0.5,
      y: 0.5,
      size: 110,
      color: '#4285F4',
      rotation: 0,
    };
    setCollage((prev) => ({ ...prev, stickers: [...prev.stickers, next] }));
    setSelectedStickerId(next.id);
    setActiveTab('stickers');
  };

  const serializeCollageForStorage = useCallback(async (sourceState: CollageState): Promise<CollageState> => {
    const persistentSlots = await Promise.all(
      sourceState.slots.map(async (slot) => {
        if (!slot.imageUrl || !slot.imageUrl.startsWith('blob:')) {
          return slot;
        }
        try {
          const el = await loadImageElement(slot.imageUrl);
          const dataUrl = await elementToDataUrl(el, 1400, 'image/jpeg', 0.88);
          return { ...slot, imageUrl: dataUrl };
        } catch {
          return slot;
        }
      })
    );
    return { ...sourceState, slots: persistentSlots };
  }, []);

  const buildCollageProject = useCallback(async (): Promise<PixoraProject> => {
    const persistentCollage = await serializeCollageForStorage(collage);
    const previewBlob = await exportCollageToBlob(persistentCollage, 'image/jpeg', 78);
    const thumbDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.readAsDataURL(previewBlob);
    });
    return {
      id: projectId,
      name: projectName,
      type: 'collage',
      createdAt,
      updatedAt: Date.now(),
      thumbnailDataUrl: thumbDataUrl,
      collageData: { collage: persistentCollage },
    };
  }, [collage, projectId, projectName, createdAt, serializeCollageForStorage]);

  const handleSaveProject = async () => {
    try {
      const project = await buildCollageProject();
      await onSaveProject(project);
      setSaveNotice('Saved to My Projects');
      window.setTimeout(() => setSaveNotice(null), 2400);
    } catch {
      setUploadError('Could not save collage locally.');
    }
  };

  useEffect(() => {
    if (!autoSaveEnabled) return;
    const timer = window.setTimeout(async () => {
      try {
        const project = await buildCollageProject();
        await onSaveProject(project);
      } catch {
        // Ignore silent autosave errors
      }
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [autoSaveEnabled, buildCollageProject, onSaveProject]);

  const handleExport = async (format: ExportFormat, quality: number, filename: string) => {
    const safeFormat: 'image/png' | 'image/jpeg' | 'image/webp' =
      format === 'image/avif' ? 'image/webp' : format;
    setIsExporting(true);
    try {
      const blob = await exportCollageToBlob(collage, safeFormat, quality);
      triggerBlobDownload(blob, `${stripExtension(filename)}.${extensionForMime(safeFormat)}`);
      setExportOpen(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Collage export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedSlot = collage.slots.find((s) => s.slotId === selectedSlotId);
  const selectedSlotRect =
    collage.customSlotRects[selectedSlotId] ??
    activeLayout.slots.find((s) => s.id === selectedSlotId);
  const selectedText = collage.texts.find((t) => t.id === selectedTextId);
  const selectedSticker = collage.stickers.find((s) => s.id === selectedStickerId);

  const stageAspect = dimensions.width / dimensions.height;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col lg:min-h-screen">
      <input
        ref={poolFileInputRef}
        type="file"
        multiple
        accept="image/*,.tif,.tiff,.avif,.svg,.bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void handleUploadPoolFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={slotReplaceInputRef}
        type="file"
        accept="image/*,.tif,.tiff,.avif,.svg,.bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void handleReplaceSingleSlotFile(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Top Collage Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DADCE0] bg-white px-4 py-2.5 dark:border-[#2B3340] dark:bg-[#171E29]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            aria-label="Collage title"
            className="w-40 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-sm font-semibold text-[#202124] hover:border-[#DADCE0] focus:border-[#4285F4] focus:outline-none sm:w-52 dark:text-[#F1F3F4]"
          />
          <span className="hidden font-mono-num text-xs text-[#5F6368] sm:inline dark:text-[#9AA0A6]">
            {dimensions.width} × {dimensions.height}px · {activeLayout.photoCount} frames
          </span>
          {saveNotice && <span className="text-xs font-medium text-[#34A853]">{saveNotice}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => poolFileInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DADCE0] px-3 text-xs font-medium text-[#202124] hover:bg-[#F8FAFD] whitespace-nowrap shrink-0 dark:border-[#2B3340] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Add photos</span>
          </button>

          <button
            type="button"
            onClick={() => void handleSaveProject()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DADCE0] px-3 text-xs font-medium text-[#202124] hover:bg-[#F8FAFD] whitespace-nowrap shrink-0 dark:border-[#2B3340] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>

          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#4285F4] px-4 text-xs font-medium text-white shadow-xs hover:bg-[#1A73E8] whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Collage</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="border-b border-[#EA4335]/30 bg-[#EA4335]/10 px-4 py-2 text-xs text-[#B3261E] dark:text-[#F2B8B5]">
          {uploadError}
        </div>
      )}

      {/* Workspace Split */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left Photo Tray */}
        <aside className="flex w-full shrink-0 flex-col border-b border-[#DADCE0] bg-white p-3 lg:w-52 lg:border-r lg:border-b-0 dark:border-[#2B3340] dark:bg-[#171E29]">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
              Photo Tray
            </span>
            <button
              type="button"
              onClick={() => poolFileInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1A73E8] hover:underline dark:text-[#8AB4F8]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload</span>
            </button>
          </div>
          <p className="mb-2 text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
            Drag any photo onto a frame, or click to place into the selected slot.
          </p>
          <div className="studio-scroll flex gap-2 overflow-x-auto lg:grid lg:grid-cols-2 lg:overflow-y-auto">
            {photoPool.map((item) => (
              <button
                key={item.id}
                type="button"
                draggable
                onDragStart={() => {
                  setDraggedPoolUrl({ url: item.url, name: item.name });
                  setDraggedSlotId(null);
                }}
                onClick={() => assignImageToSlot(selectedSlotId, item.url, item.name)}
                className="group relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg border border-[#DADCE0] bg-[#F1F3F4] lg:w-full dark:border-[#2B3340] dark:bg-[#232B38]"
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </aside>

        {/* Central Interactive Collage Stage */}
        <div className="flex min-h-[420px] flex-1 items-center justify-center overflow-auto bg-[#EFF3F8] p-4 sm:p-8 dark:bg-[#0B0F16]">
          <div
            ref={stageRef}
            onPointerMove={(e) => {
              if (panState && stageRef.current) {
                const dx = (e.clientX - panState.startX) / 140;
                const dy = (e.clientY - panState.startY) / 140;
                setCollage((prev) => ({
                  ...prev,
                  slots: prev.slots.map((s) =>
                    s.slotId === panState.slotId
                      ? {
                          ...s,
                          offsetX: Math.max(-1, Math.min(1, panState.initOffsetX + dx)),
                          offsetY: Math.max(-1, Math.min(1, panState.initOffsetY + dy)),
                        }
                      : s
                  ),
                }));
              } else if (layerDragState && stageRef.current) {
                const rect = stageRef.current.getBoundingClientRect();
                const nx = Math.max(0.05, Math.min(0.95, layerDragState.initX + (e.clientX - layerDragState.startX) / rect.width));
                const ny = Math.max(0.05, Math.min(0.95, layerDragState.initY + (e.clientY - layerDragState.startY) / rect.height));
                if (layerDragState.kind === 'text') {
                  setCollage((prev) => ({
                    ...prev,
                    texts: prev.texts.map((t) =>
                      t.id === layerDragState.id ? { ...t, x: nx, y: ny } : t
                    ),
                  }));
                } else {
                  setCollage((prev) => ({
                    ...prev,
                    stickers: prev.stickers.map((s) =>
                      s.id === layerDragState.id ? { ...s, x: nx, y: ny } : s
                    ),
                  }));
                }
              }
            }}
            onPointerUp={() => {
              setPanState(null);
              setLayerDragState(null);
            }}
            style={{
              aspectRatio: `${dimensions.width} / ${dimensions.height}`,
              width: stageAspect >= 1 ? 'min(100%, 540px)' : 'auto',
              height: stageAspect < 1 ? 'min(64vh, 560px)' : 'auto',
              background:
                collage.backgroundType === 'gradient'
                  ? collage.backgroundGradient
                  : collage.backgroundColor,
            }}
            className="relative overflow-hidden rounded-lg shadow-xl select-none"
          >
            {/* Inner margin stage */}
            <div
              style={{
                top: `${(collage.outerMargin / dimensions.height) * 100}%`,
                bottom: `${(collage.outerMargin / dimensions.height) * 100}%`,
                left: `${(collage.outerMargin / dimensions.width) * 100}%`,
                right: `${(collage.outerMargin / dimensions.width) * 100}%`,
              }}
              className="absolute"
            >
              {activeLayout.slots.map((rectDef) => {
                const rect = collage.customSlotRects[rectDef.id] ?? rectDef;
                const slot = collage.slots.find((s) => s.slotId === rect.id);
                const isSelected = selectedSlotId === rect.id;
                const padXPct = (collage.spacing / dimensions.width) * 50;
                const padYPct = (collage.spacing / dimensions.height) * 50;

                return (
                  <div
                    key={rect.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedPoolUrl) {
                        assignImageToSlot(rect.id, draggedPoolUrl.url, draggedPoolUrl.name);
                        setDraggedPoolUrl(null);
                      } else if (draggedSlotId) {
                        swapSlots(draggedSlotId, rect.id);
                        setDraggedSlotId(null);
                      }
                    }}
                    onClick={() => setSelectedSlotId(rect.id)}
                    style={{
                      left: `calc(${rect.x * 100}% + ${padXPct}%)`,
                      top: `calc(${rect.y * 100}% + ${padYPct}%)`,
                      width: `calc(${rect.w * 100}% - ${padXPct * 2}%)`,
                      height: `calc(${rect.h * 100}% - ${padYPct * 2}%)`,
                      transform: rect.rotation ? `rotate(${rect.rotation}deg)` : undefined,
                      zIndex: rect.zIndex ?? (isSelected ? 5 : 1),
                      borderRadius: `${(collage.borderRadius / dimensions.width) * 520}px`,
                      boxShadow:
                        collage.shadowIntensity > 0
                          ? `0 8px ${(collage.shadowIntensity / 100) * 24}px rgba(15, 23, 42, ${
                              (collage.shadowIntensity / 100) * 0.25
                            })`
                          : undefined,
                    }}
                    className={`group absolute overflow-hidden transition-shadow ${
                      rect.polaroidFrame ? 'bg-white p-[5%] pb-[14%]' : ''
                    } ${isSelected ? 'ring-2 ring-[#4285F4]' : 'ring-1 ring-black/5'}`}
                  >
                    <div
                      onPointerDown={(e) => {
                        if (!slot?.imageUrl || e.shiftKey) return;
                        setSelectedSlotId(rect.id);
                        setPanState({
                          slotId: rect.id,
                          startX: e.clientX,
                          startY: e.clientY,
                          initOffsetX: slot.offsetX,
                          initOffsetY: slot.offsetY,
                        });
                      }}
                      style={{
                        borderRadius: rect.polaroidFrame
                          ? '2px'
                          : `${(collage.borderRadius / dimensions.width) * 520}px`,
                      }}
                      className="relative h-full w-full overflow-hidden bg-[#E8EAED] dark:bg-[#232B38]"
                    >
                      {slot?.imageUrl ? (
                        <img
                          src={slot.imageUrl}
                          alt={slot.imageName ?? 'Collage frame'}
                          draggable={false}
                          style={{
                            transform: `scale(${slot.zoom}) translate(${slot.offsetX * 18}%, ${
                              slot.offsetY * 18
                            }%)`,
                          }}
                          className="h-full w-full cursor-grab object-cover active:cursor-grabbing"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center text-[#5F6368]">
                          <ImagePlus className="h-5 w-5" />
                          <span className="text-[10px]">Drop photo</span>
                        </div>
                      )}

                      {/* Slot quick overlay controls */}
                      {isSelected && (
                        <div className="absolute right-1.5 bottom-1.5 flex items-center gap-1 rounded-lg bg-black/70 p-1 text-white backdrop-blur-xs">
                          <span
                            draggable
                            title="Drag onto another frame to swap photos"
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.setData('text/plain', rect.id);
                              setDraggedSlotId(rect.id);
                              setDraggedPoolUrl(null);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="inline-flex cursor-grab items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] hover:bg-white/20 active:cursor-grabbing"
                          >
                            <GripVertical className="h-3 w-3" />
                            <span>Swap</span>
                          </span>
                          <button
                            type="button"
                            title="Replace photo in frame"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplacingSlotId(rect.id);
                              slotReplaceInputRef.current?.click();
                            }}
                            className="rounded px-1.5 py-0.5 text-[10px] hover:bg-white/20"
                          >
                            Replace
                          </button>
                          {slot?.imageUrl && (
                            <button
                              type="button"
                              title="Clear frame"
                              onClick={(e) => {
                                e.stopPropagation();
                                assignImageToSlot(rect.id, null);
                              }}
                              className="rounded p-0.5 hover:bg-[#EA4335]"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticker Layers */}
            {collage.stickers.map((stk) => (
              <div
                key={stk.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedStickerId(stk.id);
                  setActiveTab('stickers');
                  setLayerDragState({
                    kind: 'sticker',
                    id: stk.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    initX: stk.x,
                    initY: stk.y,
                  });
                }}
                style={{
                  left: `${stk.x * 100}%`,
                  top: `${stk.y * 100}%`,
                  width: `${(stk.size / 1080) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${stk.rotation}deg)`,
                  color: stk.color,
                }}
                className={`absolute z-20 cursor-move p-1 ${
                  selectedStickerId === stk.id ? 'ring-1 ring-dashed ring-[#4285F4]' : ''
                }`}
              >
                <StickerPreviewSvg kind={stk.kind} color={stk.color} />
              </div>
            ))}

            {/* Text Layers */}
            {collage.texts.map((layer) => (
              <div
                key={layer.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedTextId(layer.id);
                  setActiveTab('text');
                  setLayerDragState({
                    kind: 'text',
                    id: layer.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    initX: layer.x,
                    initY: layer.y,
                  });
                }}
                style={{
                  left: `${layer.x * 100}%`,
                  top: `${layer.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${(layer.fontSize / 1080) * 480}px`,
                  color: layer.color,
                  fontFamily: layer.fontFamily,
                  fontWeight: layer.fontWeight,
                  textAlign: layer.align,
                }}
                className={`absolute z-30 cursor-move whitespace-nowrap px-2 py-0.5 ${
                  selectedTextId === layer.id ? 'ring-1 ring-dashed ring-[#4285F4]' : ''
                }`}
              >
                {layer.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Collage Properties Panel */}
        <aside className="flex w-full shrink-0 flex-col border-t border-[#DADCE0] bg-white lg:w-84 lg:border-t-0 lg:border-l dark:border-[#2B3340] dark:bg-[#171E29]">
          <div className="grid grid-cols-4 gap-1 border-b border-[#DADCE0] p-1.5 dark:border-[#2B3340]">
            {[
              { id: 'layouts', label: 'Layouts', icon: LayoutGrid },
              { id: 'style', label: 'Frame', icon: Palette },
              { id: 'text', label: 'Text', icon: Type },
              { id: 'stickers', label: 'Decor', icon: Shapes },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-[11px] font-medium ${
                    active
                      ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#4285F4]/20 dark:text-[#8AB4F8]'
                      : 'text-[#5F6368] hover:bg-[#F8FAFD] dark:text-[#9AA0A6]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="studio-scroll flex-1 space-y-5 overflow-y-auto p-4">
            {activeTab === 'layouts' && (
              <>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
                    Canvas Size
                  </label>
                  <select
                    value={collage.canvasSizeId}
                    onChange={(e) =>
                      setCollage((prev) => ({ ...prev, canvasSizeId: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-2 text-xs text-[#202124] dark:border-[#2B3340] dark:bg-[#0F141C] dark:text-[#F1F3F4]"
                  >
                    {COLLAGE_CANVAS_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>

                  {collage.canvasSizeId === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="number"
                        min={200}
                        max={4096}
                        value={collage.customWidth}
                        onChange={(e) =>
                          setCollage((prev) => ({
                            ...prev,
                            customWidth: Number(e.target.value) || 1080,
                          }))
                        }
                        aria-label="Custom width"
                        className="font-mono-num rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-1.5 text-xs dark:border-[#2B3340] dark:bg-[#0F141C]"
                      />
                      <input
                        type="number"
                        min={200}
                        max={4096}
                        value={collage.customHeight}
                        onChange={(e) =>
                          setCollage((prev) => ({
                            ...prev,
                            customHeight: Number(e.target.value) || 1080,
                          }))
                        }
                        aria-label="Custom height"
                        className="font-mono-num rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-1.5 text-xs dark:border-[#2B3340] dark:bg-[#0F141C]"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {(['all', '2-photo', '3-photo', '4-photo', '5-photo', '6-photo', '8-photo', '9-photo', 'editorial'] as const).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setLayoutFilter(cat)}
                          className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                            layoutFilter === cat
                              ? 'bg-[#4285F4] text-white'
                              : 'bg-[#F1F3F4] text-[#5F6368] dark:bg-[#0F141C] dark:text-[#9AA0A6]'
                          }`}
                        >
                          {cat === 'all' ? 'All' : cat}
                        </button>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {filteredLayouts.map((tpl) => {
                      const active = collage.templateId === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => selectTemplate(tpl.id)}
                          className={`rounded-xl border p-2 text-left transition-colors ${
                            active
                              ? 'border-[#4285F4] bg-[#E8F0FE]/60 dark:border-[#8AB4F8] dark:bg-[#4285F4]/15'
                              : 'border-[#DADCE0] hover:bg-[#F8FAFD] dark:border-[#2B3340] dark:hover:bg-[#1F2735]'
                          }`}
                        >
                          <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-md bg-[#F1F3F4] dark:bg-[#0F141C]">
                            {tpl.slots.map((s) => (
                              <div
                                key={s.id}
                                style={{
                                  left: `${s.x * 100 + 2}%`,
                                  top: `${s.y * 100 + 2}%`,
                                  width: `${s.w * 100 - 4}%`,
                                  height: `${s.h * 100 - 4}%`,
                                  transform: s.rotation ? `rotate(${s.rotation}deg)` : undefined,
                                }}
                                className="absolute rounded-[2px] bg-[#4285F4]/35 border border-[#4285F4]/50"
                              />
                            ))}
                          </div>
                          <p className="truncate text-xs font-medium text-[#202124] dark:text-[#F1F3F4]">
                            {tpl.name}
                          </p>
                          <p className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6]">
                            {tpl.photoCount} photos · {tpl.styleTag}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'style' && (
              <div className="space-y-5">
                {/* Selected Slot Zoom & Frame Resizing */}
                {selectedSlot && selectedSlotRect && (
                  <div className="space-y-3 rounded-xl border border-[#DADCE0] bg-[#F8FAFD] p-3 dark:border-[#2B3340] dark:bg-[#0F141C]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#202124] dark:text-[#F1F3F4]">
                        Selected Frame ({selectedSlotId.toUpperCase()})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextIndex =
                            (activeLayout.slots.findIndex((s) => s.id === selectedSlotId) + 1) %
                            activeLayout.slots.length;
                          swapSlots(selectedSlotId, activeLayout.slots[nextIndex].id);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1A73E8] dark:text-[#8AB4F8]"
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                        <span>Swap next</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Photo Zoom</span>
                        <span className="font-mono-num">{selectedSlot.zoom.toFixed(2)}×</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={2.6}
                        step={0.05}
                        value={selectedSlot.zoom}
                        onChange={(e) =>
                          setCollage((prev) => ({
                            ...prev,
                            slots: prev.slots.map((s) =>
                              s.slotId === selectedSlotId ? { ...s, zoom: Number(e.target.value) } : s
                            ),
                          }))
                        }
                        className="studio-slider w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#5F6368]">Frame Width %</label>
                        <input
                          type="range"
                          min={15}
                          max={100}
                          value={Math.round(selectedSlotRect.w * 100)}
                          onChange={(e) => {
                            const w = Number(e.target.value) / 100;
                            setCollage((prev) => ({
                              ...prev,
                              customSlotRects: {
                                ...prev.customSlotRects,
                                [selectedSlotId]: { ...selectedSlotRect, w },
                              },
                            }));
                          }}
                          className="studio-slider w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#5F6368]">Frame Height %</label>
                        <input
                          type="range"
                          min={15}
                          max={100}
                          value={Math.round(selectedSlotRect.h * 100)}
                          onChange={(e) => {
                            const h = Number(e.target.value) / 100;
                            setCollage((prev) => ({
                              ...prev,
                              customSlotRects: {
                                ...prev.customSlotRects,
                                [selectedSlotId]: { ...selectedSlotRect, h },
                              },
                            }));
                          }}
                          className="studio-slider w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Spacing, Margin, Radius, Shadow */}
                <div className="space-y-3">
                  {[
                    { key: 'spacing' as const, label: 'Frame Spacing', min: 0, max: 48 },
                    { key: 'outerMargin' as const, label: 'Outer Margin', min: 0, max: 80 },
                    { key: 'borderRadius' as const, label: 'Corner Radius', min: 0, max: 48 },
                    { key: 'shadowIntensity' as const, label: 'Drop Shadow', min: 0, max: 100 },
                  ].map((ctrl) => (
                    <div key={ctrl.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{ctrl.label}</span>
                        <span className="font-mono-num">{collage[ctrl.key]}</span>
                      </div>
                      <input
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        value={collage[ctrl.key]}
                        onChange={(e) =>
                          setCollage((prev) => ({ ...prev, [ctrl.key]: Number(e.target.value) }))
                        }
                        className="studio-slider w-full"
                      />
                    </div>
                  ))}
                </div>

                {/* Background Color & Gradient */}
                <div className="space-y-3 border-t border-[#DADCE0] pt-4 dark:border-[#2B3340]">
                  <span className="block text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
                    Canvas Background
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {SOLID_BG_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() =>
                          setCollage((prev) => ({
                            ...prev,
                            backgroundType: 'solid',
                            backgroundColor: hex,
                          }))
                        }
                        style={{ backgroundColor: hex }}
                        aria-label={`Background color ${hex}`}
                        className={`h-7 w-7 rounded-full border ${
                          collage.backgroundType === 'solid' && collage.backgroundColor === hex
                            ? 'ring-2 ring-[#4285F4] ring-offset-2'
                            : 'border-[#DADCE0]'
                        }`}
                      />
                    ))}
                    <label className="flex h-7 cursor-pointer items-center rounded-lg border border-[#DADCE0] px-2 text-[11px] dark:border-[#2B3340]">
                      <span>Custom</span>
                      <input
                        type="color"
                        value={collage.backgroundColor}
                        onChange={(e) =>
                          setCollage((prev) => ({
                            ...prev,
                            backgroundType: 'solid',
                            backgroundColor: e.target.value,
                          }))
                        }
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <span className="block pt-1 text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6]">
                    Gradients
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {COLLAGE_GRADIENTS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        title={g.label}
                        onClick={() =>
                          setCollage((prev) => ({
                            ...prev,
                            backgroundType: 'gradient',
                            backgroundGradient: g.css,
                          }))
                        }
                        style={{ background: g.css }}
                        className={`h-8 rounded-lg border ${
                          collage.backgroundType === 'gradient' &&
                          collage.backgroundGradient === g.css
                            ? 'ring-2 ring-[#4285F4]'
                            : 'border-[#DADCE0]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={addTextLayer}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#4285F4] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A73E8]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add text layer</span>
                </button>

                {selectedText ? (
                  <div className="space-y-3 rounded-xl border border-[#DADCE0] bg-[#F8FAFD] p-3 dark:border-[#2B3340] dark:bg-[#0F141C]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Edit selected text</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCollage((prev) => ({
                            ...prev,
                            texts: prev.texts.filter((t) => t.id !== selectedText.id),
                          }));
                          setSelectedTextId(null);
                        }}
                        className="text-xs text-[#EA4335] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={selectedText.text}
                      onChange={(e) =>
                        setCollage((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === selectedText.id ? { ...t, text: e.target.value } : t
                          ),
                        }))
                      }
                      className="w-full rounded-lg border border-[#DADCE0] bg-white px-3 py-2 text-xs dark:border-[#2B3340] dark:bg-[#171E29]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedText.fontFamily}
                        onChange={(e) =>
                          setCollage((prev) => ({
                            ...prev,
                            texts: prev.texts.map((t) =>
                              t.id === selectedText.id
                                ? {
                                    ...t,
                                    fontFamily: e.target.value as CollageTextLayer['fontFamily'],
                                  }
                                : t
                            ),
                          }))
                        }
                        className="rounded-lg border border-[#DADCE0] bg-white px-2 py-1.5 text-xs dark:border-[#2B3340] dark:bg-[#171E29]"
                      >
                        <option value="Plus Jakarta Sans">Jakarta Sans</option>
                        <option value="DM Sans">DM Sans</option>
                        <option value="Georgia">Georgia Serif</option>
                        <option value="JetBrains Mono">Mono</option>
                      </select>
                      <input
                        type="color"
                        value={selectedText.color}
                        onChange={(e) =>
                          setCollage((prev) => ({
                            ...prev,
                            texts: prev.texts.map((t) =>
                              t.id === selectedText.id ? { ...t, color: e.target.value } : t
                            ),
                          }))
                        }
                        className="h-8 w-full cursor-pointer rounded-lg border border-[#DADCE0] bg-white p-0.5 dark:border-[#2B3340]"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Size</span>
                        <span className="font-mono-num">{selectedText.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={18}
                        max={140}
                        value={selectedText.fontSize}
                        onChange={(e) =>
                          setCollage((prev) => ({
                            ...prev,
                            texts: prev.texts.map((t) =>
                              t.id === selectedText.id
                                ? { ...t, fontSize: Number(e.target.value) }
                                : t
                            ),
                          }))
                        }
                        className="studio-slider w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                    Add a text layer and drag it anywhere on the collage canvas.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'stickers' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {STICKER_KINDS.map((item) => (
                    <button
                      key={item.kind}
                      type="button"
                      onClick={() => addStickerLayer(item.kind)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-[#DADCE0] p-2.5 text-xs hover:border-[#4285F4] dark:border-[#2B3340]"
                    >
                      <div className="h-8 w-8">
                        <StickerPreviewSvg kind={item.kind} color="#4285F4" />
                      </div>
                      <span className="text-[11px]">{item.label}</span>
                    </button>
                  ))}
                </div>

                {selectedSticker && (
                  <div className="space-y-3 rounded-xl border border-[#DADCE0] bg-[#F8FAFD] p-3 dark:border-[#2B3340] dark:bg-[#0F141C]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Edit sticker</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCollage((prev) => ({
                            ...prev,
                            stickers: prev.stickers.filter((s) => s.id !== selectedSticker.id),
                          }));
                          setSelectedStickerId(null);
                        }}
                        className="text-xs text-[#EA4335] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs">Color</span>
                      <input
                        type="color"
                        value={selectedSticker.color}
                        onChange={(e) =>
                          setCollage((prev) => ({
                            ...prev,
                            stickers: prev.stickers.map((s) =>
                              s.id === selectedSticker.id ? { ...s, color: e.target.value } : s
                            ),
                          }))
                        }
                        className="h-8 w-16 cursor-pointer rounded-lg border border-[#DADCE0]"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Size</span>
                        <span className="font-mono-num">{selectedSticker.size}px</span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={280}
                        value={selectedSticker.size}
                        onChange={(e) =>
                          setCollage((prev) => ({
                            ...prev,
                            stickers: prev.stickers.map((s) =>
                              s.id === selectedSticker.id
                                ? { ...s, size: Number(e.target.value) }
                                : s
                            ),
                          }))
                        }
                        className="studio-slider w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Rotation</span>
                        <span className="font-mono-num">{selectedSticker.rotation}°</span>
                      </div>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={selectedSticker.rotation}
                        onChange={(e) =>
                          setCollage((prev) => ({
                            ...prev,
                            stickers: prev.stickers.map((s) =>
                              s.id === selectedSticker.id
                                ? { ...s, rotation: Number(e.target.value) }
                                : s
                            ),
                          }))
                        }
                        className="studio-slider w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <ExportModal
        open={exportOpen}
        title="Export collage"
        defaultFilename={projectName || 'pixora-collage'}
        defaultFormat={defaultExportFormat}
        defaultQuality={defaultExportQuality}
        dimensionsLabel={`${dimensions.width} × ${dimensions.height}px`}
        allowAvif={false}
        isExporting={isExporting}
        onClose={() => setExportOpen(false)}
        onExport={(fmt, q, name) => void handleExport(fmt, q, name)}
      />
    </div>
  );
}

function StickerPreviewSvg({ kind, color }: { kind: CollageStickerKind; color: string }) {
  switch (kind) {
    case 'star-burst':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <polygon
            fill={color}
            points="50,4 58,28 82,18 68,40 94,50 68,60 82,82 58,72 50,96 42,72 18,82 32,60 6,50 32,40 18,18 42,28"
          />
        </svg>
      );
    case 'spark-diamond':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <path fill={color} d="M50 5 Q50 50 95 50 Q50 50 50 95 Q50 50 5 50 Q50 50 50 5Z" />
        </svg>
      );
    case 'tape-strip':
      return (
        <svg viewBox="0 0 120 60" className="h-full w-full">
          <rect x="8" y="14" width="104" height="32" fill={color} fillOpacity="0.72" />
        </svg>
      );
    case 'circle-stamp':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="6" />
          <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="2.5" />
        </svg>
      );
    case 'corner-frame':
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <path
            d="M12 34 V12 H34 M66 12 H88 V34 M12 66 V88 H34 M66 88 H88 V66"
            fill="none"
            stroke={color}
            strokeWidth="7"
          />
        </svg>
      );
    case 'film-strip':
      return (
        <svg viewBox="0 0 120 70" className="h-full w-full">
          <rect x="6" y="8" width="108" height="54" fill="none" stroke={color} strokeWidth="5" />
          <rect x="18" y="14" width="12" height="8" fill={color} />
          <rect x="42" y="14" width="12" height="8" fill={color} />
          <rect x="66" y="14" width="12" height="8" fill={color} />
          <rect x="90" y="14" width="12" height="8" fill={color} />
          <rect x="18" y="48" width="12" height="8" fill={color} />
          <rect x="42" y="48" width="12" height="8" fill={color} />
          <rect x="66" y="48" width="12" height="8" fill={color} />
          <rect x="90" y="48" width="12" height="8" fill={color} />
        </svg>
      );
  }
}

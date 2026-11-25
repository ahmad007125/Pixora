import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Columns2,
  Download,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react';
import { useImageEditor } from '../../hooks/useImageEditor';
import { FILTER_PRESETS, getFilterPresetById } from '../../lib/filters/presets';
import { exportProcessedImage, renderFilterThumbnail } from '../../lib/image-processing/pipeline';
import { extensionForMime, stripExtension, triggerBlobDownload } from '../../lib/utilities/format';
import { SamplePhotoItem } from '../../lib/utilities/samples';
import {
  DEFAULT_ACTIVE_FILTER,
  FilterCategory,
  SavedCustomFilter,
} from '../../types/filters';
import { ExportFormat } from '../../types/image';
import { ComparisonSliderOverlay } from '../shared/ComparisonSlider';
import { DropzoneUpload } from '../shared/DropzoneUpload';
import { ExportModal } from '../shared/ExportModal';

interface CinematicFiltersViewProps {
  editor: ReturnType<typeof useImageEditor>;
  customFilters: SavedCustomFilter[];
  isLoadingUpload: boolean;
  uploadError: string | null;
  uploadWarning: string | null;
  defaultExportFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  defaultExportQuality: number;
  onUploadFiles: (files: FileList) => Promise<void>;
  onSelectSample: (sample: SamplePhotoItem) => Promise<void>;
  onSaveCustomFilter: (filter: SavedCustomFilter) => Promise<void>;
  onDeleteCustomFilter: (id: string) => Promise<void>;
  onOpenInEditor: () => void;
}

const FILTER_CATEGORIES: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All (30)' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'film', label: 'Film' },
  { id: 'creative', label: 'Creative' },
  { id: 'custom', label: 'Saved' },
];

export function CinematicFiltersView({
  editor,
  customFilters,
  isLoadingUpload,
  uploadError,
  uploadWarning,
  defaultExportFormat,
  defaultExportQuality,
  onUploadFiles,
  onSelectSample,
  onSaveCustomFilter,
  onDeleteCustomFilter,
  onOpenInEditor,
}: CinematicFiltersViewProps) {
  const [category, setCategory] = useState<FilterCategory>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [comparePos, setComparePos] = useState(50);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [customName, setCustomName] = useState('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const { loadedImage, imageElement, docState } = editor;

  useEffect(() => {
    editor.requestRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate authentic real-time canvas thumbnail previews for all 30 presets when photo loads
  useEffect(() => {
    if (!imageElement) {
      setThumbnails({});
      return;
    }

    let cancelled = false;
    const nextThumbs: Record<string, string> = {};
    let idx = 0;

    const batchRender = () => {
      if (cancelled) return;
      const batchEnd = Math.min(FILTER_PRESETS.length, idx + 5);
      for (; idx < batchEnd; idx++) {
        const preset = FILTER_PRESETS[idx];
        nextThumbs[preset.id] = renderFilterThumbnail(imageElement, preset.id, 130);
      }
      setThumbnails({ ...nextThumbs });
      if (idx < FILTER_PRESETS.length) {
        window.setTimeout(batchRender, 16);
      }
    };

    nextThumbs['original'] = renderFilterThumbnail(imageElement, null, 130);
    setThumbnails({ ...nextThumbs });
    const timer = window.setTimeout(batchRender, 10);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [imageElement]);

  const filteredPresets = useMemo(() => {
    if (category === 'all') return FILTER_PRESETS;
    if (category === 'custom') return [];
    return FILTER_PRESETS.filter((f) => f.category === category);
  }, [category]);

  const handleSaveCustomPreset = async () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    await onSaveCustomFilter({
      id: `cf_${Date.now().toString(36)}`,
      name: trimmed,
      createdAt: Date.now(),
      state: { ...docState.filter },
      adjustments: {},
    });
    setCustomName('');
    setSaveNotice(`Saved "${trimmed}"`);
    window.setTimeout(() => setSaveNotice(null), 2200);
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
      triggerBlobDownload(blob, `${stripExtension(filename)}.${extensionForMime(format)}`);
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
            Cinematic & Vintage Filters
          </h1>
          <p className="mt-1 text-sm text-[#5F6368] dark:text-[#9AA0A6]">
            Explore 30 real-time film emulations, split-tone color grades, grain textures, and
            custom filter combinations.
          </p>
        </div>
        <DropzoneUpload
          title="Load a photo to preview 30 cinematic filters"
          subtitle="Every filter renders live pixel-accurate color grading directly on your photo."
          isLoading={isLoadingUpload}
          error={uploadError}
          warning={uploadWarning}
          onFilesSelected={(files) => void onUploadFiles(files)}
          onSampleSelected={(sample) => void onSelectSample(sample)}
        />
      </div>
    );
  }

  const activePreset = getFilterPresetById(docState.filter.filterId);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col lg:min-h-screen">
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

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DADCE0] bg-white px-4 py-2.5 dark:border-[#2B3340] dark:bg-[#171E29]">
        <div>
          <h1 className="font-display text-base font-semibold text-[#202124] dark:text-[#F1F3F4]">
            Cinematic Filters
          </h1>
          <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
            {activePreset ? `${activePreset.name} · ${docState.filter.intensity}%` : 'No filter selected'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DADCE0] px-3 text-xs font-medium text-[#202124] hover:bg-[#F8FAFD] whitespace-nowrap shrink-0 dark:border-[#2B3340] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Change photo</span>
          </button>

          <button
            type="button"
            onClick={() => setCompareMode((v) => !v)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium whitespace-nowrap shrink-0 ${
              compareMode
                ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#4285F4]/20 dark:text-[#8AB4F8]'
                : 'border border-[#DADCE0] text-[#5F6368] hover:bg-[#F8FAFD] dark:border-[#2B3340] dark:text-[#9AA0A6]'
            }`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span>Compare</span>
          </button>

          <button
            type="button"
            onClick={onOpenInEditor}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DADCE0] px-3 text-xs font-medium text-[#202124] hover:bg-[#F8FAFD] whitespace-nowrap shrink-0 dark:border-[#2B3340] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Fine-tune in Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#4285F4] px-4 text-xs font-medium text-white shadow-xs hover:bg-[#1A73E8] whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Live Canvas Viewport + Preset Strip */}
        <div className="flex min-w-0 flex-1 flex-col bg-[#EFF3F8] dark:bg-[#0B0F16]">
          <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
            <div className="relative inline-block overflow-hidden rounded-lg shadow-lg">
              <canvas
                ref={editor.previewCanvasRef}
                className="block max-h-[54vh] max-w-full object-contain checkerboard-bg"
              />
              <canvas
                ref={editor.beforeCanvasRef}
                style={{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }}
                className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${
                  compareMode ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {compareMode && (
                <ComparisonSliderOverlay position={comparePos} onChange={setComparePos} />
              )}
            </div>
          </div>

          {/* Filter Category Tabs & Live Thumbnail Grid */}
          <div className="border-t border-[#DADCE0] bg-white p-4 dark:border-[#2B3340] dark:bg-[#171E29]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#F1F3F4] p-1 dark:bg-[#0F141C]">
                {FILTER_CATEGORIES.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-white text-[#202124] shadow-xs dark:bg-[#232B38] dark:text-[#F1F3F4]'
                          : 'text-[#5F6368] hover:text-[#202124] dark:text-[#9AA0A6] dark:hover:text-[#F1F3F4]'
                      }`}
                    >
                      {cat.label}
                      {cat.id === 'custom' && customFilters.length > 0
                        ? ` (${customFilters.length})`
                        : ''}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => editor.updateFilter(() => ({ ...DEFAULT_ACTIVE_FILTER }))}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5F6368] hover:text-[#202124] dark:text-[#9AA0A6]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Clear filter</span>
              </button>
            </div>

            {category === 'custom' ? (
              customFilters.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                  No saved custom combinations yet. Dial in a grade in the right panel and save it.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {customFilters.map((cf) => (
                    <div
                      key={cf.id}
                      className="flex items-center justify-between rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-2.5 dark:border-[#2B3340] dark:bg-[#0F141C]"
                    >
                      <button
                        type="button"
                        onClick={() => editor.updateFilter(() => ({ ...cf.state }))}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-xs font-semibold text-[#202124] dark:text-[#F1F3F4]">
                          {cf.name}
                        </p>
                        <p className="truncate text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                          {getFilterPresetById(cf.state.filterId)?.name ?? 'Custom grade'}
                        </p>
                      </button>
                      <button
                        type="button"
                        title="Delete saved filter"
                        onClick={() => void onDeleteCustomFilter(cf.id)}
                        className="ml-2 text-[#5F6368] hover:text-[#EA4335]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="studio-scroll flex gap-3 overflow-x-auto pb-1">
                {/* Original card */}
                <button
                  type="button"
                  onClick={() =>
                    editor.updateFilter((prev) => ({
                      ...prev,
                      filterId: null,
                    }))
                  }
                  className={`w-28 shrink-0 overflow-hidden rounded-xl border-2 text-left transition-all ${
                    docState.filter.filterId === null
                      ? 'border-[#4285F4]'
                      : 'border-transparent hover:border-[#DADCE0] dark:hover:border-[#2B3340]'
                  }`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#F1F3F4] dark:bg-[#232B38]">
                    {thumbnails['original'] && (
                      <img
                        src={thumbnails['original']}
                        alt="Original"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="bg-white px-2 py-1.5 dark:bg-[#0F141C]">
                    <p className="truncate text-xs font-medium text-[#202124] dark:text-[#F1F3F4]">
                      Original
                    </p>
                    <p className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6]">No grade</p>
                  </div>
                </button>

                {filteredPresets.map((preset) => {
                  const active = docState.filter.filterId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        editor.updateFilter((prev) => ({
                          ...prev,
                          filterId: preset.id,
                          intensity: prev.filterId === preset.id ? prev.intensity : 100,
                        }))
                      }
                      className={`w-28 shrink-0 overflow-hidden rounded-xl border-2 text-left transition-all ${
                        active
                          ? 'border-[#4285F4]'
                          : 'border-transparent hover:border-[#DADCE0] dark:hover:border-[#2B3340]'
                      }`}
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-[#F1F3F4] dark:bg-[#232B38]">
                        {thumbnails[preset.id] ? (
                          <img
                            src={thumbnails[preset.id]}
                            alt={preset.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full animate-pulse bg-[#E8EAED] dark:bg-[#232B38]" />
                        )}
                      </div>
                      <div className="bg-white px-2 py-1.5 dark:bg-[#0F141C]">
                        <p className="truncate text-xs font-medium text-[#202124] dark:text-[#F1F3F4]">
                          {preset.name}
                        </p>
                        <p className="truncate text-[10px] capitalize text-[#5F6368] dark:text-[#9AA0A6]">
                          {preset.category}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Filter Blending & Film Effects Inspector */}
        <aside className="studio-scroll w-full shrink-0 space-y-6 overflow-y-auto border-t border-[#DADCE0] bg-white p-4 lg:w-80 lg:border-t-0 lg:border-l dark:border-[#2B3340] dark:bg-[#171E29]">
          <div>
            <h2 className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
              Primary Filter Intensity
            </h2>
            {activePreset ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#202124] dark:text-[#F1F3F4]">
                    {activePreset.name}
                  </span>
                  <span className="font-mono-num text-[#1A73E8] dark:text-[#8AB4F8]">
                    {docState.filter.intensity}%
                  </span>
                </div>
                <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                  {activePreset.description}
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={docState.filter.intensity}
                  onChange={(e) =>
                    editor.updateFilter(
                      (prev) => ({ ...prev, intensity: Number(e.target.value) }),
                      false
                    )
                  }
                  onMouseUp={() => editor.commitAdjustmentSnapshot()}
                  onTouchEnd={() => editor.commitAdjustmentSnapshot()}
                  className="studio-slider w-full"
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                Select any filter below the canvas to calibrate its intensity.
              </p>
            )}
          </div>

          {/* Combine Secondary Filter */}
          <div className="space-y-2.5 border-t border-[#DADCE0] pt-4 dark:border-[#2B3340]">
            <h2 className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
              Combine Secondary Grade
            </h2>
            <select
              value={docState.filter.secondaryFilterId ?? ''}
              onChange={(e) =>
                editor.updateFilter((prev) => ({
                  ...prev,
                  secondaryFilterId: e.target.value || null,
                }))
              }
              className="w-full rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-2 text-xs text-[#202124] dark:border-[#2B3340] dark:bg-[#0F141C] dark:text-[#F1F3F4]"
            >
              <option value="">None (single filter)</option>
              {FILTER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>

            {docState.filter.secondaryFilterId && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Blend weight</span>
                  <span className="font-mono-num">{docState.filter.secondaryIntensity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={docState.filter.secondaryIntensity}
                  onChange={(e) =>
                    editor.updateFilter(
                      (prev) => ({ ...prev, secondaryIntensity: Number(e.target.value) }),
                      false
                    )
                  }
                  onMouseUp={() => editor.commitAdjustmentSnapshot()}
                  onTouchEnd={() => editor.commitAdjustmentSnapshot()}
                  className="studio-slider w-full"
                />
              </div>
            )}
          </div>

          {/* Analog Film Texture Controls */}
          <div className="space-y-3.5 border-t border-[#DADCE0] pt-4 dark:border-[#2B3340]">
            <h2 className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
              Analog Texture & Optics
            </h2>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Film Grain</span>
                <span className="font-mono-num">{docState.filter.extraGrain}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={docState.filter.extraGrain}
                onChange={(e) =>
                  editor.updateFilter(
                    (prev) => ({ ...prev, extraGrain: Number(e.target.value) }),
                    false
                  )
                }
                onMouseUp={() => editor.commitAdjustmentSnapshot()}
                onTouchEnd={() => editor.commitAdjustmentSnapshot()}
                className="studio-slider w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Faded Blacks</span>
                <span className="font-mono-num">{docState.filter.extraFade}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={docState.filter.extraFade}
                onChange={(e) =>
                  editor.updateFilter(
                    (prev) => ({ ...prev, extraFade: Number(e.target.value) }),
                    false
                  )
                }
                onMouseUp={() => editor.commitAdjustmentSnapshot()}
                onTouchEnd={() => editor.commitAdjustmentSnapshot()}
                className="studio-slider w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Edge Vignette</span>
                <span className="font-mono-num">{docState.filter.extraVignette}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={docState.filter.extraVignette}
                onChange={(e) =>
                  editor.updateFilter(
                    (prev) => ({ ...prev, extraVignette: Number(e.target.value) }),
                    false
                  )
                }
                onMouseUp={() => editor.commitAdjustmentSnapshot()}
                onTouchEnd={() => editor.commitAdjustmentSnapshot()}
                className="studio-slider w-full"
              />
            </div>
          </div>

          {/* Save Custom Combination */}
          <div className="space-y-2.5 border-t border-[#DADCE0] pt-4 dark:border-[#2B3340]">
            <h2 className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
              Save Combination
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Dusk Kodak 35"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-2 text-xs text-[#202124] dark:border-[#2B3340] dark:bg-[#0F141C] dark:text-[#F1F3F4]"
              />
              <button
                type="button"
                disabled={!customName.trim()}
                onClick={() => void handleSaveCustomPreset()}
                className="inline-flex h-9 items-center gap-1 rounded-xl bg-[#4285F4] px-3 text-xs font-medium text-white hover:bg-[#1A73E8] disabled:opacity-45 whitespace-nowrap shrink-0"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>
            </div>
            {saveNotice && <p className="text-xs font-medium text-[#34A853]">{saveNotice}</p>}
          </div>
        </aside>
      </div>

      <ExportModal
        open={exportOpen}
        title="Export graded photo"
        defaultFilename={`${editor.projectName || 'pixora'}-graded`}
        defaultFormat={defaultExportFormat}
        defaultQuality={defaultExportQuality}
        dimensionsLabel={`${loadedImage.width} × ${loadedImage.height}px`}
        isExporting={isExporting}
        onClose={() => setExportOpen(false)}
        onExport={(fmt, q, name) => void handleExport(fmt, q, name)}
      />
    </div>
  );
}

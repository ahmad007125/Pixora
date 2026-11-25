import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Download,
  Eye,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  COMPRESSION_PRESETS,
  CompressedResult,
  CompressionFormat,
  CompressionOptions,
  bundleCompressedZip,
  compressImageSource,
} from '../../lib/compression/compressor';
import { detectSupportedExportFormats, loadImageFromFile, loadImageFromUrl } from '../../lib/file-handling/imageLoader';
import {
  createId,
  extensionForMime,
  formatBytes,
  stripExtension,
  triggerBlobDownload,
} from '../../lib/utilities/format';
import { SamplePhotoItem } from '../../lib/utilities/samples';
import { DropzoneUpload } from '../shared/DropzoneUpload';

interface CompressionQueueItem {
  id: string;
  name: string;
  originalUrl: string;
  originalSize: number;
  width: number;
  height: number;
  result: CompressedResult | null;
  error?: string;
  processing: boolean;
}

export function ImageCompressorView() {
  const support = useMemo(() => detectSupportedExportFormats(), []);
  const [items, setItems] = useState<CompressionQueueItem[]>([]);
  const [options, setOptions] = useState<CompressionOptions>({
    format: support.webp ? 'image/webp' : 'image/jpeg',
    quality: 78,
    maxWidth: null,
    maxHeight: null,
    maintainAspectRatio: true,
    targetSizeKb: null,
  });
  const [activePreset, setActivePreset] = useState<string>('balanced');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<CompressionQueueItem | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const addInputRef = useRef<HTMLInputElement | null>(null);
  const itemsRef = useRef<CompressionQueueItem[]>([]);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.originalUrl.startsWith('blob:')) URL.revokeObjectURL(item.originalUrl);
        if (item.result?.url.startsWith('blob:')) URL.revokeObjectURL(item.result.url);
      }
    };
  }, []);

  const runCompressionForList = async (
    list: CompressionQueueItem[],
    opts: CompressionOptions
  ) => {
    for (const item of list) {
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, processing: true, error: undefined } : x))
      );
      try {
        const result = await compressImageSource(item.originalUrl, opts);
        setItems((prev) =>
          prev.map((x) => {
            if (x.id !== item.id) return x;
            if (x.result?.url.startsWith('blob:')) URL.revokeObjectURL(x.result.url);
            return { ...x, result, processing: false };
          })
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((x) =>
            x.id === item.id
              ? {
                  ...x,
                  processing: false,
                  error: err instanceof Error ? err.message : 'Compression failed.',
                }
              : x
          )
        );
      }
    }
  };

  // Re-compress when options change (debounced)
  useEffect(() => {
    if (items.length === 0) return;
    const timer = window.setTimeout(() => {
      void runCompressionForList(items, options);
    }, 240);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const handleUploadFiles = async (files: FileList) => {
    setUploadError(null);
    const added: CompressionQueueItem[] = [];
    for (const file of Array.from(files)) {
      try {
        const bundle = await loadImageFromFile(file);
        added.push({
          id: createId('cmp'),
          name: bundle.image.name,
          originalUrl: bundle.image.objectUrl,
          originalSize: bundle.image.sizeBytes,
          width: bundle.image.width,
          height: bundle.image.height,
          result: null,
          processing: true,
        });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : `Failed to load ${file.name}`);
      }
    }
    if (added.length > 0) {
      setItems((prev) => [...prev, ...added]);
      void runCompressionForList(added, options);
    }
  };

  const handleSamplePicked = async (sample: SamplePhotoItem) => {
    setUploadError(null);
    try {
      const bundle = await loadImageFromUrl(sample.url, `${sample.id}.jpg`);
      const next: CompressionQueueItem = {
        id: createId('cmp'),
        name: bundle.image.name,
        originalUrl: bundle.image.objectUrl,
        originalSize: bundle.image.sizeBytes,
        width: bundle.image.width,
        height: bundle.image.height,
        result: null,
        processing: true,
      };
      setItems((prev) => [...prev, next]);
      void runCompressionForList([next], options);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not load sample image.');
    }
  };

  const handleDownloadAllZip = async () => {
    const ready = items.filter((i) => i.result);
    if (ready.length === 0) return;
    setIsZipping(true);
    try {
      const zipBlob = await bundleCompressedZip(
        ready.map((i) => ({
          originalName: i.name,
          blob: i.result!.blob,
          format: options.format,
        }))
      );
      triggerBlobDownload(zipBlob, `pixora-compressed-${Date.now()}.zip`);
    } finally {
      setIsZipping(false);
    }
  };

  const totalOriginal = items.reduce((acc, i) => acc + i.originalSize, 0);
  const totalCompressed = items.reduce((acc, i) => acc + (i.result?.sizeBytes ?? i.originalSize), 0);
  const totalSaved = Math.max(0, totalOriginal - totalCompressed);
  const totalPct = totalOriginal > 0 ? Math.round((totalSaved / totalOriginal) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
      <input
        ref={addInputRef}
        type="file"
        multiple
        accept="image/*,.tif,.tiff,.avif,.svg,.bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void handleUploadFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#202124] dark:text-[#F1F3F4]">
            Image Compressor
          </h1>
          <p className="mt-1 text-sm text-[#5F6368] dark:text-[#9AA0A6]">
            Batch compress and convert images to WEBP, JPG, PNG, or AVIF locally with target file
            size optimization and ZIP download.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addInputRef.current?.click()}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#DADCE0] bg-white px-4 text-xs font-medium text-[#202124] hover:bg-[#F8FAFD] whitespace-nowrap shrink-0 dark:border-[#2B3340] dark:bg-[#171E29] dark:text-[#F1F3F4]"
            >
              <Plus className="h-4 w-4" />
              <span>Add images</span>
            </button>
            <button
              type="button"
              disabled={isZipping || items.every((i) => !i.result)}
              onClick={() => void handleDownloadAllZip()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#4285F4] px-4 text-xs font-medium text-white shadow-xs hover:bg-[#1A73E8] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Archive className="h-4 w-4" />
              <span>{isZipping ? 'Creating ZIP…' : 'Download all (.zip)'}</span>
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <DropzoneUpload
          multiple
          title="Drop multiple images to batch compress"
          subtitle="Upload JPG, PNG, WEBP, GIF, BMP, or SVG files to compare original vs compressed sizes and export individually or as a ZIP."
          error={uploadError}
          onFilesSelected={(files) => void handleUploadFiles(files)}
          onSampleSelected={(sample) => void handleSamplePicked(sample)}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Compression Controls Sidebar */}
          <aside className="h-fit space-y-5 rounded-2xl border border-[#DADCE0] bg-white p-5 dark:border-[#2B3340] dark:bg-[#171E29]">
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
                Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                {COMPRESSION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setActivePreset(preset.id);
                      setOptions((prev) => ({
                        ...prev,
                        quality: preset.quality,
                        targetSizeKb: null,
                      }));
                    }}
                    className={`rounded-xl border p-2.5 text-left transition-colors ${
                      activePreset === preset.id
                        ? 'border-[#4285F4] bg-[#E8F0FE]/70 text-[#1A73E8] dark:border-[#8AB4F8] dark:bg-[#4285F4]/15 dark:text-[#8AB4F8]'
                        : 'border-[#DADCE0] hover:bg-[#F8FAFD] dark:border-[#2B3340] dark:hover:bg-[#1F2735]'
                    }`}
                  >
                    <div className="text-xs font-semibold">{preset.label}</div>
                    <div className="mt-0.5 text-[10px] opacity-75">{preset.quality}% quality</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-[#DADCE0] pt-4 dark:border-[#2B3340]">
              <span className="block text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
                Output Format
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'image/webp', label: 'WEBP', ok: support.webp },
                    { id: 'image/jpeg', label: 'JPEG', ok: support.jpeg },
                    { id: 'image/png', label: 'PNG', ok: support.png },
                    { id: 'image/avif', label: 'AVIF', ok: support.avif },
                  ] as { id: CompressionFormat; label: string; ok: boolean }[]
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    disabled={!fmt.ok}
                    onClick={() => setOptions((prev) => ({ ...prev, format: fmt.id }))}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      options.format === fmt.id
                        ? 'border-[#4285F4] bg-[#E8F0FE]/70 text-[#1A73E8] dark:border-[#8AB4F8] dark:bg-[#4285F4]/15 dark:text-[#8AB4F8]'
                        : 'border-[#DADCE0] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#2B3340]'
                    }`}
                  >
                    {fmt.label} {!fmt.ok && '(N/A)'}
                  </button>
                ))}
              </div>
              {!support.avif && (
                <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                  AVIF encoding is unavailable in this browser engine; WEBP offers comparable savings.
                </p>
              )}
            </div>

            {options.format !== 'image/png' && (
              <div className="space-y-2 border-t border-[#DADCE0] pt-4 dark:border-[#2B3340]">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#5F6368] dark:text-[#9AA0A6]">Quality</span>
                  <span className="font-mono-num font-semibold">{options.quality}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={options.quality}
                  onChange={(e) => {
                    setActivePreset('custom');
                    setOptions((prev) => ({ ...prev, quality: Number(e.target.value) }));
                  }}
                  className="studio-slider w-full"
                />

                <div className="pt-2">
                  <label className="mb-1 block text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6]">
                    Target file size (optional KB)
                  </label>
                  <input
                    type="number"
                    min={10}
                    placeholder="e.g. 250"
                    value={options.targetSizeKb ?? ''}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        targetSizeKb: e.target.value ? Math.max(10, Number(e.target.value)) : null,
                      }))
                    }
                    className="font-mono-num w-full rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-2 text-xs dark:border-[#2B3340] dark:bg-[#0F141C]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 border-t border-[#DADCE0] pt-4 dark:border-[#2B3340]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
                  Resize Bounds (px)
                </span>
                <label className="flex items-center gap-1.5 text-[11px]">
                  <input
                    type="checkbox"
                    checked={options.maintainAspectRatio}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, maintainAspectRatio: e.target.checked }))
                    }
                  />
                  <span>Keep ratio</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Max width"
                  value={options.maxWidth ?? ''}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      maxWidth: e.target.value ? Math.max(32, Number(e.target.value)) : null,
                    }))
                  }
                  className="font-mono-num rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-2 text-xs dark:border-[#2B3340] dark:bg-[#0F141C]"
                />
                <input
                  type="number"
                  placeholder="Max height"
                  value={options.maxHeight ?? ''}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      maxHeight: e.target.value ? Math.max(32, Number(e.target.value)) : null,
                    }))
                  }
                  className="font-mono-num rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-2 text-xs dark:border-[#2B3340] dark:bg-[#0F141C]"
                />
              </div>
            </div>
          </aside>

          {/* Batch Queue & Results */}
          <div className="space-y-4">
            {/* Summary Strip */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#DADCE0] bg-white p-4 sm:grid-cols-4 dark:border-[#2B3340] dark:bg-[#171E29]">
              <div>
                <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">Original Total</p>
                <p className="font-mono-num mt-0.5 text-base font-semibold">
                  {formatBytes(totalOriginal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">Compressed Total</p>
                <p className="font-mono-num mt-0.5 text-base font-semibold">
                  {formatBytes(totalCompressed)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">Space Saved</p>
                <p className="font-mono-num mt-0.5 text-base font-semibold text-[#34A853]">
                  {formatBytes(totalSaved)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">Reduction</p>
                <p className="font-mono-num mt-0.5 text-base font-semibold text-[#1A73E8] dark:text-[#8AB4F8]">
                  {totalPct}%
                </p>
              </div>
            </div>

            {uploadError && (
              <div className="rounded-xl border border-[#EA4335]/30 bg-[#EA4335]/10 px-4 py-2.5 text-xs text-[#B3261E]">
                {uploadError}
              </div>
            )}

            {/* File Cards */}
            <div className="space-y-3">
              {items.map((item) => {
                const compressedSize = item.result?.sizeBytes ?? item.originalSize;
                const diff = item.originalSize - compressedSize;
                const pct =
                  item.originalSize > 0 ? Math.round((diff / item.originalSize) * 100) : 0;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-[#DADCE0] bg-white p-4 sm:flex-row sm:items-center dark:border-[#2B3340] dark:bg-[#171E29]"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <img
                        src={item.result?.url ?? item.originalUrl}
                        alt={item.name}
                        className="h-14 w-14 shrink-0 rounded-xl border border-[#DADCE0] object-cover dark:border-[#2B3340]"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#202124] dark:text-[#F1F3F4]">
                          {item.name}
                        </p>
                        <p className="font-mono-num mt-0.5 text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                          {formatBytes(item.originalSize)} →{' '}
                          {item.processing ? 'Compressing…' : formatBytes(compressedSize)}
                          {item.result && (
                            <>
                              {' '}
                              · {item.result.width}×{item.result.height}px
                            </>
                          )}
                        </p>
                        {item.result?.warning && (
                          <p className="mt-1 text-[11px] text-[#B06000] dark:text-[#FDE293]">
                            {item.result.warning}
                          </p>
                        )}
                        {item.error && (
                          <p className="mt-1 text-[11px] text-[#EA4335]">{item.error}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      {item.result && (
                        <span
                          className={`inline-flex items-center gap-1 font-mono-num text-xs font-semibold ${
                            pct >= 0 ? 'text-[#34A853]' : 'text-[#5F6368]'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {pct >= 0 ? `-${pct}%` : `+${Math.abs(pct)}%`}
                        </span>
                      )}

                      {item.result && (
                        <button
                          type="button"
                          title="Compare original & compressed"
                          onClick={() => setPreviewItem(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DADCE0] text-[#5F6368] hover:bg-[#F8FAFD] dark:border-[#2B3340] dark:text-[#9AA0A6]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={!item.result}
                        onClick={() => {
                          if (!item.result) return;
                          triggerBlobDownload(
                            item.result.blob,
                            `${stripExtension(item.name)}-compressed.${extensionForMime(
                              options.format
                            )}`
                          );
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#E8F0FE] px-3 text-xs font-medium text-[#1A73E8] hover:bg-[#D2E3FC] disabled:opacity-40 whitespace-nowrap shrink-0 dark:bg-[#4285F4]/20 dark:text-[#8AB4F8]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        title="Remove from queue"
                        onClick={() => {
                          if (item.originalUrl.startsWith('blob:')) URL.revokeObjectURL(item.originalUrl);
                          if (item.result?.url.startsWith('blob:')) URL.revokeObjectURL(item.result.url);
                          setItems((prev) => prev.filter((x) => x.id !== item.id));
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#EA4335]/10 hover:text-[#EA4335]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Original vs Compressed Inspection Modal */}
      {previewItem && previewItem.result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-4xl rounded-2xl border border-[#DADCE0] bg-white p-5 shadow-2xl dark:border-[#2B3340] dark:bg-[#171E29]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">{previewItem.name}</h2>
                <p className="font-mono-num text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                  Original {formatBytes(previewItem.originalSize)} · Compressed{' '}
                  {formatBytes(previewItem.result.sizeBytes)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#F1F3F4] dark:hover:bg-[#232B38]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-[#5F6368]">
                  Original ({formatBytes(previewItem.originalSize)})
                </p>
                <div className="overflow-hidden rounded-xl border border-[#DADCE0] bg-[#F8FAFD] dark:border-[#2B3340] dark:bg-[#0F141C]">
                  <img
                    src={previewItem.originalUrl}
                    alt="Original"
                    className="max-h-[55vh] w-full object-contain"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-[#1A73E8] dark:text-[#8AB4F8]">
                  Compressed ({formatBytes(previewItem.result.sizeBytes)})
                </p>
                <div className="overflow-hidden rounded-xl border border-[#DADCE0] bg-[#F8FAFD] dark:border-[#2B3340] dark:bg-[#0F141C]">
                  <img
                    src={previewItem.result.url}
                    alt="Compressed"
                    className="max-h-[55vh] w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

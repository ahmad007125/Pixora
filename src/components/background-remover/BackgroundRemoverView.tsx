'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Columns2,
  Download,
  Eraser,
  Image as ImageIcon,
  RefreshCw,
  Upload,
} from 'lucide-react';
import {
  BgRemovalProgress,
  BgReplacementConfig,
  renderCutoutComposite,
  runClientBackgroundRemoval,
} from '../../lib/background-remover/bgRemover';
import { loadImageElement, loadImageFromFile, loadImageFromUrl } from '../../lib/file-handling/imageLoader';
import { stripExtension, triggerBlobDownload } from '../../lib/utilities/format';
import { SamplePhotoItem } from '../../lib/utilities/samples';
import { LoadedImage } from '../../types/image';
import { ComparisonSliderOverlay } from '../shared/ComparisonSlider';
import { DropzoneUpload } from '../shared/DropzoneUpload';

const BG_SWATCHES = ['#FFFFFF', '#F8FAFD', '#E8F0FE', '#FCE8E6', '#E6F4EA', '#FEF7E0', '#202124', '#0F141C'];

const BG_GRADIENTS: { id: string; label: string; from: string; to: string; angle: number }[] = [
  { id: 'sky', label: 'Soft Sky', from: '#E0F2FE', to: '#BAE6FD', angle: 135 },
  { id: 'warm', label: 'Studio Warm', from: '#FEF3C7', to: '#FDE68A', angle: 135 },
  { id: 'blush', label: 'Soft Rose', from: '#FCE7F3', to: '#E0E7FF', angle: 135 },
  { id: 'slate', label: 'Dark Studio', from: '#334155', to: '#0F172A', angle: 135 },
];

export function BackgroundRemoverView() {
  const [sourceImage, setSourceImage] = useState<LoadedImage | null>(null);
  const [sourceEl, setSourceEl] = useState<HTMLImageElement | null>(null);
  const [cutoutEl, setCutoutEl] = useState<HTMLImageElement | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BgRemovalProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [replacement, setReplacement] = useState<BgReplacementConfig>({ type: 'transparent' });
  const [customSolidColor, setCustomSolidColor] = useState('#E8F0FE');
  const [edgeFeather, setEdgeFeather] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePos, setComparePos] = useState(50);

  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const customBgInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (cutoutUrl) URL.revokeObjectURL(cutoutUrl);
    };
  }, [cutoutUrl]);

  useEffect(() => {
    if (!cutoutEl || !outputCanvasRef.current) return;
    renderCutoutComposite(cutoutEl, outputCanvasRef.current, replacement, edgeFeather);
  }, [cutoutEl, replacement, edgeFeather]);

  const handleLoadFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    setUploadError(null);
    setError(null);
    try {
      const bundle = await loadImageFromFile(file);
      if (cutoutUrl) URL.revokeObjectURL(cutoutUrl);
      setSourceImage(bundle.image);
      setSourceEl(bundle.element);
      setCutoutEl(null);
      setCutoutUrl(null);
      setReplacement({ type: 'transparent' });
      setCompareMode(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to open image.');
    }
  };

  const handleSelectSample = async (sample: SamplePhotoItem) => {
    setUploadError(null);
    setError(null);
    try {
      const bundle = await loadImageFromUrl(sample.url, `${sample.id}.jpg`);
      if (cutoutUrl) URL.revokeObjectURL(cutoutUrl);
      setSourceImage(bundle.image);
      setSourceEl(bundle.element);
      setCutoutEl(null);
      setCutoutUrl(null);
      setReplacement({ type: 'transparent' });
      setCompareMode(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not load sample.');
    }
  };

  const handleRunRemoval = async () => {
    if (!sourceImage) return;
    setIsProcessing(true);
    setError(null);
    setProgress({
      stage: 'loading-model',
      progressPct: 5,
      detail: 'Preparing local AI segmentation model…',
    });

    try {
      const resultBlob = await runClientBackgroundRemoval(sourceImage.objectUrl, (info) =>
        setProgress(info)
      );
      const nextUrl = URL.createObjectURL(resultBlob);
      const nextEl = await loadImageElement(nextUrl);
      if (cutoutUrl) URL.revokeObjectURL(cutoutUrl);
      setCutoutUrl(nextUrl);
      setCutoutEl(nextEl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        `Local AI background removal could not complete in this browser environment (${msg}). Ensure WebAssembly is enabled and network access is available for the first-time ONNX model download.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadCustomBackground = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    try {
      const bundle = await loadImageFromFile(file);
      setReplacement({ type: 'image', imageElement: bundle.element });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load background photo.');
    }
  };

  const handleDownloadPng = () => {
    if (!outputCanvasRef.current || !sourceImage) return;
    outputCanvasRef.current.toBlob((blob) => {
      if (!blob) return;
      triggerBlobDownload(blob, `${stripExtension(sourceImage.name)}-cutout.png`);
    }, 'image/png');
  };

  if (!sourceImage || !sourceEl) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-4 py-10 sm:px-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-[#202124] dark:text-[#F1F3F4]">
            Background Remover
          </h1>
          <p className="mt-1 text-sm text-[#5F6368] dark:text-[#9AA0A6]">
            Remove image backgrounds locally in your browser using client-side AI segmentation and
            export transparent PNGs or swap in new studio backdrops.
          </p>
        </div>

        <DropzoneUpload
          title="Upload a photo to remove its background"
          subtitle="First use downloads an open-source ONNX segmentation model (~40 MB) directly to your browser cache. Your photos never leave your device."
          error={uploadError}
          onFilesSelected={(files) => void handleLoadFiles(files)}
          onSampleSelected={(sample) => void handleSelectSample(sample)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col lg:min-h-screen">
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,.tif,.tiff,.avif,.svg,.bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void handleLoadFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={customBgInputRef}
        type="file"
        accept="image/*,.tif,.tiff,.avif,.svg,.bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void handleUploadCustomBackground(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DADCE0] bg-white px-4 py-2.5 dark:border-[#2B3340] dark:bg-[#171E29]">
        <div>
          <h1 className="font-display text-base font-semibold text-[#202124] dark:text-[#F1F3F4]">
            Background Remover
          </h1>
          <p className="font-mono-num text-xs text-[#5F6368] dark:text-[#9AA0A6]">
            {sourceImage.name} · {sourceImage.width} × {sourceImage.height}px
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DADCE0] px-3 text-xs font-medium text-[#202124] hover:bg-[#F8FAFD] whitespace-nowrap shrink-0 dark:border-[#2B3340] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Change photo</span>
          </button>

          {cutoutEl && (
            <button
              type="button"
              onClick={() => setCompareMode((v) => !v)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium whitespace-nowrap shrink-0 ${
                compareMode
                  ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#4285F4]/20 dark:text-[#8AB4F8]'
                  : 'border border-[#DADCE0] text-[#5F6368] dark:border-[#2B3340] dark:text-[#9AA0A6]'
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span>Compare</span>
            </button>
          )}

          {!cutoutEl ? (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => void handleRunRemoval()}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#4285F4] px-4 text-xs font-medium text-white shadow-xs hover:bg-[#1A73E8] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Eraser className="h-3.5 w-3.5" />
              <span>{isProcessing ? 'Removing…' : 'Remove background'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#4285F4] px-4 text-xs font-medium text-white shadow-xs hover:bg-[#1A73E8] whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PNG</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Preview Stage */}
        <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center bg-[#EFF3F8] p-4 sm:p-8 dark:bg-[#0B0F16]">
          <div className="relative inline-block overflow-hidden rounded-xl shadow-lg">
            {cutoutEl ? (
              <>
                <canvas
                  ref={outputCanvasRef}
                  className={`block max-h-[64vh] max-w-full object-contain ${
                    replacement.type === 'transparent' ? 'checkerboard-bg' : ''
                  }`}
                />
                {compareMode && (
                  <>
                    <img
                      src={sourceImage.objectUrl}
                      alt="Original"
                      style={{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }}
                      className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                    />
                    <ComparisonSliderOverlay
                      position={comparePos}
                      onChange={setComparePos}
                      leftLabel="Original"
                      rightLabel="Cutout"
                    />
                  </>
                )}
              </>
            ) : (
              <img
                src={sourceImage.objectUrl}
                alt={sourceImage.name}
                className="block max-h-[64vh] max-w-full object-contain"
              />
            )}
          </div>

          {isProcessing && progress && (
            <div className="mt-5 w-full max-w-md rounded-2xl border border-[#DADCE0] bg-white p-4 shadow-sm dark:border-[#2B3340] dark:bg-[#171E29]">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#202124] dark:text-[#F1F3F4]">{progress.detail}</span>
                <span className="font-mono-num text-[#1A73E8] dark:text-[#8AB4F8]">
                  {progress.progressPct}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E8EAED] dark:bg-[#232B38]">
                <div
                  style={{ width: `${progress.progressPct}%` }}
                  className="h-full rounded-full bg-[#4285F4] transition-all duration-200"
                />
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 flex max-w-lg items-start gap-3 rounded-2xl border border-[#EA4335]/35 bg-[#EA4335]/10 p-4 text-xs leading-relaxed text-[#B3261E] dark:text-[#F2B8B5]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Background removal failed</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Backdrop Replacement Panel */}
        <aside className="studio-scroll w-full shrink-0 space-y-6 overflow-y-auto border-t border-[#DADCE0] bg-white p-4 lg:w-80 lg:border-t-0 lg:border-l dark:border-[#2B3340] dark:bg-[#171E29]">
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
              AI Cutout Action
            </h2>
            <p className="text-xs leading-relaxed text-[#5F6368] dark:text-[#9AA0A6]">
              Runs entirely on your device using WebAssembly ONNX segmentation. First run caches
              the AI model locally (~40 MB).
            </p>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => void handleRunRemoval()}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#4285F4] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A73E8] disabled:opacity-60"
            >
              <Eraser className="h-4 w-4" />
              <span>{cutoutEl ? 'Re-run segmentation' : 'Remove background now'}</span>
            </button>
          </div>

          <div
            className={`space-y-4 border-t border-[#DADCE0] pt-4 dark:border-[#2B3340] ${
              !cutoutEl ? 'pointer-events-none opacity-45' : ''
            }`}
          >
            <h2 className="text-xs font-semibold text-[#5F6368] dark:text-[#9AA0A6]">
              Replace Background
            </h2>

            <button
              type="button"
              onClick={() => setReplacement({ type: 'transparent' })}
              className={`flex min-h-10 w-full items-center gap-3 rounded-xl border px-3 py-2 text-xs font-medium ${
                replacement.type === 'transparent'
                  ? 'border-[#4285F4] bg-[#E8F0FE]/70 text-[#1A73E8] dark:border-[#8AB4F8] dark:bg-[#4285F4]/15 dark:text-[#8AB4F8]'
                  : 'border-[#DADCE0] dark:border-[#2B3340]'
              }`}
            >
              <span className="h-5 w-5 rounded border border-[#DADCE0] checkerboard-bg" />
              <span>Transparent (Alpha PNG)</span>
            </button>

            <div className="space-y-2">
              <span className="block text-[11px] font-medium text-[#5F6368] dark:text-[#9AA0A6]">
                Solid Colors
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {BG_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setReplacement({ type: 'solid', color: hex })}
                    style={{ backgroundColor: hex }}
                    aria-label={`Solid color ${hex}`}
                    className={`h-7 w-7 rounded-full border ${
                      replacement.type === 'solid' && replacement.color === hex
                        ? 'ring-2 ring-[#4285F4] ring-offset-2'
                        : 'border-[#DADCE0]'
                    }`}
                  />
                ))}
                <label className="flex h-7 cursor-pointer items-center rounded-lg border border-[#DADCE0] px-2 text-[11px] dark:border-[#2B3340]">
                  <span>Custom</span>
                  <input
                    type="color"
                    value={customSolidColor}
                    onChange={(e) => {
                      setCustomSolidColor(e.target.value);
                      setReplacement({ type: 'solid', color: e.target.value });
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[11px] font-medium text-[#5F6368] dark:text-[#9AA0A6]">
                Gradients
              </span>
              <div className="grid grid-cols-2 gap-2">
                {BG_GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() =>
                      setReplacement({
                        type: 'gradient',
                        from: g.from,
                        to: g.to,
                        angleDeg: g.angle,
                      })
                    }
                    style={{ background: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})` }}
                    className="h-9 rounded-xl border border-[#DADCE0] px-2 text-[11px] font-medium text-[#202124] shadow-2xs dark:border-[#2B3340]"
                  >
                    <span className="rounded bg-white/75 px-1.5 py-0.5">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[11px] font-medium text-[#5F6368] dark:text-[#9AA0A6]">
                Custom Image Backdrop
              </span>
              <button
                type="button"
                onClick={() => customBgInputRef.current?.click()}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#DADCE0] px-3 py-2 text-xs font-medium hover:bg-[#F8FAFD] dark:border-[#2B3340] dark:hover:bg-[#1F2735]"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Upload background image</span>
              </button>
            </div>

            <div className="space-y-1 border-t border-[#DADCE0] pt-3 dark:border-[#2B3340]">
              <div className="flex justify-between text-xs">
                <span>Edge Softness</span>
                <span className="font-mono-num">{edgeFeather}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={6}
                step={0.5}
                value={edgeFeather}
                onChange={(e) => setEdgeFeather(Number(e.target.value))}
                className="studio-slider w-full"
              />
            </div>

            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#34A853] px-4 py-2 text-xs font-medium text-white hover:bg-[#2B9348]"
            >
              <Download className="h-4 w-4" />
              <span>Download Transparent PNG</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

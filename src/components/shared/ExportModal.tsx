'use client';

import { useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';
import { detectSupportedExportFormats } from '../../lib/file-handling/imageLoader';
import { ExportFormat } from '../../types/image';

interface ExportModalProps {
  open: boolean;
  title?: string;
  defaultFilename: string;
  defaultFormat?: ExportFormat;
  defaultQuality?: number;
  dimensionsLabel?: string;
  hasTransparencyNotice?: boolean;
  allowAvif?: boolean;
  isExporting?: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, quality: number, filename: string) => void;
}

export function ExportModal({
  open,
  title = 'Export image',
  defaultFilename,
  defaultFormat = 'image/png',
  defaultQuality = 92,
  dimensionsLabel,
  hasTransparencyNotice = false,
  allowAvif = true,
  isExporting = false,
  onClose,
  onExport,
}: ExportModalProps) {
  const support = useMemo(() => detectSupportedExportFormats(), []);
  const [filename, setFilename] = useState(defaultFilename);
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);
  const [quality, setQuality] = useState(defaultQuality);

  if (!open) return null;

  const formats: { id: ExportFormat; label: string; note: string; supported: boolean }[] = [
    { id: 'image/png', label: 'PNG', note: 'Lossless · Transparency', supported: support.png },
    { id: 'image/jpeg', label: 'JPG', note: 'Compact · Universal', supported: support.jpeg },
    { id: 'image/webp', label: 'WEBP', note: 'Modern · Transparency', supported: support.webp },
    ...(allowAvif
      ? [
          {
            id: 'image/avif' as ExportFormat,
            label: 'AVIF',
            note: support.avif ? 'Next-gen · High ratio' : 'Unsupported by browser',
            supported: support.avif,
          },
        ]
      : []),
  ];

  const isLossless = format === 'image/png';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#DADCE0] bg-white p-6 shadow-xl dark:border-[#2B3340] dark:bg-[#171E29]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2
              id="export-modal-title"
              className="text-lg font-semibold text-[#202124] dark:text-[#F1F3F4]"
            >
              {title}
            </h2>
            {dimensionsLabel && (
              <p className="mt-0.5 font-mono-num text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                Output resolution · {dimensionsLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export dialog"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#232B38]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="export-filename"
              className="mb-1.5 block text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6]"
            >
              File name
            </label>
            <input
              id="export-filename"
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3.5 py-2.5 text-sm text-[#202124] outline-none focus:border-[#4285F4] dark:border-[#2B3340] dark:bg-[#0F141C] dark:text-[#F1F3F4]"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6]">
              Format
            </span>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((f) => {
                const active = format === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={!f.supported}
                    onClick={() => setFormat(f.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? 'border-[#4285F4] bg-[#E8F0FE]/70 text-[#1A73E8] dark:border-[#8AB4F8] dark:bg-[#4285F4]/15 dark:text-[#8AB4F8]'
                        : 'border-[#DADCE0] bg-white text-[#202124] hover:bg-[#F8FAFD] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#2B3340] dark:bg-[#0F141C] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]'
                    }`}
                  >
                    <div className="text-sm font-semibold">{f.label}</div>
                    <div className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">{f.note}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {!isLossless && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-[#5F6368] dark:text-[#9AA0A6]">Quality</span>
                <span className="font-mono-num font-semibold text-[#202124] dark:text-[#F1F3F4]">
                  {quality}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="studio-slider w-full"
              />
            </div>
          )}

          {hasTransparencyNotice && format === 'image/jpeg' && (
            <p className="rounded-xl border border-[#FBBC04]/40 bg-[#FBBC04]/10 px-3 py-2 text-xs text-[#7A5900] dark:text-[#FDE293]">
              JPG does not support transparency. Transparent regions will be filled with white. Choose
              PNG or WEBP to preserve alpha transparency.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-xl border border-[#DADCE0] px-4 py-2 text-sm font-medium text-[#202124] hover:bg-[#F8FAFD] whitespace-nowrap shrink-0 dark:border-[#2B3340] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={() => onExport(format, quality, filename.trim() || defaultFilename)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#4285F4] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1A73E8] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Rendering…' : 'Download'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

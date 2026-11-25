import React, { useRef, useState } from 'react';
import { FolderOpen, ImagePlus, UploadCloud } from 'lucide-react';
import { ACCEPTED_EXTENSIONS } from '../../lib/file-handling/imageLoader';
import { SAMPLE_PHOTOS, SamplePhotoItem } from '../../lib/utilities/samples';

interface DropzoneUploadProps {
  multiple?: boolean;
  compact?: boolean;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  showSamples?: boolean;
  isLoading?: boolean;
  error?: string | null;
  warning?: string | null;
  onFilesSelected: (files: FileList) => void;
  onSampleSelected?: (sample: SamplePhotoItem) => void;
}

export function DropzoneUpload({
  multiple = false,
  compact = false,
  title = 'Drop your photos here',
  subtitle = 'Supports JPG, PNG, WEBP, GIF, BMP, TIFF, AVIF, and SVG. Processing stays 100% private in your browser.',
  buttonLabel = 'Browse files',
  showSamples = true,
  isLoading = false,
  error = null,
  warning = null,
  onFilesSelected,
  onSampleSelected,
}: DropzoneUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors ${
          compact ? 'px-6 py-8' : 'px-6 py-12 sm:px-10 sm:py-14'
        } ${
          isDragging
            ? 'border-[#4285F4] bg-[#E8F0FE]/70 dark:border-[#8AB4F8] dark:bg-[#4285F4]/15'
            : 'border-[#DADCE0] bg-white hover:border-[#4285F4]/60 dark:border-[#2B3340] dark:bg-[#171E29] dark:hover:border-[#8AB4F8]/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFilesSelected(e.target.files);
              e.target.value = '';
            }
          }}
        />

        <div className="mb-4 flex h-13 w-13 items-center justify-center rounded-2xl bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#4285F4]/15 dark:text-[#8AB4F8]">
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#4285F4] border-t-transparent" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
        </div>

        <h3 className="text-lg font-semibold text-[#202124] dark:text-[#F1F3F4]">{title}</h3>
        <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-[#5F6368] dark:text-[#9AA0A6]">
          {subtitle}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#4285F4] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1A73E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285F4] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <FolderOpen className="h-4 w-4" />
            <span>{isLoading ? 'Loading image…' : buttonLabel}</span>
          </button>
          <span className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
            {multiple ? 'Select multiple images or drag onto canvas' : 'Or drag & drop directly'}
          </span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-[#EA4335]/30 bg-[#EA4335]/8 px-4 py-3 text-sm text-[#B3261E] dark:border-[#EA4335]/40 dark:bg-[#EA4335]/15 dark:text-[#F2B8B5]"
        >
          {error}
        </div>
      )}

      {warning && (
        <div
          role="status"
          className="rounded-xl border border-[#FBBC04]/40 bg-[#FBBC04]/10 px-4 py-3 text-sm text-[#7A5900] dark:border-[#FBBC04]/40 dark:bg-[#FBBC04]/15 dark:text-[#FDE293]"
        >
          {warning}
        </div>
      )}

      {showSamples && onSampleSelected && (
        <div className="pt-1">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6]">
              <ImagePlus className="h-3.5 w-3.5" />
              <span>Start instantly with a studio sample</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {SAMPLE_PHOTOS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSampleSelected(sample)}
                className="group overflow-hidden rounded-xl border border-[#DADCE0] bg-white text-left transition-all hover:border-[#4285F4] hover:shadow-sm dark:border-[#2B3340] dark:bg-[#171E29] dark:hover:border-[#8AB4F8]"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#F1F3F4] dark:bg-[#232B38]">
                  <img
                    src={sample.url}
                    alt={sample.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs font-medium text-[#202124] dark:text-[#F1F3F4]">
                    {sample.title}
                  </p>
                  <p className="truncate text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                    {sample.category} · {sample.aspectLabel}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

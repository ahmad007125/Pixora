'use client';

import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#DADCE0] bg-white p-6 shadow-xl dark:border-[#2B3340] dark:bg-[#171E29]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {destructive && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EA4335]/10 text-[#EA4335]">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-[#202124] dark:text-[#F1F3F4]"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#232B38]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#5F6368] dark:text-[#9AA0A6]">
          {description}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-10 rounded-xl border border-[#DADCE0] px-4 py-2 text-sm font-medium text-[#202124] transition-colors hover:bg-[#F8FAFD] whitespace-nowrap shrink-0 dark:border-[#2B3340] dark:text-[#F1F3F4] dark:hover:bg-[#1F2735]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-10 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0 ${
              destructive
                ? 'bg-[#EA4335] hover:bg-[#D93025]'
                : 'bg-[#4285F4] hover:bg-[#1A73E8]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

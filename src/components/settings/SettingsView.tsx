'use client';

import React, { useMemo, useState } from 'react';
import { Check, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-react';
import { detectSupportedExportFormats } from '../../lib/file-handling/imageLoader';
import { formatBytes } from '../../lib/utilities/format';
import { StorageStats, UserSettings } from '../../types/project';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface SettingsViewProps {
  settings: UserSettings;
  storageStats: StorageStats;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onClearAllProjects: () => Promise<void>;
}

export function SettingsView({
  settings,
  storageStats,
  onUpdateSettings,
  onClearAllProjects,
}: SettingsViewProps) {
  const formatSupport = useMemo(() => detectSupportedExportFormats(), []);
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6 px-4 py-8 sm:px-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#202124] dark:text-[#F1F3F4]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#5F6368] dark:text-[#9AA0A6]">
          Customize appearance, export defaults, and local browser storage behavior.
        </p>
      </div>

      {/* Appearance */}
      <section className="rounded-2xl border border-[#DADCE0] bg-white p-6 dark:border-[#2B3340] dark:bg-[#171E29]">
        <h2 className="font-display text-base font-semibold text-[#202124] dark:text-[#F1F3F4]">
          Appearance
        </h2>
        <p className="mt-1 text-xs text-[#5F6368] dark:text-[#9AA0A6]">
          Switch between light studio canvas (default) and dark mode.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
          <button
            type="button"
            onClick={() => onUpdateSettings({ theme: 'light' })}
            className={`flex min-h-11 items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium ${
              settings.theme === 'light'
                ? 'border-[#4285F4] bg-[#E8F0FE]/70 text-[#1A73E8]'
                : 'border-[#DADCE0] text-[#5F6368] dark:border-[#2B3340] dark:text-[#9AA0A6]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </span>
            {settings.theme === 'light' && <Check className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ theme: 'dark' })}
            className={`flex min-h-11 items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium ${
              settings.theme === 'dark'
                ? 'border-[#8AB4F8] bg-[#4285F4]/20 text-[#8AB4F8]'
                : 'border-[#DADCE0] text-[#5F6368] dark:border-[#2B3340] dark:text-[#9AA0A6]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </span>
            {settings.theme === 'dark' && <Check className="h-4 w-4" />}
          </button>
        </div>
      </section>

      {/* Export Defaults */}
      <section className="space-y-4 rounded-2xl border border-[#DADCE0] bg-white p-6 dark:border-[#2B3340] dark:bg-[#171E29]">
        <div>
          <h2 className="font-display text-base font-semibold text-[#202124] dark:text-[#F1F3F4]">
            Export Preferences
          </h2>
          <p className="mt-1 text-xs text-[#5F6368] dark:text-[#9AA0A6]">
            Used as initial defaults when opening the export dialog.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6]">
              Default Format
            </label>
            <select
              value={settings.defaultExportFormat}
              onChange={(e) =>
                onUpdateSettings({
                  defaultExportFormat: e.target.value as UserSettings['defaultExportFormat'],
                })
              }
              className="w-full rounded-xl border border-[#DADCE0] bg-[#F8FAFD] px-3 py-2.5 text-sm dark:border-[#2B3340] dark:bg-[#0F141C]"
            >
              <option value="image/png">PNG (Lossless · Transparency)</option>
              <option value="image/jpeg">JPG (Universal)</option>
              {formatSupport.webp && <option value="image/webp">WEBP (Compact · Transparency)</option>}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-[#5F6368] dark:text-[#9AA0A6]">
                Default Quality (JPG / WEBP)
              </span>
              <span className="font-mono-num font-semibold">{settings.defaultExportQuality}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={settings.defaultExportQuality}
              onChange={(e) =>
                onUpdateSettings({ defaultExportQuality: Number(e.target.value) })
              }
              className="studio-slider mt-3 w-full"
            />
          </div>
        </div>
      </section>

      {/* Autosave & Storage */}
      <section className="space-y-4 rounded-2xl border border-[#DADCE0] bg-white p-6 dark:border-[#2B3340] dark:bg-[#171E29]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#202124] dark:text-[#F1F3F4]">
              Local Autosave
            </h2>
            <p className="mt-1 text-xs text-[#5F6368] dark:text-[#9AA0A6]">
              Automatically saves photo editor changes to IndexedDB so work survives page
              refreshes.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={settings.autoSaveEnabled}
            onClick={() => onUpdateSettings({ autoSaveEnabled: !settings.autoSaveEnabled })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              settings.autoSaveEnabled ? 'bg-[#4285F4]' : 'bg-[#DADCE0] dark:bg-[#2B3340]'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                settings.autoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DADCE0] pt-4 dark:border-[#2B3340]">
          <div className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
            {storageStats.supported
              ? `Using ${formatBytes(storageStats.usedBytes)} across ${storageStats.projectCount} saved projects.`
              : `${storageStats.projectCount} projects saved locally.`}
          </div>

          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#EA4335]/35 px-3 text-xs font-medium text-[#EA4335] hover:bg-[#EA4335]/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear all projects</span>
          </button>
        </div>
      </section>

      {/* Browser Capabilities & Privacy */}
      <section className="rounded-2xl border border-[#DADCE0] bg-white p-6 dark:border-[#2B3340] dark:bg-[#171E29]">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#34A853]" />
          <div className="space-y-2">
            <h2 className="font-display text-base font-semibold text-[#202124] dark:text-[#F1F3F4]">
              100% Client-Side Privacy & Browser Capabilities
            </h2>
            <p className="text-xs leading-relaxed text-[#5F6368] dark:text-[#9AA0A6]">
              All adjustments, filters, collage rendering, image compression, and AI background
              removal execute inside your browser. No images are uploaded to external servers.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono-num text-xs text-[#5F6368] dark:text-[#9AA0A6]">
              <span>PNG export: Supported</span>
              <span>JPG export: Supported</span>
              <span>WEBP export: {formatSupport.webp ? 'Supported' : 'Unsupported'}</span>
              <span>AVIF export: {formatSupport.avif ? 'Supported' : 'Unsupported'}</span>
            </div>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={clearOpen}
        title="Clear all saved projects?"
        description="This permanently removes every project stored in IndexedDB on this browser."
        confirmLabel="Delete all"
        destructive
        onConfirm={() => {
          void onClearAllProjects();
          setClearOpen(false);
        }}
        onCancel={() => setClearOpen(false)}
      />
    </div>
  );
}

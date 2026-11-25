'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Edit3,
  FolderKanban,
  HardDrive,
  LayoutGrid,
  Plus,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { formatBytes, formatRelativeDate } from '../../lib/utilities/format';
import { PixoraProject, StorageStats, StudioView } from '../../types/project';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface ProjectsViewProps {
  projects: PixoraProject[];
  storageStats: StorageStats;
  isLoading: boolean;
  storageError: string | null;
  onOpenProject: (project: PixoraProject) => void;
  onRenameProject: (id: string, nextName: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onClearAllProjects: () => Promise<void>;
  onCreateNew: (targetView: StudioView) => void;
}

export function ProjectsView({
  projects,
  storageStats,
  isLoading,
  storageError,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
  onClearAllProjects,
  onCreateNew,
}: ProjectsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PixoraProject | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  const isStorageHigh = storageStats.supported && storageStats.percentUsed >= 80;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#202124] dark:text-[#F1F3F4]">
            My Projects
          </h1>
          <p className="mt-1 text-sm text-[#5F6368] dark:text-[#9AA0A6]">
            Projects, edits, and collage layouts are persisted locally in IndexedDB and restored
            across refreshes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onCreateNew('editor')}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#4285F4] px-4 text-xs font-medium text-white hover:bg-[#1A73E8] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Photo Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onCreateNew('collage')}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#DADCE0] bg-white px-4 text-xs font-medium text-[#202124] hover:bg-[#F8FAFD] whitespace-nowrap shrink-0 dark:border-[#2B3340] dark:bg-[#171E29] dark:text-[#F1F3F4]"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>New Collage</span>
          </button>
        </div>
      </div>

      {/* Local Storage Indicator */}
      <div className="mb-6 rounded-2xl border border-[#DADCE0] bg-white p-4 dark:border-[#2B3340] dark:bg-[#171E29]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#4285F4]/15 dark:text-[#8AB4F8]">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#202124] dark:text-[#F1F3F4]">
                Local Browser Storage
              </p>
              <p className="font-mono-num text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                {storageStats.supported
                  ? `${formatBytes(storageStats.usedBytes)} used of ${formatBytes(
                      storageStats.quotaBytes
                    )} (${storageStats.percentUsed.toFixed(1)}%) · ${storageStats.projectCount} projects`
                  : `${storageStats.projectCount} projects stored locally`}
              </p>
            </div>
          </div>

          {projects.length > 0 && (
            <button
              type="button"
              onClick={() => setClearAllOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#EA4335]/30 px-3 text-xs font-medium text-[#EA4335] hover:bg-[#EA4335]/8 whitespace-nowrap shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear local projects</span>
            </button>
          )}
        </div>

        {storageStats.supported && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E8EAED] dark:bg-[#232B38]">
            <div
              style={{ width: `${Math.max(1, storageStats.percentUsed)}%` }}
              className={`h-full rounded-full ${
                isStorageHigh ? 'bg-[#EA4335]' : 'bg-[#4285F4]'
              }`}
            />
          </div>
        )}

        {(isStorageHigh || storageError) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#EA4335]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {storageError ||
                'Browser storage is above 80% capacity. Delete older projects to avoid autosave failures.'}
            </span>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-60 animate-pulse rounded-2xl border border-[#DADCE0] bg-white dark:border-[#2B3340] dark:bg-[#171E29]"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#DADCE0] bg-white px-6 py-16 text-center dark:border-[#2B3340] dark:bg-[#171E29]">
          <FolderKanban className="h-10 w-10 text-[#5F6368] dark:text-[#9AA0A6]" />
          <h2 className="mt-3 text-base font-semibold text-[#202124] dark:text-[#F1F3F4]">
            No projects saved yet
          </h2>
          <p className="mt-1 max-w-md text-sm text-[#5F6368] dark:text-[#9AA0A6]">
            Start editing a photo or designing a collage to automatically store your work in local
            IndexedDB.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => {
            const isRenaming = editingId === proj.id;
            return (
              <div
                key={proj.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#DADCE0] bg-white transition-shadow hover:shadow-md dark:border-[#2B3340] dark:bg-[#171E29]"
              >
                <button
                  type="button"
                  onClick={() => onOpenProject(proj)}
                  className="group relative aspect-[4/3] w-full overflow-hidden bg-[#F1F3F4] dark:bg-[#232B38]"
                >
                  {proj.thumbnailDataUrl ? (
                    <img
                      src={proj.thumbnailDataUrl}
                      alt={proj.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[#5F6368]">
                      No preview
                    </div>
                  )}
                </button>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    {isRenaming ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={draftName}
                          autoFocus
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              void onRenameProject(proj.id, draftName);
                              setEditingId(null);
                            } else if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          className="min-w-0 flex-1 rounded-lg border border-[#4285F4] bg-[#F8FAFD] px-2.5 py-1 text-sm dark:bg-[#0F141C]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            void onRenameProject(proj.id, draftName);
                            setEditingId(null);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4285F4] text-white"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenProject(proj)}
                        className="block w-full truncate text-left text-sm font-semibold text-[#202124] hover:text-[#1A73E8] dark:text-[#F1F3F4] dark:hover:text-[#8AB4F8]"
                      >
                        {proj.name}
                      </button>
                    )}

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                      {proj.type === 'collage' ? (
                        <LayoutGrid className="h-3.5 w-3.5" />
                      ) : (
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {proj.type === 'collage' ? 'Collage' : 'Photo Edit'} · Updated{' '}
                        {formatRelativeDate(proj.updatedAt)}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#DADCE0]/70 pt-3 dark:border-[#2B3340]">
                    <button
                      type="button"
                      onClick={() => onOpenProject(proj)}
                      className="text-xs font-semibold text-[#1A73E8] hover:underline dark:text-[#8AB4F8]"
                    >
                      Open project
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Rename project"
                        onClick={() => {
                          setEditingId(proj.id);
                          setDraftName(proj.name);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#232B38]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete project"
                        onClick={() => setDeleteTarget(proj)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5F6368] hover:bg-[#EA4335]/10 hover:text-[#EA4335] dark:text-[#9AA0A6]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete project?"
        description={`"${deleteTarget?.name ?? ''}" will be permanently removed from your browser's local storage.`}
        confirmLabel="Delete project"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            void onDeleteProject(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={clearAllOpen}
        title="Clear all local projects?"
        description="This will permanently delete all saved Pixora projects from IndexedDB on this browser. Exported files on your device will not be affected."
        confirmLabel="Clear all projects"
        destructive
        onConfirm={() => {
          void onClearAllProjects();
          setClearAllOpen(false);
        }}
        onCancel={() => setClearAllOpen(false)}
      />
    </div>
  );
}

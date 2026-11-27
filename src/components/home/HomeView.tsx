'use client';

import React from 'react';
import Link from 'next/link';
import {
  Aperture,
  ArrowRight,
  Clock,
  Eraser,
  FolderKanban,
  LayoutGrid,
  Minimize2,
  SlidersHorizontal,
} from 'lucide-react';
import { VIEW_PATHS } from '../../lib/navigation';
import { formatRelativeDate } from '../../lib/utilities/format';
import { SAMPLE_PHOTOS, SamplePhotoItem } from '../../lib/utilities/samples';
import { PixoraProject, StudioView } from '../../types/project';
import { DropzoneUpload } from '../shared/DropzoneUpload';

interface HomeViewProps {
  recentTools: StudioView[];
  recentProjects: PixoraProject[];
  isLoadingUpload: boolean;
  uploadError: string | null;
  uploadWarning: string | null;
  onFilesUploaded: (files: FileList) => void;
  onSamplePicked: (sample: SamplePhotoItem) => void;
  onOpenProject: (project: PixoraProject) => void;
}

interface ToolFeatureCard {
  id: StudioView;
  title: string;
  description: string;
  thumbnail: string;
  icon: React.ComponentType<{ className?: string }>;
  meta: string;
}

const FEATURE_CARDS: ToolFeatureCard[] = [
  {
    id: 'editor',
    title: 'Photo Editor',
    description:
      'Non-destructive exposure, tone, color balance, sharpness, freeform crop, straighten, and resize.',
    thumbnail: SAMPLE_PHOTOS[0].url,
    icon: SlidersHorizontal,
    meta: '13 adjustments · Before/after',
  },
  {
    id: 'collage',
    title: 'Collage Maker',
    description:
      'Multi-photo grids, Polaroid & scrapbook layouts, custom spacing, gradients, text, and stickers.',
    thumbnail: SAMPLE_PHOTOS[4].url,
    icon: LayoutGrid,
    meta: '15 layouts · 6 canvas sizes',
  },
  {
    id: 'filters',
    title: 'Cinematic Filters',
    description:
      '30 calibrated film, vintage, and cinema grades with live previews, intensity blending, and grain.',
    thumbnail: SAMPLE_PHOTOS[2].url,
    icon: Aperture,
    meta: '30 presets · Custom stacks',
  },
  {
    id: 'background-remover',
    title: 'Background Remover',
    description:
      'Local browser AI segmentation to isolate subjects with transparent PNG export or backdrop swap.',
    thumbnail: SAMPLE_PHOTOS[3].url,
    icon: Eraser,
    meta: 'Client-side AI · Alpha PNG',
  },
  {
    id: 'compressor',
    title: 'Image Compressor',
    description:
      'Batch optimize JPG, WEBP, PNG, and AVIF with target file sizes, resizing, and ZIP download.',
    thumbnail: SAMPLE_PHOTOS[1].url,
    icon: Minimize2,
    meta: 'Batch ZIP · Exact savings',
  },
];

const TOOL_LABELS: Record<StudioView, string> = {
  home: 'Home',
  editor: 'Photo Editor',
  collage: 'Collage Maker',
  filters: 'Cinematic Filters',
  'background-remover': 'Background Remover',
  compressor: 'Image Compressor',
  blog: 'Blog',
  projects: 'My Projects',
  settings: 'Settings',
};

export function HomeView({
  recentTools,
  recentProjects,
  isLoadingUpload,
  uploadError,
  uploadWarning,
  onFilesUploaded,
  onSamplePicked,
  onOpenProject,
}: HomeViewProps) {
  return (
    <div className="w-full max-w-[1300px] px-4 py-8 sm:pl-12 sm:pr-8 sm:py-12">
      {/* Hero Header & Upload Zone */}
      <section className="space-y-6">
        <div className="max-w-2xl space-y-2.5">
          <p className="text-sm font-medium text-[#1A73E8] dark:text-[#8AB4F8]">
            Pixora Studio · Private Client-Side Workspace
          </p>
          <h1
            style={{ textWrap: 'balance' }}
            className="font-display text-3xl font-bold tracking-tight text-[#202124] sm:text-4xl lg:text-[42px] lg:leading-[1.15] dark:text-[#F1F3F4]"
          >
            Make every photo a masterpiece.
          </h1>
          <p className="text-base leading-relaxed text-[#5F6368] dark:text-[#9AA0A6]">
            Edit exposures, grade with 30 cinematic film presets, design multi-photo collages,
            remove backgrounds locally, and batch compress images—directly in your browser with
            zero server uploads.
          </p>
        </div>

        {/* Quick access to recently used tools */}
        {recentTools.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6]">
              <Clock className="h-3.5 w-3.5" />
              <span>Recently used:</span>
            </span>
            {recentTools.map((toolId) => (
              <Link
                key={toolId}
                href={VIEW_PATHS[toolId]}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#DADCE0] bg-white px-3 py-1.5 text-xs font-medium text-[#202124] transition-colors hover:border-[#4285F4] hover:text-[#1A73E8] whitespace-nowrap shrink-0 dark:border-[#2B3340] dark:bg-[#171E29] dark:text-[#F1F3F4] dark:hover:border-[#8AB4F8] dark:hover:text-[#8AB4F8]"
              >
                <span>{TOOL_LABELS[toolId]}</span>
                <ArrowRight className="h-3 w-3 opacity-60" />
              </Link>
            ))}
          </div>
        )}

        <DropzoneUpload
          multiple
          title="Drop photos to start editing"
          subtitle="Upload one photo to open the Photo Editor, or drop multiple images to launch the Collage Maker or Batch Compressor."
          buttonLabel="Browse files"
          isLoading={isLoadingUpload}
          error={uploadError}
          warning={uploadWarning}
          onFilesSelected={onFilesUploaded}
          onSampleSelected={onSamplePicked}
        />
      </section>

      {/* Feature Cards for Each Studio Tool */}
      <section className="mt-12 space-y-5">
        <div className="flex items-end justify-between gap-4 border-b border-[#DADCE0] pb-3 dark:border-[#2B3340]">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#202124] dark:text-[#F1F3F4]">
              Creative Tools
            </h2>
            <p className="text-sm text-[#5F6368] dark:text-[#9AA0A6]">
              Choose a dedicated studio workspace for your current task
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={VIEW_PATHS[card.id]}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#DADCE0] bg-white text-left transition-all hover:border-[#4285F4] hover:shadow-md dark:border-[#2B3340] dark:bg-[#171E29] dark:hover:border-[#8AB4F8]"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F1F3F4] dark:bg-[#232B38]">
                  <img
                    src={card.thumbnail}
                    alt={card.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-semibold text-[#202124] group-hover:text-[#1A73E8] dark:text-[#F1F3F4] dark:group-hover:text-[#8AB4F8]">
                        {card.title}
                      </h3>
                      <Icon className="h-4.5 w-4.5 text-[#5F6368] group-hover:text-[#1A73E8] dark:text-[#9AA0A6] dark:group-hover:text-[#8AB4F8]" />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#5F6368] dark:text-[#9AA0A6]">
                      {card.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#DADCE0]/60 pt-3 text-xs text-[#5F6368] dark:border-[#2B3340] dark:text-[#9AA0A6]">
                    <span>{card.meta}</span>
                    <span className="font-medium text-[#1A73E8] dark:text-[#8AB4F8]">Open</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Projects */}
      <section className="mt-12 space-y-5">
        <div className="flex items-end justify-between gap-4 border-b border-[#DADCE0] pb-3 dark:border-[#2B3340]">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#202124] dark:text-[#F1F3F4]">
              Recent Projects
            </h2>
            <p className="text-sm text-[#5F6368] dark:text-[#9AA0A6]">
              Automatically saved locally in your browser
            </p>
          </div>
          {recentProjects.length > 0 && (
            <Link
              href={VIEW_PATHS.projects}
              className="text-sm font-medium text-[#1A73E8] hover:underline whitespace-nowrap shrink-0 dark:text-[#8AB4F8]"
            >
              View all projects
            </Link>
          )}
        </div>

        {recentProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#DADCE0] bg-white px-6 py-10 text-center dark:border-[#2B3340] dark:bg-[#171E29]">
            <FolderKanban className="h-8 w-8 text-[#5F6368] dark:text-[#9AA0A6]" />
            <h3 className="mt-3 text-sm font-semibold text-[#202124] dark:text-[#F1F3F4]">
              No saved projects yet
            </h3>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-[#5F6368] dark:text-[#9AA0A6]">
              When you edit a photo or design a collage, Pixora automatically saves your progress
              to local IndexedDB so you can pick up right where you left off.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentProjects.slice(0, 4).map((proj) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => onOpenProject(proj)}
                className="group overflow-hidden rounded-2xl border border-[#DADCE0] bg-white text-left transition-all hover:border-[#4285F4] dark:border-[#2B3340] dark:bg-[#171E29] dark:hover:border-[#8AB4F8]"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#F1F3F4] dark:bg-[#232B38]">
                  {proj.thumbnailDataUrl ? (
                    <img
                      src={proj.thumbnailDataUrl}
                      alt={proj.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[#5F6368]">
                      Preview unavailable
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="truncate text-sm font-semibold text-[#202124] dark:text-[#F1F3F4]">
                    {proj.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                    {proj.type === 'collage' ? 'Collage' : 'Photo Edit'} ·{' '}
                    {formatRelativeDate(proj.updatedAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
import { ActiveFilterState } from './filters';
import { CollageState } from './collage';
import { ImageAdjustments, TransformState } from './image';

export type StudioView =
  | 'home'
  | 'editor'
  | 'collage'
  | 'filters'
  | 'background-remover'
  | 'compressor'
  | 'blog'
  | 'projects'
  | 'settings';

export type ProjectType = 'photo-edit' | 'collage' | 'filter-grade';

export interface EditorProjectPayload {
  imageName: string;
  imageMimeType: string;
  imageWidth: number;
  imageHeight: number;
  imageSizeBytes: number;
  /** Stored as compressed/original Blob or data URL in IndexedDB */
  imageDataUrl: string;
  adjustments: ImageAdjustments;
  transform: TransformState;
  filter: ActiveFilterState;
}

export interface CollageProjectPayload {
  collage: CollageState;
}

export interface PixoraProject {
  id: string;
  name: string;
  type: ProjectType;
  createdAt: number;
  updatedAt: number;
  thumbnailDataUrl: string;
  editorData?: EditorProjectPayload;
  collageData?: CollageProjectPayload;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  defaultExportFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  defaultExportQuality: number; // 10..100
  autoSaveEnabled: boolean;
  recentTools: StudioView[];
  preserveExifNoticeDismissed: boolean;
}

export interface StorageStats {
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
  projectCount: number;
  supported: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'light',
  defaultExportFormat: 'image/png',
  defaultExportQuality: 92,
  autoSaveEnabled: true,
  recentTools: ['editor', 'filters', 'collage'],
  preserveExifNoticeDismissed: false,
};

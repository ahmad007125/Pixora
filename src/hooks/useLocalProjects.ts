import { useCallback, useEffect, useState } from 'react';
import {
  clearAllProjects,
  deleteCustomFilter,
  deleteProject,
  getStorageStats,
  listCustomFilters,
  listProjects,
  saveCustomFilter,
  saveProject,
} from '../lib/storage/indexedDb';
import { SavedCustomFilter } from '../types/filters';
import { PixoraProject, StorageStats } from '../types/project';

export function useLocalProjects() {
  const [projects, setProjects] = useState<PixoraProject[]>([]);
  const [customFilters, setCustomFilters] = useState<SavedCustomFilter[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats>({
    usedBytes: 0,
    quotaBytes: 0,
    percentUsed: 0,
    projectCount: 0,
    supported: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    try {
      setStorageError(null);
      const [projList, filterList, stats] = await Promise.all([
        listProjects(),
        listCustomFilters(),
        getStorageStats(),
      ]);
      setProjects(projList);
      setCustomFilters(filterList);
      setStorageStats(stats);
    } catch (err) {
      setStorageError(err instanceof Error ? err.message : 'Unable to access local browser storage.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const upsertProject = useCallback(
    async (project: PixoraProject) => {
      try {
        await saveProject(project);
        await refreshAll();
      } catch (err) {
        setStorageError(
          err instanceof Error
            ? err.message
            : 'Browser storage limit reached. Delete old projects to free space.'
        );
        throw err;
      }
    },
    [refreshAll]
  );

  const renameProject = useCallback(
    async (projectId: string, nextName: string) => {
      const target = projects.find((p) => p.id === projectId);
      if (!target) return;
      const trimmed = nextName.trim();
      if (!trimmed) return;
      await upsertProject({
        ...target,
        name: trimmed,
        updatedAt: Date.now(),
      });
    },
    [projects, upsertProject]
  );

  const removeProject = useCallback(
    async (projectId: string) => {
      await deleteProject(projectId);
      await refreshAll();
    },
    [refreshAll]
  );

  const wipeProjects = useCallback(async () => {
    await clearAllProjects();
    await refreshAll();
  }, [refreshAll]);

  const addCustomFilter = useCallback(
    async (filter: SavedCustomFilter) => {
      await saveCustomFilter(filter);
      await refreshAll();
    },
    [refreshAll]
  );

  const removeCustomFilter = useCallback(
    async (id: string) => {
      await deleteCustomFilter(id);
      await refreshAll();
    },
    [refreshAll]
  );

  return {
    projects,
    customFilters,
    storageStats,
    isLoading,
    storageError,
    refreshAll,
    upsertProject,
    renameProject,
    removeProject,
    wipeProjects,
    addCustomFilter,
    removeCustomFilter,
  };
}

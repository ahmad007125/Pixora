import { SavedCustomFilter } from '../../types/filters';
import { PixoraProject, StorageStats } from '../../types/project';

const DB_NAME = 'pixora_studio_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_CUSTOM_FILTERS = 'custom_filters';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser context.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const projectStore = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CUSTOM_FILTERS)) {
        db.createObjectStore(STORE_CUSTOM_FILTERS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });
}

export async function listProjects(): Promise<PixoraProject[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result as PixoraProject[]).sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error ?? new Error('Failed to load projects.'));
  });
}

export async function getProjectById(id: string): Promise<PixoraProject | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.get(id);
    req.onsuccess = () => resolve((req.result as PixoraProject | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error('Failed to load project.'));
  });
}

export async function saveProject(project: PixoraProject): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.put(project);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to save project locally.'));
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to delete project.'));
  });
}

export async function clearAllProjects(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to clear projects.'));
  });
}

export async function listCustomFilters(): Promise<SavedCustomFilter[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CUSTOM_FILTERS, 'readonly');
    const store = tx.objectStore(STORE_CUSTOM_FILTERS);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result as SavedCustomFilter[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error ?? new Error('Failed to load custom filters.'));
  });
}

export async function saveCustomFilter(filter: SavedCustomFilter): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CUSTOM_FILTERS, 'readwrite');
    const store = tx.objectStore(STORE_CUSTOM_FILTERS);
    const req = store.put(filter);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to save custom filter.'));
  });
}

export async function deleteCustomFilter(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CUSTOM_FILTERS, 'readwrite');
    const store = tx.objectStore(STORE_CUSTOM_FILTERS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to delete custom filter.'));
  });
}

export async function getStorageStats(): Promise<StorageStats> {
  let projectCount = 0;
  try {
    const projects = await listProjects();
    projectCount = projects.length;
  } catch {
    projectCount = 0;
  }

  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      const usedBytes = est.usage ?? 0;
      const quotaBytes = est.quota ?? 0;
      const percentUsed = quotaBytes > 0 ? Math.min(100, (usedBytes / quotaBytes) * 100) : 0;
      return {
        usedBytes,
        quotaBytes,
        percentUsed,
        projectCount,
        supported: true,
      };
    } catch {
      return { usedBytes: 0, quotaBytes: 0, percentUsed: 0, projectCount, supported: false };
    }
  }

  return { usedBytes: 0, quotaBytes: 0, percentUsed: 0, projectCount, supported: false };
}

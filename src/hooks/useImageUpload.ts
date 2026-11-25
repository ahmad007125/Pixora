import { useCallback, useState } from 'react';
import { loadImageFromFile, loadImageFromUrl } from '../lib/file-handling/imageLoader';
import { LoadedImage } from '../types/image';

export interface UploadedImageBundle {
  image: LoadedImage;
  element: HTMLImageElement;
}

export function useImageUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setWarning(null);
  }, []);

  const processFiles = useCallback(async (fileList: FileList | File[]): Promise<UploadedImageBundle[]> => {
    const files = Array.from(fileList);
    if (files.length === 0) return [];

    setIsLoading(true);
    setError(null);
    setWarning(null);

    const results: UploadedImageBundle[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of files) {
      try {
        const bundle = await loadImageFromFile(file);
        results.push(bundle);
        if (bundle.image.warningMessage) {
          warnings.push(`${file.name}: ${bundle.image.warningMessage}`);
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `Failed to load ${file.name}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }
    if (warnings.length > 0) {
      setWarning(warnings.join(' '));
    }

    setIsLoading(false);
    return results;
  }, []);

  const processSampleUrl = useCallback(async (url: string, name: string): Promise<UploadedImageBundle | null> => {
    setIsLoading(true);
    setError(null);
    setWarning(null);
    try {
      const bundle = await loadImageFromUrl(url, name);
      setIsLoading(false);
      return bundle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sample image.');
      setIsLoading(false);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    warning,
    setError,
    setWarning,
    clearMessages,
    processFiles,
    processSampleUrl,
  };
}

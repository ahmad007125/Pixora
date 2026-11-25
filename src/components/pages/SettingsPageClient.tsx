'use client';

import { SettingsView } from '../settings/SettingsView';
import { useStudio } from '../studio/StudioProvider';

export function SettingsPageClient() {
  const { settings, localProjects, handleUpdateSettings } = useStudio();

  return (
    <SettingsView
      settings={settings}
      storageStats={localProjects.storageStats}
      onUpdateSettings={handleUpdateSettings}
      onClearAllProjects={localProjects.wipeProjects}
    />
  );
}

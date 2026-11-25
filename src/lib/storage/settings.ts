import { DEFAULT_USER_SETTINGS, StudioView, UserSettings } from '../../types/project';

const SETTINGS_STORAGE_KEY = 'pixora_user_settings_v1';

export function loadUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      ...DEFAULT_USER_SETTINGS,
      ...parsed,
      recentTools: Array.isArray(parsed.recentTools)
        ? parsed.recentTools
        : DEFAULT_USER_SETTINGS.recentTools,
    };
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

export function saveUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore quota failures for lightweight preferences
  }
}

export function recordRecentTool(current: UserSettings, view: StudioView): UserSettings {
  if (view === 'home' || view === 'projects' || view === 'settings') return current;
  const filtered = current.recentTools.filter((item) => item !== view);
  const next: UserSettings = {
    ...current,
    recentTools: [view, ...filtered].slice(0, 4),
  };
  saveUserSettings(next);
  return next;
}

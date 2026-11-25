import React, { useState } from 'react';
import {
  Aperture,
  Eraser,
  FolderKanban,
  Home,
  LayoutGrid,
  Menu,
  Minimize2,
  Moon,
  Settings,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import { StudioView } from '../../types/project';

export interface NavItem {
  id: StudioView;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const STUDIO_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', shortLabel: 'Home', icon: Home },
  { id: 'editor', label: 'Photo Editor', shortLabel: 'Editor', icon: SlidersHorizontal },
  { id: 'collage', label: 'Collage Maker', shortLabel: 'Collage', icon: LayoutGrid },
  { id: 'filters', label: 'Cinematic Filters', shortLabel: 'Filters', icon: Aperture },
  { id: 'background-remover', label: 'Background Remover', shortLabel: 'Cutout', icon: Eraser },
  { id: 'compressor', label: 'Image Compressor', shortLabel: 'Compress', icon: Minimize2 },
  { id: 'projects', label: 'My Projects', shortLabel: 'Projects', icon: FolderKanban },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

interface StudioShellProps {
  activeView: StudioView;
  theme: 'light' | 'dark';
  projectCount: number;
  onNavigate: (view: StudioView) => void;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export function StudioShell({
  activeView,
  theme,
  projectCount,
  onNavigate,
  onToggleTheme,
  children,
}: StudioShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeMeta = STUDIO_NAV_ITEMS.find((i) => i.id === activeView) ?? STUDIO_NAV_ITEMS[0];

  const handleNavClick = (view: StudioView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFD] text-[#202124] dark:bg-[#0F141C] dark:text-[#F1F3F4] lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-[#DADCE0] lg:bg-white dark:lg:border-[#2B3340] dark:lg:bg-[#171E29]">
        <div className="flex h-16 items-center gap-3 border-b border-[#DADCE0] px-5 dark:border-[#2B3340]">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285F4]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4285F4] text-white shadow-xs">
              <Aperture className="h-4.5 w-4.5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-[#202124] dark:text-[#F1F3F4] whitespace-nowrap">
              PIXORA
            </span>
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Primary navigation">
          {STUDIO_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#4285F4]/18 dark:text-[#8AB4F8]'
                    : 'text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124] dark:text-[#9AA0A6] dark:hover:bg-[#1F2735] dark:hover:text-[#F1F3F4]'
                }`}
              >
                <span className="flex items-center gap-3 truncate">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'projects' && projectCount > 0 && (
                  <span className="font-mono-num text-xs opacity-75">{projectCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#DADCE0] p-3 dark:border-[#2B3340]">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex min-h-10 w-full items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium text-[#5F6368] transition-colors hover:bg-[#F1F3F4] hover:text-[#202124] dark:text-[#9AA0A6] dark:hover:bg-[#1F2735] dark:hover:text-[#F1F3F4]"
          >
            <span className="flex items-center gap-3 whitespace-nowrap">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile / Tablet Compact Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#DADCE0] bg-white/95 px-4 backdrop-blur-sm dark:border-[#2B3340] dark:bg-[#171E29]/95 lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#1F2735]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4285F4] text-white">
              <Aperture className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-bold tracking-tight whitespace-nowrap">
              PIXORA
            </span>
          </button>
          <span className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">· {activeMeta.label}</span>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle color theme"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#1F2735]"
        >
          {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
        </button>
      </header>

      {/* Mobile Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <nav
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile navigation"
            className="h-full w-72 max-w-[82vw] space-y-1 border-r border-[#DADCE0] bg-white p-4 dark:border-[#2B3340] dark:bg-[#171E29]"
          >
            <div className="mb-4 flex items-center justify-between px-2">
              <span className="font-display text-lg font-bold">PIXORA</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5F6368]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {STUDIO_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                    active
                      ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#4285F4]/18 dark:text-[#8AB4F8]'
                      : 'text-[#5F6368] hover:bg-[#F1F3F4] dark:text-[#9AA0A6] dark:hover:bg-[#1F2735]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.label}</span>
                  </span>
                  {item.id === 'projects' && projectCount > 0 && (
                    <span className="font-mono-num text-xs opacity-75">{projectCount}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">{children}</main>

      {/* Mobile Compact Bottom Navigation (<= 10% viewport height) */}
      <nav
        aria-label="Quick studio tools"
        className="fixed inset-x-0 bottom-0 z-30 grid h-14 grid-cols-5 border-t border-[#DADCE0] bg-white/95 backdrop-blur-sm dark:border-[#2B3340] dark:bg-[#171E29]/95 lg:hidden"
      >
        {STUDIO_NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                active
                  ? 'text-[#1A73E8] dark:text-[#8AB4F8]'
                  : 'text-[#5F6368] dark:text-[#9AA0A6]'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span className="truncate">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

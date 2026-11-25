import { StudioView } from '../types/project';

export const VIEW_PATHS: Record<StudioView, string> = {
  home: '/',
  editor: '/editor',
  collage: '/collage',
  filters: '/filters',
  'background-remover': '/background-remover',
  compressor: '/compressor',
  blog: '/blog',
  projects: '/projects',
  settings: '/settings',
};

export function pathToView(pathname: string): StudioView {
  if (pathname === '/' || pathname === '') return 'home';
  if (pathname === '/blog' || pathname.startsWith('/blog/')) return 'blog';

  const segment = pathname.replace(/^\//, '').split('/')[0];
  const match = (Object.keys(VIEW_PATHS) as StudioView[]).find(
    (view) => view !== 'home' && VIEW_PATHS[view] === `/${segment}`
  );
  return match ?? 'home';
}

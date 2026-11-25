import type { MetadataRoute } from 'next';
import { getAllPosts } from '../lib/blog/posts';
import { SITE_URL } from '../lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const toolRoutes = [
    '',
    '/editor',
    '/collage',
    '/filters',
    '/background-remover',
    '/compressor',
    '/blog',
  ];

  const staticEntries: MetadataRoute.Sitemap = toolRoutes.map((path) => ({
    url: `${SITE_URL}${path || '/'}`,
    lastModified: new Date('2026-11-25'),
    changeFrequency: path === '/blog' || path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/blog' ? 0.8 : 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}

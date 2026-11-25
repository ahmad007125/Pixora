import type { Metadata } from 'next';
import { BlogIndex } from '../../../components/blog/BlogIndex';
import { getAllPosts } from '../../../lib/blog/posts';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Pixora guides on private photo editing, cinematic color grading, collage layout, image compression, and on-device background removal.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Pixora Blog',
    description:
      'Guides for editing photos in the browser without uploading originals to a server.',
    type: 'website',
  },
};

export default function BlogPage() {
  return <BlogIndex posts={getAllPosts()} />;
}

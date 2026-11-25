import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BlogPost } from '../../lib/blog/posts';

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BlogIndex({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-8 sm:px-8 sm:py-10">
      <header className="max-w-2xl space-y-3">
        <p className="text-sm font-medium text-[#1A73E8] dark:text-[#8AB4F8]">Pixora Journal</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#202124] sm:text-4xl dark:text-[#F1F3F4]">
          Guides for private, browser-based photo work
        </h1>
        <p className="text-base leading-relaxed text-[#5F6368] dark:text-[#9AA0A6]">
          Practical notes on editing, grading, collages, compression, and on-device background
          removal—written for people who want the result without sending originals to a server.
        </p>
      </header>

      <div className="mt-10 grid gap-5">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="overflow-hidden rounded-2xl border border-[#DADCE0] bg-white dark:border-[#2B3340] dark:bg-[#171E29]"
          >
            <Link href={`/blog/${post.slug}`} className="group grid md:grid-cols-[240px_1fr]">
              <div className={`min-h-40 bg-gradient-to-br ${post.coverGradient} md:min-h-full`} />
              <div className="flex flex-col justify-between p-5 sm:p-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#5F6368] dark:text-[#9AA0A6]">
                    {post.category} · {formatDate(post.publishedAt)} · {post.readTime}
                  </p>
                  <h2 className="font-display mt-2 text-xl font-semibold text-[#202124] group-hover:text-[#1A73E8] dark:text-[#F1F3F4] dark:group-hover:text-[#8AB4F8]">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#5F6368] dark:text-[#9AA0A6]">
                    {post.excerpt}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#1A73E8] dark:text-[#8AB4F8]">
                  Read article
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

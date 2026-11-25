import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SITE_NAME, SITE_URL } from '../../lib/site';
import { BlogPost } from '../../lib/blog/posts';

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BlogArticle({ post, related }: { post: BlogPost; related: BlogPost[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    keywords: post.tags.join(', '),
  };

  return (
    <article className="mx-auto w-full max-w-[760px] px-4 py-8 sm:px-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1A73E8] dark:text-[#8AB4F8]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All articles
      </Link>

      <header className="mt-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[#5F6368] dark:text-[#9AA0A6]">
          {post.category} · {formatDate(post.publishedAt)} · {post.readTime}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#202124] sm:text-4xl dark:text-[#F1F3F4]">
          {post.title}
        </h1>
        <p className="text-base leading-relaxed text-[#5F6368] dark:text-[#9AA0A6]">{post.excerpt}</p>
      </header>

      <div className={`mt-8 h-44 rounded-2xl bg-gradient-to-br ${post.coverGradient} sm:h-56`} />

      <div className="mt-8 space-y-8">
        {post.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="font-display text-xl font-semibold text-[#202124] dark:text-[#F1F3F4]">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="text-[15px] leading-relaxed text-[#3C4043] dark:text-[#DADCE0]">
                {paragraph}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[#3C4043] dark:text-[#DADCE0]">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {related.length > 0 && (
        <aside className="mt-12 border-t border-[#DADCE0] pt-8 dark:border-[#2B3340]">
          <h2 className="font-display text-lg font-semibold text-[#202124] dark:text-[#F1F3F4]">
            Continue reading
          </h2>
          <ul className="mt-4 space-y-3">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/blog/${item.slug}`}
                  className="text-sm font-medium text-[#1A73E8] hover:underline dark:text-[#8AB4F8]"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
